import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Sparkles, LogIn, LogOut, Send, RefreshCw, Download, AlertCircle, CheckCircle2, Clock, Upload, UserPlus } from 'lucide-react';

// ============================================================
// AI STUDIO CUSTOMER: the customer gives the input and gets the result. Sees only their own tasks.
// ============================================================

const SUPABASE_URL = "https://kdwkdhjtcebrhtokhirg.supabase.co";
// Publishable key: safe in the app code (row security protects the data)
const SUPABASE_KEY = "sb_publishable_lRLDmrcgSfw7RNL5FtzFdg_3N_rWS8r";
const CLOUDINARY_CLOUD_NAME = "draaqjcre";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const REFRESH_MS = 20000;

// ── API: every call the app makes, named in one place ──
// Database function (sb.rpc)
const API = {
    CREATE_TASK: 'customer_create_task',           // UPLOAD a new task (the server sets the customer id)
    GET_CATALOG: 'get_task_catalog',               // GET the task types this app shows (from the database)
    GET_FAMILY_ROLES: 'get_family_roles',          // GET the family photo slots, in order (from the database)
    GET_MODELS: 'get_model_list',                  // GET the AI models (image and text), with aspect ratios and sizes
    GET_APPS: 'get_app_list'                       // GET the apps (WearGen, PPP ...) this customer can pick
};

// Database table (sb.from). RLS returns only this customer's rows.
const TABLES = {
    TASKS: 'ai_studio_tasks',                      // GET my tasks
    SETTINGS: 'ai_studio_settings'                 // GET the maintenance message
};

// External service
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`; // UPLOAD a photo

// The models a customer uses are chosen by the app, so the customer only fills in the input

// What a customer can ask for, in plain words
// What a customer can ask for. The database (ai_studio_task_catalog) gives the list when the app starts.
const EMPTY_KIND = { label: '', output: 'text', inputs: [], labels: {}, optional: [], extras: false, promptRequired: false, hint: '' };
function toKind(r) {
    return {
        label: r.customer_label || r.label,
        output: r.output,
        inputs: r.inputs || [],
        labels: r.customer_labels || r.labels || {},
        optional: r.optional || [],
        extras: !!r.extras,
        family: !!r.family,
        promptRequired: !!r.prompt_required,
        edit: !!r.edit,
        hint: r.hint || '',
        apps: r.apps || []                          // the apps that show this type
    };
}
function toKinds(rows) {
    const out = {};
    (rows || []).filter(r => r.customer_visible).forEach(r => { out[r.task_type] = toKind(r); });
    return out;
}
const INPUT_LABEL = { face: 'Apna chehra (face) ki photo', style: 'Style / kapde / scene ki photo', input: 'Photo' };
const INPUT_COLUMN = { face: 'face_image_url', style: 'style_image_url', input: 'input_image_url' };
// Name of an input for this kind (person and product kinds name them differently)
const labelFor = (kind, key) => kind.labels?.[key] || INPUT_LABEL[key];


// Upload a picture that is already in data-URL form (the brush mask)
async function uploadDataUrl(dataUrl) {
    const fd = new FormData();
    fd.append('file', dataUrl);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const data = await (await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: fd })).json();
    if (!data.secure_url) throw new Error(data.error?.message || 'Mask upload nahi hui');
    return data.secure_url;
}

// Brush: paint over the photo. Painted area = red. Save gives a black/red mask (red = the area to edit).
function MaskEditor({ src, onSave }) {
    const imgRef = useRef(null);
    const canvasRef = useRef(null);
    const drawing = useRef(false);
    const last = useRef(null);
    const undoStack = useRef([]);
    const [size, setSize] = useState(40);
    const [ready, setReady] = useState(false);

    const onImgLoad = () => {
        const c = canvasRef.current;
        c.width = imgRef.current.naturalWidth;
        c.height = imgRef.current.naturalHeight;
        undoStack.current = [];
        setReady(true);
    };
    const point = (e) => {
        const r = canvasRef.current.getBoundingClientRect();
        const p = e.touches ? e.touches[0] : e;
        return { x: (p.clientX - r.left) * canvasRef.current.width / r.width, y: (p.clientY - r.top) * canvasRef.current.height / r.height };
    };
    const snapshot = () => {
        const c = canvasRef.current;
        undoStack.current.push(c.getContext('2d').getImageData(0, 0, c.width, c.height));
        if (undoStack.current.length > 20) undoStack.current.shift();
    };
    const start = (e) => {
        if (!ready) return;
        snapshot();
        drawing.current = true;
        last.current = point(e);
    };
    const move = (e) => {
        if (!drawing.current) return;
        const ctx = canvasRef.current.getContext('2d');
        const p = point(e);
        ctx.strokeStyle = 'rgb(255, 0, 0)';
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(last.current.x, last.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        last.current = p;
    };
    const stop = () => { drawing.current = false; };
    const undo = () => {
        const prev = undoStack.current.pop();
        if (prev) canvasRef.current.getContext('2d').putImageData(prev, 0, 0);
    };
    const clear = () => {
        snapshot();
        const c = canvasRef.current;
        c.getContext('2d').clearRect(0, 0, c.width, c.height);
    };
    const save = () => {
        const c = canvasRef.current;
        const out = document.createElement('canvas');
        out.width = c.width;
        out.height = c.height;
        const o = out.getContext('2d');
        o.fillStyle = '#000';
        o.fillRect(0, 0, out.width, out.height);
        o.drawImage(c, 0, 0);
        onSave(out.toDataURL('image/jpeg', 0.92));
    };

    return (
        <div className="space-y-2">
            <div className="relative w-full select-none">
                <img ref={imgRef} src={src} onLoad={onImgLoad} alt="" className="w-full rounded-xl block" />
                <canvas
                    ref={canvasRef}
                    onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
                    onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
                    style={{ touchAction: 'none' }}
                    className="absolute inset-0 w-full h-full rounded-xl opacity-50 cursor-crosshair"
                />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-300">
                <label className="flex items-center gap-2">Brush <input type="range" min={4} max={200} value={size} onChange={e => setSize(Number(e.target.value))} /> {size}px</label>
                <button type="button" onClick={undo} className="h-9 px-3 rounded-xl border border-white/10 bg-stone-800 font-bold">Undo</button>
                <button type="button" onClick={clear} className="h-9 px-3 rounded-xl border border-white/10 bg-stone-800 font-bold">Clear</button>
                <button type="button" onClick={save} className="h-9 px-3 rounded-xl bg-yellow-400 text-stone-950 font-black">Area pakka karo</button>
            </div>
        </div>
    );
}

// The mask part of an edit form: the photo with the brush over it
function MaskBlock({ label, photoUrl, maskUrl, onSave }) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-bold text-stone-200">{label}</p>
            {!photoUrl ? (
                <p className="text-[11px] text-stone-400">Pehle upar edit wali photo ka link ya upload karo.</p>
            ) : (
                <MaskEditor key={photoUrl} src={photoUrl} onSave={onSave} />
            )}
            {maskUrl && <p className="text-[11px] text-emerald-300">Area save ho gaya. Photo badlo to area dobara pakka karo.</p>}
        </div>
    );
}

// How the customer sees the status
const STATUS_TEXT = {
    pending: { text: 'Queue mein hai', icon: Clock, cls: 'text-stone-300 bg-stone-800 border-white/10' },
    processing: { text: 'Ban raha hai...', icon: RefreshCw, cls: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
    done: { text: 'Tayyar hai', icon: CheckCircle2, cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
    failed: { text: 'Problem aayi', icon: AlertCircle, cls: 'text-rose-300 bg-rose-500/10 border-rose-500/30' }
};

// Makes a photo smaller before it is uploaded: at most 2048 px, JPEG, white behind any transparent part
function compressFile(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = reject;
        r.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Photo padh nahi paayi'));
            img.onload = () => {
                const k = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight));
                const c = document.createElement('canvas');
                c.width = Math.round(img.naturalWidth * k);
                c.height = Math.round(img.naturalHeight * k);
                const ctx = c.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, c.width, c.height);
                ctx.drawImage(img, 0, 0, c.width, c.height);
                resolve(c.toDataURL('image/jpeg', 0.85));
            };
            img.src = r.result;
        };
        r.readAsDataURL(file);
    });
}

async function uploadFile(file) {
    const dataUrl = await compressFile(file);
    const fd = new FormData();
    fd.append('file', dataUrl);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const data = await (await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: fd })).json();
    if (!data.secure_url) throw new Error(data.error?.message || 'Photo upload nahi hui');
    return data.secure_url;
}

let supabaseLoading = null;
function loadClient(anonKey) {
    if (!window.supabase) {
        if (!supabaseLoading) {
            supabaseLoading = new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                s.onload = () => resolve();
                s.onerror = () => reject(new Error('Supabase load nahi hua'));
                document.head.appendChild(s);
            });
        }
        return supabaseLoading.then(() => window.supabase.createClient(SUPABASE_URL, anonKey));
    }
    return Promise.resolve(window.supabase.createClient(SUPABASE_URL, anonKey));
}

const EMPTY = { task_type: 'image_to_image_prompt', prompt: '', aspect_ratio: '4:5', image_size: '2K', batch_count: 1, face_image_url: '', style_image_url: '', input_image_url: '', extra_image_urls: '', family_urls: ['', '', '', '', '', ''], conversation_id: '' };

export default function AiStudioCustomer() {
    const [anonKey, setAnonKey] = useState(SUPABASE_KEY);
    const [sb, setSb] = useState(null);
    const [session, setSession] = useState(null);
    const [mode, setMode] = useState('login');      // 'login' | 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMsg, setAuthMsg] = useState('');
    const [screen, setScreen] = useState('new');    // 'new' | 'mine'
    const [form, setForm] = useState(EMPTY);
    const [sending, setSending] = useState(false);
    const [msg, setMsg] = useState('');
    const [maint, setMaint] = useState(null);
    const [kinds, setKinds] = useState({});   // the task types this app shows, from the database
    const [familyRoles, setFamilyRoles] = useState([]);   // the family photo slots, from the database
    const [models, setModels] = useState([]);             // the AI models, from the database
    const [apps, setApps] = useState([]);                 // the apps (WearGen, PPP ...), from the database
    const [appId, setAppId] = useState('weargen');        // the app the customer is working in

    // The AI models come from the database (ai_studio_models)
    useEffect(() => {
        if (!sb) return;
        sb.rpc(API.GET_MODELS).then(({ data }) => { if (data) setModels(data); });
    }, [sb]);

    // The family photo slots come from the database; the form keeps one slot per role
    useEffect(() => {
        if (!sb) return;
        sb.rpc(API.GET_FAMILY_ROLES).then(({ data }) => {
            if (!data) return;
            setFamilyRoles(data);
            setForm(f => ({ ...f, family_urls: data.map((_, i) => f.family_urls[i] || '') }));
        });
    }, [sb]);

    // Load the task types from the database (ai_studio_task_catalog) once connected
    useEffect(() => {
        if (!sb) return;
        sb.rpc(API.GET_CATALOG).then(({ data }) => {
            if (!data) return;
            const map = toKinds(data);
            setKinds(map);
            setForm(f => (map[f.task_type] ? f : { ...EMPTY, task_type: Object.keys(map)[0] || f.task_type }));
        });
    }, [sb]);
    const [myTasks, setMyTasks] = useState([]);

    // The apps come from the database; the features shown are only the ones of the chosen app
    useEffect(() => {
        if (!sb) return;
        sb.rpc(API.GET_APPS).then(({ data }) => {
            if (!data?.length) return;
            setApps(data);
            setAppId(id => (data.some(a => a.app_id === id) ? id : data[0].app_id));
        });
    }, [sb]);
    const shownKinds = useMemo(
        () => Object.fromEntries(Object.entries(kinds).filter(([, k]) => k.apps.includes(appId))),
        [kinds, appId]
    );
    // When the app changes, the form moves to the first feature of that app
    useEffect(() => {
        if (shownKinds[form.task_type]) return;
        const first = Object.keys(shownKinds)[0];
        if (first) setForm({ ...EMPTY, task_type: first });
    }, [shownKinds, form.task_type]);

    const kind = shownKinds[form.task_type] || EMPTY_KIND;
    const imageModel = models.find(m => m.kind === 'image' && m.enabled)?.model_id || '';
    const textModel = models.find(m => m.kind === 'text' && m.enabled)?.model_id || '';
    const imageCaps = models.find(m => m.model_id === imageModel);
    const aspects = imageCaps?.aspects?.length ? imageCaps.aspects : ['4:5'];
    const sizes = imageCaps?.sizes || [];

    // Checks before sending (the server checks again)
    const problems = useMemo(() => {
        const p = [];
        for (const key of kind.inputs) {
            if (!kind.optional?.includes(key) && !form[INPUT_COLUMN[key]].trim()) p.push(`${labelFor(kind, key)} daalo`);
        }
        if (kind.promptRequired && !form.prompt.trim()) p.push('Prompt likho');
        if (kind.family && form.family_urls.filter(u => u.trim()).length < 2) p.push('Parivar ki kam se kam 2 photos daalo');
        if (form.batch_count < 1 || form.batch_count > 10) p.push('Photos 1 se 10 ke beech chuno');
        return p;
    }, [form, kind]);

    // ── Connect + session ──
    const connect = () => {
        if (!anonKey) return setMsg('Pehle app ki key daalo');
        loadClient(anonKey).then(client => setSb(client)).catch(err => setMsg('Connect error: ' + err.message));
    };

    useEffect(() => {
        if (!sb) return;
        sb.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
        return () => sub.subscription.unsubscribe();
    }, [sb]);

    const signIn = async () => {
        setAuthMsg('');
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) setAuthMsg('Login nahi hua: ' + error.message);
        setPassword('');
    };

    // Login without email: a guest account (needs "Anonymous sign-ins" on in Supabase Auth settings)
    const guestIn = async () => {
        setAuthMsg('');
        const { error } = await sb.auth.signInAnonymously();
        if (error) setAuthMsg('Bina email login nahi hua: ' + error.message);
    };

    const signUp = async () => {
        setAuthMsg('');
        const { error } = await sb.auth.signUp({ email, password });
        if (error) return setAuthMsg('Account nahi bana: ' + error.message);
        setAuthMsg('Account ban gaya. Agar email verify karna ho to email check karo, phir login karo.');
        setMode('login');
        setPassword('');
    };

    const signOut = async () => { await sb.auth.signOut(); setMyTasks([]); };

    // ── My tasks (RLS returns only this customer's rows) ──
    const loadMine = useCallback(async () => {
        if (!sb || !session) return;
        const { data, error } = await sb.from(TABLES.TASKS)
            .select('id, app_id, task_type, prompt, status, error, output_text, output_image_url, output_image_urls, face_match_score, batch_count, conversation_id, created_at, face_image_url, input_image_url')
            .order('id', { ascending: false })
            .limit(50);
        if (!error) setMyTasks(data || []);
        const { data: s } = await sb.from(TABLES.SETTINGS).select('maintenance_on, maintenance_message').eq('id', 1).single();
        setMaint(s?.maintenance_on ? s.maintenance_message : null);
    }, [sb, session]);

    useEffect(() => {
        if (!sb || !session) return;
        loadMine();
        const timer = setInterval(loadMine, REFRESH_MS);
        const channel = sb.channel('ai-studio-customer')
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.TASKS }, () => loadMine())
            .subscribe();
        return () => { clearInterval(timer); sb.removeChannel(channel); };
    }, [sb, session, loadMine]);

    // ── Form ──
    const setField = (name, value) => setForm(f => ({ ...f, [name]: value }));

    // Several photos at once (up to 10): each is compressed and uploaded, then the links go into the list
    const pickExtraFiles = async (e) => {
        const files = Array.from(e.target.files || []).slice(0, 10);
        if (!files.length) return;
        setMsg(`${files.length} photo upload ho rahi hai...`);
        try {
            const urls = [];
            for (const f of files) urls.push(await uploadFile(f));
            const current = form.extra_image_urls.split('\n').map(s => s.trim()).filter(Boolean);
            setField('extra_image_urls', [...current, ...urls].slice(0, 10).join('\n'));
            setMsg('Photos upload ho gayi');
        } catch (err) {
            setMsg('Upload error: ' + err.message);
        }
    };

    // Family photo slots
    const setFamilyUrl = (i, url) => setForm(f => ({ ...f, family_urls: f.family_urls.map((u, j) => (j === i ? url : u)) }));
    const pickFamilyFile = async (e, i) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMsg('Photo upload ho rahi hai...');
        try {
            setFamilyUrl(i, await uploadFile(file));
            setMsg('Photo upload ho gayi');
        } catch (err) {
            setMsg('Upload error: ' + err.message);
        }
    };

    // The brush mask is uploaded, then its link goes into the form
    const saveMask = async (dataUrl) => {
        setMsg('Area upload ho raha hai...');
        try {
            setField('style_image_url', await uploadDataUrl(dataUrl));
            setMsg('Area save ho gaya');
        } catch (err) {
            setMsg('Area upload nahi hua: ' + err.message);
        }
    };

    const pickFile = async (e, field) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setMsg('Photo upload ho rahi hai...');
        try {
            const url = await uploadFile(file);
            setField(field, url);
            setMsg('Photo upload ho gayi');
        } catch (err) {
            setMsg('Upload error: ' + err.message);
        }
    };

    const send = async () => {
        if (problems.length) return setMsg(problems.join(', '));
        setSending(true);
        setMsg('');
        const isImage = kind.output === 'image';
        const row = {
            app_id: appId,
            task_type: form.task_type,
            model: isImage ? imageModel : textModel,
            prompt: form.prompt.trim() || null,
            aspect_ratio: isImage ? form.aspect_ratio : null,
            image_size: isImage && sizes.length ? form.image_size : null,
            face_image_url: kind.inputs.includes('face') ? form.face_image_url.trim() : null,
            style_image_url: kind.inputs.includes('style') ? form.style_image_url.trim() : null,
            input_image_url: kind.inputs.includes('input') ? form.input_image_url.trim() : null,
            extra_image_urls: kind.family
                ? form.family_urls.map(s => s.trim())   // empty slots stay, so the roles keep their order
                : kind.extras ? form.extra_image_urls.split('\n').map(s => s.trim()).filter(Boolean) : null,
            conversation_id: form.task_type === 'chat' ? (form.conversation_id.trim() || null) : null,
            batch_count: isImage ? Number(form.batch_count) : 1
        };
        const { error } = await sb.rpc(API.CREATE_TASK, { p_payload: row });
        setSending(false);
        if (error) return setMsg('Kaam nahi bana: ' + error.message);
        setMsg('Aapka kaam le liya gaya. Tayyar hone par yahin dikhega.');
        setForm(f => ({ ...f, prompt: '' }));
        setScreen('mine');
        loadMine();
    };

    // ── Screens ──
    if (!sb) {
        return (
            <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-stone-900 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h1 className="text-lg font-extrabold flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-300" /> AI Studio</h1>
                    <button onClick={connect} className="w-full h-10 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black">Shuru karo</button>
                    {msg && <p className="text-xs text-yellow-200">{msg}</p>}
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-stone-900 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h1 className="text-lg font-extrabold flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-300" /> {mode === 'login' ? 'Login' : 'Naya account'}</h1>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                    {mode === 'login'
                        ? <button onClick={signIn} className="w-full h-10 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black flex items-center justify-center gap-2"><LogIn className="w-4 h-4" /> Login</button>
                        : <button onClick={signUp} className="w-full h-10 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" /> Account banao</button>}
                    <button onClick={guestIn} className="w-full h-10 border border-white/10 bg-stone-800 rounded-xl text-xs font-bold">Bina email ke andar jaao</button>
                    <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setAuthMsg(''); }} className="w-full text-xs text-stone-400 underline">
                        {mode === 'login' ? 'Naya account banana hai?' : 'Pehle se account hai? Login karo'}
                    </button>
                    {authMsg && <p className="text-xs text-yellow-200">{authMsg}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 text-stone-100 p-4 sm:p-6 space-y-5">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center"><Sparkles className="w-5 h-5 text-stone-950" /></div>
                    <div>
                        <h1 className="text-lg font-extrabold">AI Studio</h1>
                        <p className="text-[11px] text-stone-400">{session.user.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setScreen('new')} className={`h-9 px-4 rounded-xl text-xs font-bold border ${screen === 'new' ? 'bg-yellow-400 text-stone-950 border-yellow-300' : 'bg-stone-900 border-white/10 text-stone-300'}`}>Naya kaam</button>
                    <button onClick={() => setScreen('mine')} className={`h-9 px-4 rounded-xl text-xs font-bold border ${screen === 'mine' ? 'bg-yellow-400 text-stone-950 border-yellow-300' : 'bg-stone-900 border-white/10 text-stone-300'}`}>Mere results</button>
                    <button onClick={signOut} className="h-9 px-3 rounded-xl text-xs font-bold border border-white/10 bg-stone-900 text-stone-300 flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /></button>
                </div>
            </header>

            {maint && <p className="text-xs text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{maint}</p>}
            {msg && <p className="text-xs text-yellow-200 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-3 py-2">{msg}</p>}

            {screen === 'new' && (
                <section className="max-w-2xl bg-stone-900 border border-white/10 rounded-2xl p-5 space-y-4">
                    <h2 className="text-sm font-extrabold">Kya banwana hai?</h2>

                    {apps.length > 1 && (
                        <select value={appId} onChange={e => setAppId(e.target.value)} className="h-11 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs">
                            {apps.map(a => <option key={a.app_id} value={a.app_id}>{a.label}</option>)}
                        </select>
                    )}
                    <select value={form.task_type} onChange={e => setForm({ ...EMPTY, task_type: e.target.value })} className="h-11 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs">
                        {Object.entries(shownKinds).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
                    </select>
                    <p className="text-[11px] text-stone-400">{kind.hint}</p>

                    {kind.inputs.map(key => kind.edit && key === 'style' ? (
                        <MaskBlock key={key} label={labelFor(kind, key)} photoUrl={form.face_image_url} maskUrl={form.style_image_url} onSave={saveMask} />
                    ) : (
                        <div key={key} className="space-y-1.5">
                            <p className="text-xs font-bold text-stone-200">{labelFor(kind, key)}{kind.optional?.includes(key) ? ' (optional)' : ''}</p>
                            <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
                                <input value={form[INPUT_COLUMN[key]]} onChange={e => setField(INPUT_COLUMN[key], e.target.value)} placeholder="Photo ka link (ya upload karo)" className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                                <label className="h-10 px-3 flex items-center gap-1.5 bg-stone-800 border border-white/10 rounded-xl text-xs font-bold cursor-pointer">
                                    <Upload className="w-3.5 h-3.5" /> Upload
                                    <input type="file" accept="image/*" className="hidden" onChange={e => pickFile(e, INPUT_COLUMN[key])} />
                                </label>
                            </div>
                            {form[INPUT_COLUMN[key]] && <img src={form[INPUT_COLUMN[key]]} alt="" className="h-24 rounded-xl object-cover border border-white/10" />}
                        </div>
                    ))}

                    {kind.family && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-stone-200">Parivar ke members (jo nahi hai use khali chhodo)</p>
                            {familyRoles.map((role, i) => (
                                <div key={role.role_key} className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
                                    <input value={form.family_urls[i]} onChange={e => setFamilyUrl(i, e.target.value)} placeholder={`${role.label_customer} ka photo link`} className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                                    <label className="h-10 px-3 flex items-center gap-1.5 bg-stone-800 border border-white/10 rounded-xl text-xs font-bold cursor-pointer">
                                        <Upload className="w-3.5 h-3.5" /> Upload
                                        <input type="file" accept="image/*" className="hidden" onChange={e => pickFamilyFile(e, i)} />
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}

                    {kind.extras && !kind.family && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-bold text-stone-200">Aur photos (optional, ek saath 10 tak chuno)</p>
                            <input type="file" accept="image/*" multiple onChange={pickExtraFiles} className="text-xs text-stone-300" />
                            <textarea value={form.extra_image_urls} onChange={e => setField('extra_image_urls', e.target.value)} rows={2} placeholder="Har line mein ek photo ka link" className="w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs" />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <p className="text-xs font-bold text-stone-200">{kind.promptRequired ? 'Aap kya chahte ho? (zaroori)' : 'Kuch khas chahiye? (optional)'}</p>
                        <textarea value={form.prompt} onChange={e => setField('prompt', e.target.value)} rows={3} placeholder="Jaise: cafe mein baith kar chai pite hue, halki roshni" className="w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs" />
                    </div>

                    {form.task_type === 'chat' && (
                        <input value={form.conversation_id} onChange={e => setField('conversation_id', e.target.value)} placeholder="Chat ka naam (same naam = wahi baat aage badhegi)" className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                    )}

                    {kind.output === 'image' && (
                        <div className="grid gap-3 sm:grid-cols-4">
                            <label className="space-y-1 text-[11px] text-stone-300">Shape
                                <select value={form.aspect_ratio} onChange={e => setField('aspect_ratio', e.target.value)} className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs">
                                    {aspects.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </label>
                            <label className="space-y-1 text-[11px] text-stone-300">Quality
                                <select value={form.image_size} onChange={e => setField('image_size', e.target.value)} className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs">
                                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </label>
                            <label className="space-y-1 text-[11px] text-stone-300">Kitni photos
                                <input type="number" min={1} max={10} value={form.batch_count} onChange={e => setField('batch_count', Math.min(10, Math.max(1, Number(e.target.value) || 1)))} className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                            </label>
                        </div>
                    )}

                    {problems.length > 0 && (
                        <ul className="text-xs text-rose-300 space-y-1">{problems.map(p => <li key={p}>• {p}</li>)}</ul>
                    )}

                    <button onClick={send} disabled={sending || problems.length > 0 || !!maint} className="h-11 px-6 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black flex items-center gap-2 disabled:opacity-40">
                        {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Banwao
                    </button>
                </section>
            )}

            {screen === 'mine' && (
                <section className="space-y-4">
                    <h2 className="text-sm font-extrabold">Mere results</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {myTasks.map(t => {
                            const st = STATUS_TEXT[t.status] || STATUS_TEXT.pending;
                            const Icon = st.icon;
                            const photos = t.output_image_urls?.length ? t.output_image_urls : (t.output_image_url ? [t.output_image_url] : []);
                            return (
                                <div key={t.id} className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold text-stone-200">{kinds[t.task_type]?.label || t.task_type} <span className="text-[10px] font-normal text-stone-500">· {apps.find(a => a.app_id === t.app_id)?.label || t.app_id}</span></span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${st.cls}`}><Icon className="w-3 h-3" /> {st.text}</span>
                                    </div>
                                    {t.prompt && <p className="text-[11px] text-stone-400 line-clamp-2">{t.prompt}</p>}
                                    {t.status === 'failed' && <p className="text-[11px] text-rose-300">Kuch galat ho gaya. Dobara koshish karo ya prompt badlo.</p>}
                                    {/* Before / after: the photo you sent next to the first result */}
                                    {photos.length > 0 && (t.face_image_url || t.input_image_url) && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-stone-400">Pehle</p>
                                                <img src={t.face_image_url || t.input_image_url} alt="" loading="lazy" className="w-full aspect-[4/5] object-cover rounded-xl" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-stone-400">Baad mein</p>
                                                <img src={photos[0]} alt="" loading="lazy" className="w-full aspect-[4/5] object-cover rounded-xl" />
                                            </div>
                                        </div>
                                    )}
                                    {photos.map((url, i) => (
                                        <div key={i} className="space-y-2">
                                            <img src={url} alt="" loading="lazy" className="w-full aspect-[4/5] object-cover rounded-xl" />
                                            <a href={url} target="_blank" rel="noreferrer" download className="h-9 w-full flex items-center justify-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold"><Download className="w-3.5 h-3.5" /> Photo download karo</a>
                                        </div>
                                    ))}
                                    {t.output_text && <div className="text-xs text-stone-200 bg-stone-950 border border-white/10 rounded-xl p-3 whitespace-pre-wrap max-h-60 overflow-auto">{t.output_text}</div>}
                                    {t.face_match_score != null && <p className="text-[11px] text-stone-400">Chehra milne ka score: {Math.round(t.face_match_score)}%</p>}
                                </div>
                            );
                        })}
                    </div>
                    {myTasks.length === 0 && <p className="text-center text-xs text-stone-500 py-10">Abhi aapka koi kaam nahi. "Naya kaam" se shuru karo.</p>}
                </section>
            )}
        </div>
    );
}
