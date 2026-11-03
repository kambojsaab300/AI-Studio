import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Sparkles, LogIn, LogOut, Send, RefreshCw, Download, AlertCircle, CheckCircle2, Clock, Upload, UserPlus } from 'lucide-react';

// ============================================================
// AI Studio: .NET Core API Client (Standalone Inline Adapter)
// Powered by .NET Core Web API & Microsoft SQL Server
// ============================================================
class ApiQueryBuilder {
    constructor(apiUrl, table, token) {
        this.apiUrl = apiUrl;
        this.table = table;
        this.token = token;
        this.params = new URLSearchParams();
        this._isSingle = false;
        this._isCount = false;
        this._isHead = false;
    }

    select(columns = '*', options = {}) {
        this.params.set('select', columns);
        if (options && options.count) {
            this._isCount = true;
            this.params.set('count', options.count);
        }
        if (options && options.head) {
            this._isHead = true;
            this.params.set('head', 'true');
        }
        return this;
    }

    order(column, { ascending = true } = {}) {
        this.params.set('order', `${column}.${ascending ? 'asc' : 'desc'}`);
        return this;
    }

    limit(n) {
        this.params.set('limit', String(n));
        return this;
    }

    range(from, to) {
        this.params.set('offset', String(from));
        this.params.set('limit', String(to - from + 1));
        return this;
    }

    eq(column, value) {
        this.params.append(column, `eq.${value}`);
        return this;
    }

    neq(column, value) {
        this.params.append(column, `neq.${value}`);
        return this;
    }

    is(column, value) {
        this.params.append(column, `is.${value}`);
        return this;
    }

    in(column, values) {
        const list = Array.isArray(values) ? values.join(',') : values;
        this.params.append(column, `in.(${list})`);
        return this;
    }

    single() {
        this._isSingle = true;
        return this;
    }

    async _fetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true',
            ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        };
        if (this._isSingle) {
            headers['Accept'] = 'application/vnd.pgrst.object+json';
        }

        try {
            const res = await fetch(url, { ...options, headers });
            let countVal = 0;
            const contentRange = res.headers.get('content-range') || res.headers.get('Content-Range');
            if (contentRange) {
                const parts = contentRange.split('/');
                if (parts.length > 1) countVal = parseInt(parts[1], 10) || 0;
            } else {
                const totalHdr = res.headers.get('x-total-count') || res.headers.get('X-Total-Count');
                if (totalHdr) countVal = parseInt(totalHdr, 10) || 0;
            }

            if (!res.ok) {
                const text = await res.text();
                let errObj;
                try { errObj = JSON.parse(text); } catch { errObj = { message: text }; }
                return { data: null, error: errObj, count: 0 };
            }

            const data = await res.json();
            if (countVal === 0 && Array.isArray(data)) countVal = data.length;

            return {
                data: this._isSingle && Array.isArray(data) ? (data[0] || null) : data,
                error: null,
                count: countVal
            };
        } catch (err) {
            return { data: null, error: { message: err.message }, count: 0 };
        }
    }

    then(resolve, reject) {
        const url = `${this.apiUrl}/rest/v1/${this.table}?${this.params.toString()}`;
        return this._fetch(url, { method: 'GET' }).then(resolve, reject);
    }

    async insert(data) {
        const url = `${this.apiUrl}/rest/v1/${this.table}`;
        return this._fetch(url, { method: 'POST', body: JSON.stringify(data) });
    }

    async update(data) {
        const url = `${this.apiUrl}/rest/v1/${this.table}?${this.params.toString()}`;
        return this._fetch(url, { method: 'PATCH', body: JSON.stringify(data) });
    }

    async delete() {
        const url = `${this.apiUrl}/rest/v1/${this.table}?${this.params.toString()}`;
        return this._fetch(url, { method: 'DELETE' });
    }
}

function getEffectiveApiUrl(providedUrl) {
    if (typeof window !== 'undefined') {
        const queryApi = new URLSearchParams(window.location.search).get('api');
        if (queryApi) {
            try { localStorage.setItem('aistudio_api_url', queryApi); } catch { }
            return queryApi.replace(/\/$/, "");
        }
        try {
            const savedApi = localStorage.getItem('aistudio_api_url');
            if (savedApi) {
                if (savedApi.includes('trycloudflare.com')) {
                    try { localStorage.removeItem('aistudio_api_url'); } catch { }
                } else {
                    return (savedApi === 'http://aistudio.runasp.net' ? 'https://aistudio.runasp.net' : savedApi).replace(/\/$/, "");
                }
            }
        } catch { }
        if (providedUrl) {
            return providedUrl.replace(/\/$/, "");
        }
    }
    return (providedUrl || "https://aistudio.runasp.net").replace(/\/$/, "");
}

function createClient(apiUrl = "https://aistudio.runasp.net", apiKey = "") {
    const url = getEffectiveApiUrl(apiUrl);
    let token = "";
    let currentUser = null;
    try {
        token = localStorage.getItem('aistudio_token') || "";
        const saved = localStorage.getItem('aistudio_user');
        if (saved) currentUser = JSON.parse(saved);
    } catch { }

    const authListeners = new Set();

    return {
        apiUrl: url,
        auth: {
            async signInWithPassword({ email, password }) {
                try {
                    const res = await fetch(`${url}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                        body: JSON.stringify({ email, password })
                    });
                    const json = await res.json();
                    if (!res.ok) return { data: null, error: { message: json.error || 'Login fail hua.' } };
                    token = json.access_token;
                    currentUser = json.user;
                    try {
                        localStorage.setItem('aistudio_token', token);
                        localStorage.setItem('aistudio_user', JSON.stringify(currentUser));
                    } catch { }
                    authListeners.forEach(cb => cb('SIGNED_IN', { user: currentUser, access_token: token }));
                    return { data: { user: currentUser, session: { access_token: token, user: currentUser } }, error: null };
                } catch (err) {
                    return { data: null, error: { message: err.message } };
                }
            },

            async signInAnonymously() {
                const guestEmail = `guest_${Date.now()}@aistudio.local`;
                return this.signUp({ email: guestEmail, password: "Guest@123456" });
            },

            async signUp({ email, password }) {
                try {
                    const res = await fetch(`${url}/api/auth/signup`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                        body: JSON.stringify({ email, password })
                    });
                    const json = await res.json();
                    if (!res.ok) return { data: null, error: { message: json.error || 'Signup fail hua.' } };
                    token = json.access_token;
                    currentUser = json.user;
                    try {
                        localStorage.setItem('aistudio_token', token);
                        localStorage.setItem('aistudio_user', JSON.stringify(currentUser));
                    } catch { }
                    authListeners.forEach(cb => cb('SIGNED_IN', { user: currentUser, access_token: token }));
                    return { data: { user: currentUser, session: { access_token: token, user: currentUser } }, error: null };
                } catch (err) {
                    return { data: null, error: { message: err.message } };
                }
            },

            async signOut() {
                token = "";
                currentUser = null;
                try {
                    localStorage.removeItem('aistudio_token');
                    localStorage.removeItem('aistudio_user');
                } catch { }
                authListeners.forEach(cb => cb('SIGNED_OUT', null));
                return { error: null };
            },

            async getSession() {
                if (token && currentUser) return { data: { session: { access_token: token, user: currentUser } }, error: null };
                return { data: { session: null }, error: null };
            },

            async getUser() {
                return { data: { user: currentUser }, error: null };
            },

            onAuthStateChange(callback) {
                authListeners.add(callback);
                return {
                    data: {
                        subscription: {
                            unsubscribe: () => authListeners.delete(callback)
                        }
                    }
                };
            }
        },

        from(table) {
            return new ApiQueryBuilder(url, table, token);
        },

        async rpc(functionName, params = {}) {
            try {
                const res = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(params || {})
                });

                const text = await res.text();
                if (!res.ok) {
                    let errObj;
                    try { errObj = JSON.parse(text); } catch { errObj = { message: text }; }
                    return { data: null, error: errObj };
                }

                let data;
                try { data = JSON.parse(text); } catch { data = text; }
                return { data, error: null };
            } catch (err) {
                return { data: null, error: { message: err.message } };
            }
        },

        channel(name) {
            const ch = {
                name,
                on() { return ch; },
                subscribe() { return ch; }
            };
            return ch;
        },

        removeChannel() { }
    };
}

// ============================================================
// AI STUDIO CUSTOMER: the customer gives the input and gets the result. Sees only their own tasks.
// Powered by .NET Core Web API & Microsoft SQL Server
// ============================================================

const API_URL = "https://aistudio.runasp.net";
// Publishable key: safe in the app code (row security protects the data)
const API_KEY = "aistudio_local_key";
const CLOUDINARY_CLOUD_NAME = "draaqjcre";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const REFRESH_MS = 2000;          // Auto-refresh from DB every 2 seconds

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
function safeCustomerJson(val, fallback) {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
            try { return JSON.parse(trimmed); } catch (e) { return fallback; }
        }
    }
    return fallback;
}

const EMPTY_KIND = { label: '', output: 'text', inputs: [], labels: {}, optional: [], extras: false, promptRequired: false, hint: '' };
function toKind(r) {
    const inputs = safeCustomerJson(r.inputs, []);
    const labels = safeCustomerJson(r.customer_labels || r.labels, {});
    const optional = safeCustomerJson(r.optional, []);
    const apps = safeCustomerJson(r.apps, []);

    return {
        label: r.customer_label || r.label,
        output: r.output,
        inputs: Array.isArray(inputs) ? inputs : [],
        labels: (typeof labels === 'object' && labels !== null) ? labels : {},
        optional: Array.isArray(optional) ? optional : [],
        extras: !!r.extras,
        family: !!r.family,
        promptRequired: !!r.prompt_required,
        edit: !!r.edit,
        hint: r.hint || '',
        apps: Array.isArray(apps) ? apps : []
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

function loadClient(anonKey) {
    return Promise.resolve(createClient(API_URL, anonKey));
}

const SUIT_STOCK_MODELS = {
    man: [
        { id: 'm1', name: 'Indian Formal Male Model', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80' },
        { id: 'm2', name: 'Corporate Tuxedo Male Model', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80' }
    ],
    woman: [
        { id: 'w1', name: 'Graceful Ethnic Female Model', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80' },
        { id: 'w2', name: 'Modern Pant-Suit Female Model', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80' }
    ],
    kids: [
        { id: 'k1', name: 'Kid Boy Model (7-9 yr)', url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&q=80' },
        { id: 'k2', name: 'Kid Girl Model (6-8 yr)', url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&q=80' }
    ]
};

const SUIT_POSES = [
    { id: 'all', label: '🌟 All Poses (6 Photos Batch)', desc: 'Front, Back, Side, Close-up, Upper, Down sab ek saath', batch: 6, angleText: '' },
    { id: 'front', label: '🧍 Front Pose', desc: 'Full standing front view, complete suit fitting', batch: 1, angleText: 'front pose (full standing front view showing complete suit fit and silhouette)' },
    { id: 'back', label: '🔄 Back Pose', desc: 'Back view showing back cut, styling and shoulder fit', batch: 1, angleText: 'back pose (back fitting and cut view showing rear design)' },
    { id: 'side', label: '📐 Side Pose', desc: '45 degree side profile view, sleek drape', batch: 1, angleText: 'side pose (side profile 45 degree angle showing silhouette)' },
    { id: 'close', label: '🔍 Close-up Pose', desc: 'Fabric texture, lapel, buttons & stitching detail', batch: 1, angleText: 'close-up pose (fabric texture and lapel details shot in macro focus)' },
    { id: 'upper', label: '👤 Upper Pose', desc: 'Waist-up portrait, chest & collar focus', batch: 1, angleText: 'upper pose (waist-up portrait pose showing chest, collar and tie)' },
    { id: 'down', label: '🚶 Down / Full Pose', desc: 'Complete full length from shoulders to shoes', batch: 1, angleText: 'down pose (full length standing pose showing trousers and suit length)' }
];

const COMBO_5_POSES = [
    { id: 'all', label: '🌟 All 5 Poses Combo (5 Photos Set)', desc: 'Front, Back, Side, Close-up & Upper body ek saath', batch: 5, angleText: '' },
    { id: 'front', label: '🧍 Front View Pose', desc: 'Full standing front catalog view, complete outfit silhouette', batch: 1, angleText: 'Front View Pose (full standing front catalog view showing complete outfit silhouette)' },
    { id: 'back', label: '🔄 Back View Pose', desc: 'Full standing rear view, back fit and styling', batch: 1, angleText: 'Back View Pose (full standing rear view showing back fit and styling)' },
    { id: 'side', label: '📐 Side View Pose', desc: '45 degree side profile fashion angle showing posture and drape', batch: 1, angleText: 'Side View Pose (45 degree side profile fashion angle showing posture and drape)' },
    { id: 'close', label: '🔍 Close-up Macro Pose', desc: 'Macro texture, collar, buttons, lapels and fabric weave', batch: 1, angleText: 'Close-up Macro Pose (macro texture, collar, buttons, lapels and fabric weave focus)' },
    { id: 'upper', label: '👤 Upper Body Portrait Pose', desc: 'Waist-up professional catalog portrait showing face and chest', batch: 1, angleText: 'Upper Body Portrait Pose (waist-up professional catalog portrait showing face and chest)' }
];

const EMPTY = { task_type: 'image_to_image_prompt', prompt: '', aspect_ratio: '4:5', image_size: '2K', batch_count: 1, face_image_url: '', style_image_url: '', input_image_url: '', extra_image_urls: '', family_urls: ['', '', '', '', '', ''], conversation_id: '' };

export default function AiStudioCustomer() {
    const [anonKey, setAnonKey] = useState(API_KEY);
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
    const [appId, setAppId] = useState(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const qApp = params.get('app');
            if (qApp) return qApp.toLowerCase();
            const match = window.location.pathname.match(/\/(customer|app)\/([a-zA-Z0-9_-]+)/);
            if (match && match[2] && match[2] !== 'customer') return match[2].toLowerCase();
            const stored = localStorage.getItem('ai_studio_customer_app_id');
            if (stored) return stored;
        } catch {}
        return 'weargen';
    });

    const handleAppChange = (newAppId) => {
        setAppId(newAppId);
        try {
            localStorage.setItem('ai_studio_customer_app_id', newAppId);
            const url = new URL(window.location.href);
            url.searchParams.set('app', newAppId);
            window.history.replaceState({}, '', url.toString());
        } catch {}
    };

    const [suitCategory, setSuitCategory] = useState('man');  // 'man' | 'woman' | 'kids' | 'custom'
    const [suitSelectedPose, setSuitSelectedPose] = useState('all'); // 'all' | 'front' | 'back' | 'side' | 'close' | 'upper' | 'down'
    const [comboSelectedPose, setComboSelectedPose] = useState('all'); // 'all' | 'front' | 'back' | 'side' | 'close' | 'upper'

    // Studio auto-defaults
    useEffect(() => {
        if (form.task_type === 'suit_studio') {
            if (!form.face_image_url && SUIT_STOCK_MODELS.man?.[0]) {
                setField('face_image_url', SUIT_STOCK_MODELS.man[0].url);
            }
            if (suitSelectedPose === 'all') {
                setField('batch_count', 6);
            }
        } else if (form.task_type === 'combo_5pose_studio') {
            if (comboSelectedPose === 'all') {
                setField('batch_count', 5);
            }
        }
    }, [form.task_type]);

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
    const shownKinds = useMemo(() => {
        const currentApp = apps.find(a => a.app_id === appId);
        const appTaskTypes = currentApp?.task_types || [];
        return Object.fromEntries(
            Object.entries(kinds).filter(([taskType, k]) => {
                if (appTaskTypes.length > 0) {
                    return appTaskTypes.includes(taskType);
                }
                if (k.apps && k.apps.length > 0) {
                    return k.apps.includes(appId);
                }
                return true;
            })
        );
    }, [kinds, appId, apps]);
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

    // Login without email: a guest account (needs "Anonymous sign-ins" on in API Auth settings)
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

    // ── My tasks (Strict RLS & app_id returns only this customer's rows for this app) ──
    const loadMine = useCallback(async () => {
        if (!sb || !session) return;
        const currentUserId = session?.user?.id || session?.user?.email;
        let query = sb.from(TABLES.TASKS)
            .select('id, app_id, user_id, task_type, prompt, status, error, output_text, output_image_url, output_image_urls, face_match_score, batch_count, conversation_id, created_at, face_image_url, input_image_url, style_image_url')
            .eq('app_id', appId);
        if (currentUserId) {
            query = query.eq('user_id', currentUserId);
        }
        const { data, error } = await query
            .order('id', { ascending: false })
            .limit(50);
        if (!error) setMyTasks(data || []);
        const { data: s } = await sb.from(TABLES.SETTINGS).select('maintenance_on, maintenance_message').eq('id', 1).single();
        setMaint(s?.maintenance_on ? s.maintenance_message : null);
    }, [sb, session, appId]);

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
        let taskPrompt = form.prompt.trim() || null;
        let batchCount = isImage ? Number(form.batch_count) : 1;
        if (form.task_type === 'suit_studio') {
            if (suitSelectedPose === 'all') {
                batchCount = 6;
            } else {
                batchCount = 1;
                const chosen = SUIT_POSES.find(p => p.id === suitSelectedPose);
                if (chosen?.angleText) {
                    taskPrompt = (taskPrompt ? taskPrompt + '. ' : '') + `Camera angle: ${chosen.angleText}.`;
                }
            }
        } else if (form.task_type === 'combo_5pose_studio') {
            if (comboSelectedPose === 'all') {
                batchCount = 5;
            } else {
                batchCount = 1;
                const chosen = COMBO_5_POSES.find(p => p.id === comboSelectedPose);
                if (chosen?.angleText) {
                    taskPrompt = (taskPrompt ? taskPrompt + '. ' : '') + `Camera angle: ${chosen.angleText}.`;
                }
            }
        }

        const currentUserId = session?.user?.id || session?.user?.email || ('customer_' + appId);
        const row = {
            app_id: appId,
            user_id: currentUserId,
            task_type: form.task_type,
            model: isImage ? imageModel : textModel,
            prompt: taskPrompt,
            aspect_ratio: isImage ? form.aspect_ratio : null,
            image_size: isImage && sizes.length ? form.image_size : null,
            face_image_url: kind.inputs.includes('face') ? form.face_image_url.trim() : null,
            style_image_url: kind.inputs.includes('style') ? form.style_image_url.trim() : null,
            input_image_url: kind.inputs.includes('input') ? form.input_image_url.trim() : null,
            extra_image_urls: kind.family
                ? form.family_urls.map(s => s.trim())   // empty slots stay, so the roles keep their order
                : kind.extras ? form.extra_image_urls.split('\n').map(s => s.trim()).filter(Boolean) : null,
            conversation_id: form.task_type === 'chat' ? (form.conversation_id.trim() || null) : null,
            batch_count: batchCount
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
            <header className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/60 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                        <Sparkles className="w-5 h-5 text-stone-950" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base sm:text-lg font-black text-white">
                                {apps.find(a => a.app_id === appId)?.label || appId} Studio
                            </h1>
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30">
                                {appId}
                            </span>
                        </div>
                        <p className="text-[11px] text-stone-400">{session.user.email || 'Customer Account'}</p>
                    </div>
                </div>

                {/* App Selector if multiple apps exist */}
                {apps.length > 1 && (
                    <div className="flex items-center gap-1.5 p-1 bg-stone-950 border border-white/10 rounded-xl">
                        <span className="text-[11px] font-bold text-stone-400 px-2">App:</span>
                        {apps.map(a => {
                            const isSelected = a.app_id === appId;
                            return (
                                <button
                                    key={a.app_id}
                                    type="button"
                                    onClick={() => handleAppChange(a.app_id)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        isSelected
                                            ? 'bg-yellow-400 text-stone-950 shadow-md font-black'
                                            : 'text-stone-300 hover:text-white hover:bg-stone-900'
                                    }`}
                                >
                                    {a.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button onClick={() => setScreen('new')} className={`h-9 px-4 rounded-xl text-xs font-bold border transition-colors ${screen === 'new' ? 'bg-yellow-400 text-stone-950 border-yellow-300' : 'bg-stone-900 border-white/10 text-stone-300 hover:text-white'}`}>Naya kaam</button>
                    <button onClick={() => setScreen('mine')} className={`h-9 px-4 rounded-xl text-xs font-bold border transition-colors ${screen === 'mine' ? 'bg-yellow-400 text-stone-950 border-yellow-300' : 'bg-stone-900 border-white/10 text-stone-300 hover:text-white'}`}>Mere results</button>
                    <button onClick={signOut} title="Logout" className="h-9 px-3 rounded-xl text-xs font-bold border border-white/10 bg-stone-900 hover:bg-rose-500/20 text-stone-300 hover:text-rose-300 flex items-center gap-1.5 transition-colors"><LogOut className="w-3.5 h-3.5" /></button>
                </div>
            </header>

            {maint && <p className="text-xs text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{maint}</p>}
            {msg && <p className="text-xs text-yellow-200 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-3 py-2">{msg}</p>}

            {screen === 'new' && (
                <section className="max-w-2xl bg-stone-900 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div>
                            <h2 className="text-sm font-extrabold text-white">Kya banwana hai?</h2>
                            <p className="text-[11px] text-stone-400">
                                App: <span className="text-yellow-300 font-bold">{apps.find(a => a.app_id === appId)?.label || appId}</span> ({Object.keys(shownKinds).length} tools)
                            </p>
                        </div>
                    </div>

                    <select value={form.task_type} onChange={e => setForm({ ...EMPTY, task_type: e.target.value })} className="h-11 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs">
                        {Object.entries(shownKinds).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
                    </select>
                    <p className="text-[11px] text-stone-400">{kind.hint}</p>

                    {/* 👔 Specialized Suit Shop Studio Interface */}
                    {form.task_type === 'suit_studio' ? (
                        <div className="space-y-4 pt-1">
                            <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-stone-900 border border-yellow-400/30 rounded-2xl p-4 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">👔</span>
                                    <h3 className="text-sm font-extrabold text-yellow-300">Suit Shop Studio (Virtual Model Try-On)</h3>
                                </div>
                                <p className="text-[11px] text-stone-300">
                                    Apne suit/outfit ki photo upload karein, Model chun kar Front, Back, Side, Close-up, Upper, Down poses me photoshoot banwayein.
                                </p>
                            </div>

                            {/* 1. Model Category Selector */}
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-stone-200">1. Model Category Chunein (Kisko suit pehnana hai?)</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: 'man', label: '👨 Man Model', sub: 'Men Suit / Blazer' },
                                        { id: 'woman', label: '👩 Woman Model', sub: 'Ladies Suit / Dress' },
                                        { id: 'kids', label: '🧒 Kids Model', sub: 'Boy / Girl Kids Suit' },
                                        { id: 'custom', label: '📷 Custom Model', sub: 'Apna Model Upload' }
                                    ].map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => {
                                                setSuitCategory(cat.id);
                                                if (cat.id !== 'custom' && SUIT_STOCK_MODELS[cat.id]?.[0]) {
                                                    setField('face_image_url', SUIT_STOCK_MODELS[cat.id][0].url);
                                                }
                                            }}
                                            className={`p-2.5 rounded-xl border text-left transition-all ${suitCategory === cat.id ? 'bg-yellow-400/15 border-yellow-400 text-yellow-300' : 'bg-stone-900 border-white/10 text-stone-300 hover:border-white/20'}`}
                                        >
                                            <p className="text-xs font-bold">{cat.label}</p>
                                            <p className="text-[10px] text-stone-400">{cat.sub}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ready Stock Model Picker */}
                            {suitCategory !== 'custom' && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-stone-200">Ready-made AI Models ({suitCategory.toUpperCase()})</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(SUIT_STOCK_MODELS[suitCategory] || []).map(m => {
                                            const isSelected = form.face_image_url === m.url;
                                            return (
                                                <div
                                                    key={m.id}
                                                    onClick={() => setField('face_image_url', m.url)}
                                                    className={`cursor-pointer rounded-xl border p-2 flex items-center gap-3 transition-all ${isSelected ? 'bg-yellow-400/15 border-yellow-400' : 'bg-stone-950 border-white/10 hover:border-white/30'}`}
                                                >
                                                    <img src={m.url} alt={m.name} className="w-12 h-12 rounded-lg object-cover" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-stone-200 truncate">{m.name}</p>
                                                        <p className="text-[10px] text-emerald-400">{isSelected ? '✓ Selected Model' : 'Click to Select'}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Model Photo Input (Custom or Override) */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-bold text-stone-200">{suitCategory === 'custom' ? 'Model ki Photo Upload Karein' : 'Selected Model Photo (Ya replace karein)'}</p>
                                <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
                                    <input value={form.face_image_url} onChange={e => setField('face_image_url', e.target.value)} placeholder="Model photo ka link ya upload karein" className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    <label className="h-10 px-3 flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 border border-white/10 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                                        <Upload className="w-3.5 h-3.5" /> Upload Model
                                        <input type="file" accept="image/*" className="hidden" onChange={e => pickFile(e, 'face_image_url')} />
                                    </label>
                                </div>
                                {form.face_image_url && <img src={form.face_image_url} alt="Model" className="h-24 rounded-xl object-cover border border-white/10" />}
                            </div>

                            {/* 2. Suit / Garment Upload Area */}
                            <div className="space-y-1.5 p-3.5 rounded-2xl bg-stone-950 border border-yellow-400/30">
                                <p className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
                                    <span>👔</span> 2. Aapke Suit / Outfit ki Photo (Zaroori)
                                </p>
                                <p className="text-[11px] text-stone-400">Shop ke suit, blazer, kurti, coat-pant ya dress ki saaf photo upload karein:</p>
                                <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-center pt-1">
                                    <input value={form.style_image_url} onChange={e => setField('style_image_url', e.target.value)} placeholder="Suit photo link ya upload karein" className="h-10 bg-stone-900 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    <label className="h-10 px-4 flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold rounded-xl text-xs cursor-pointer transition-colors">
                                        <Upload className="w-3.5 h-3.5" /> Suit Upload Karein
                                        <input type="file" accept="image/*" className="hidden" onChange={e => pickFile(e, 'style_image_url')} />
                                    </label>
                                </div>
                                {form.style_image_url && (
                                    <div className="pt-2 flex items-center gap-3">
                                        <img src={form.style_image_url} alt="Suit Preview" className="h-28 rounded-xl object-cover border border-yellow-400/40 shadow-md" />
                                        <span className="text-xs text-emerald-300 font-semibold">✓ Suit photo uploaded</span>
                                    </div>
                                )}
                            </div>

                            {/* 3. Pose & Angle Selection */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-stone-200">3. Photoshoot Poses Chunein</p>
                                    <span className="text-[11px] text-yellow-300 font-mono">
                                        {suitSelectedPose === 'all' ? '6 Photos (Batch)' : '1 Photo (Single Pose)'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {SUIT_POSES.map(p => {
                                        const isAct = suitSelectedPose === p.id;
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                    setSuitSelectedPose(p.id);
                                                    setField('batch_count', p.batch);
                                                }}
                                                className={`p-2.5 rounded-xl border text-left transition-all ${isAct ? 'bg-yellow-400/15 border-yellow-400 text-yellow-300' : 'bg-stone-950 border-white/10 text-stone-300 hover:border-white/20'}`}
                                            >
                                                <p className="text-xs font-bold flex items-center justify-between">
                                                    <span>{p.label}</span>
                                                    {isAct && <span className="text-[10px] bg-yellow-400 text-stone-950 px-1.5 py-0.5 rounded font-bold">Selected</span>}
                                                </p>
                                                <p className="text-[10px] text-stone-400 mt-0.5">{p.desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : form.task_type === 'combo_5pose_studio' ? (
                        <div className="space-y-4 pt-1">
                            {/* Banner */}
                            <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-stone-900 border border-emerald-400/30 rounded-2xl p-4 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">📸</span>
                                    <h3 className="text-sm font-extrabold text-emerald-300">5-Pose Combo Catalog Studio</h3>
                                </div>
                                <p className="text-[11px] text-stone-300">
                                    Photo upload karein aur 5 alag-alag commercial poses payein: Front view, Back view, Side view, Close-up macro detail, aur Upper body portrait.
                                </p>
                            </div>

                            {/* Person / Model Photo Input */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-bold text-stone-200">1. Person / Model ki Photo (Zaroori)</p>
                                <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
                                    <input value={form.face_image_url} onChange={e => setField('face_image_url', e.target.value)} placeholder="Model / Person photo ka link ya upload karein" className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    <label className="h-10 px-3 flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 border border-white/10 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                                        <Upload className="w-3.5 h-3.5" /> Upload Photo
                                        <input type="file" accept="image/*" className="hidden" onChange={e => pickFile(e, 'face_image_url')} />
                                    </label>
                                </div>
                                {form.face_image_url && <img src={form.face_image_url} alt="Model" className="h-24 rounded-xl object-cover border border-white/10" />}
                            </div>

                            {/* Outfit Photo (Optional) */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-bold text-stone-200">2. Outfit / Suit ki Photo (Optional - naye kapde pehnane ke liye)</p>
                                <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
                                    <input value={form.style_image_url} onChange={e => setField('style_image_url', e.target.value)} placeholder="Outfit photo ka link ya upload karein (khali chhod sakte hain)" className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    <label className="h-10 px-3 flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 border border-white/10 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                                        <Upload className="w-3.5 h-3.5" /> Upload Outfit
                                        <input type="file" accept="image/*" className="hidden" onChange={e => pickFile(e, 'style_image_url')} />
                                    </label>
                                </div>
                                {form.style_image_url && <img src={form.style_image_url} alt="Outfit" className="h-24 rounded-xl object-cover border border-white/10" />}
                            </div>

                            {/* Pose Selection */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-stone-200">3. Pose Mode Chunein</p>
                                    <span className="text-[11px] text-emerald-300 font-mono">
                                        {comboSelectedPose === 'all' ? '5 Photos (Complete Set)' : '1 Photo (Single Pose)'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {COMBO_5_POSES.map(p => {
                                        const isAct = comboSelectedPose === p.id;
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                    setComboSelectedPose(p.id);
                                                    setField('batch_count', p.batch);
                                                }}
                                                className={`p-2.5 rounded-xl border text-left transition-all ${isAct ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300' : 'bg-stone-950 border-white/10 text-stone-300 hover:border-white/20'}`}
                                            >
                                                <p className="text-xs font-bold flex items-center justify-between">
                                                    <span>{p.label}</span>
                                                    {isAct && <span className="text-[10px] bg-emerald-400 text-stone-950 px-1.5 py-0.5 rounded font-bold">Selected</span>}
                                                </p>
                                                <p className="text-[10px] text-stone-400 mt-0.5">{p.desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        kind.inputs.map(key => kind.edit && key === 'style' ? (
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
                        ))
                    )}

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
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/40 border border-white/5 rounded-2xl p-4">
                        <div>
                            <h2 className="text-sm font-extrabold flex items-center gap-2">
                                <span>Mere results</span>
                                <span className="text-xs font-bold text-yellow-300 bg-yellow-400/10 border border-yellow-400/30 px-2.5 py-0.5 rounded-full">
                                    {apps.find(a => a.app_id === appId)?.label || appId} ({myTasks.length})
                                </span>
                            </h2>
                            <p className="text-[11px] text-stone-400">Sirf aapke is app ke tasks aur generated outputs</p>
                        </div>
                        <button
                            type="button"
                            onClick={loadMine}
                            className="h-8 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-white/10 text-xs font-bold flex items-center gap-1.5 text-stone-300 transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh Results
                        </button>
                    </div>
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
                                    {t.task_type === 'suit_studio' && (t.face_image_url || t.style_image_url) && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {t.style_image_url && (
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-yellow-300 font-bold">👔 Suit Photo</p>
                                                    <img src={t.style_image_url} alt="Suit" loading="lazy" className="w-full aspect-[4/5] object-cover rounded-xl border border-yellow-400/20" />
                                                </div>
                                            )}
                                            {t.face_image_url && (
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-stone-300 font-bold">👤 Model Photo</p>
                                                    <img src={t.face_image_url} alt="Model" loading="lazy" className="w-full aspect-[4/5] object-cover rounded-xl border border-white/10" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {t.task_type !== 'suit_studio' && photos.length > 0 && (t.face_image_url || t.input_image_url) && (
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
