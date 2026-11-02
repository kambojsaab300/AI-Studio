import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Shield, LogIn, LogOut, Send, Trash2, Pause, Play, RefreshCw, AlertCircle, Upload, Users, List, Eye } from 'lucide-react';

// ============================================================
// AI STUDIO ADMIN: login required. Two screens:
//   1. Task banao: choose task type and model, fill the inputs the model accepts, see the exact payload.
//   2. Workers: live workers, pause / resume, task list.
// The worker app does the actual generation. This app only creates tasks and controls workers.
// ============================================================

// ── Config (public values; the secret keys are typed in, never stored in code) ──
const SUPABASE_URL = "https://kdwkdhjtcebrhtokhirg.supabase.co";
// Publishable key: safe in the app code (row security protects the data)
const SUPABASE_KEY = "sb_publishable_lRLDmrcgSfw7RNL5FtzFdg_3N_rWS8r";
const CLOUDINARY_CLOUD_NAME = "draaqjcre";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const REFRESH_MS = 20000;         // light safety-net refresh; realtime does most of the work
const MATCH_THRESHOLD = 70;       // shown in the preview only (the worker uses the same value)

// ── API: every call the app makes, named in one place ──
// Database functions (sb.rpc)
const API = {
    IS_ADMIN: 'is_ai_studio_admin',                // GET: am I an admin?
    CREATE_TASK: 'upload_ai_studio_task',          // UPLOAD: queue a new task
    SET_WORKER_TOOLS: 'ai_studio_set_worker_tools', // SET which tools a worker has (admin only)
    SET_WORKER_TASK_TYPES: 'ai_studio_set_worker_task_types', // SET which task types a worker runs (admin only)
    RELEASE_TASKS: 'ai_studio_release_tasks',      // CLEAN-UP: stuck tasks back to pending (admin only)
    CLEAR_FAILED: 'ai_studio_clear_failed'         // CLEAN-UP: delete failed tasks (admin only)
};

// Database tables (sb.from)
const TABLES = {
    TASKS: 'ai_studio_tasks',                      // GET the task list, DELETE a task
    WORKERS: 'ai_studio_workers',                  // UPDATE pause / resume
    WORKER_LOAD: 'ai_studio_worker_load',          // GET live workers with their load
    SETTINGS: 'ai_studio_settings',                // GET / UPDATE worker settings
    SECRETS: 'ai_studio_secrets',                  // UPDATE the ImgBB key (admin only)
    MODELS: 'ai_studio_models',                    // GET / UPDATE model on / off
    LOG: 'ai_studio_admin_log',                    // GET / INSERT the admin action log
    PROMPTS: 'ai_studio_prompts',                  // GET / UPDATE the task prompts (admin only)
    TOOLS: 'ai_studio_tools',                      // GET / INSERT / UPDATE the tools (admin only)
    TOOL_TYPES: 'ai_studio_tool_types',            // GET / UPDATE which task type belongs to which tool
    CATALOG: 'ai_studio_task_catalog',             // GET / UPDATE the task types (names, photo slots, on / off, customer)
    FAMILY_ROLES: 'ai_studio_family_roles',        // GET / INSERT / UPDATE the family photo roles
    APPS: 'ai_studio_apps',                        // GET / UPDATE the apps (WearGen, PPP ...)
    APP_TASKS: 'ai_studio_app_tasks'               // GET / INSERT / DELETE which task types each app shows
};

// External services
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';          // model request (preview only here)
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`; // UPLOAD a photo

// ── Models and task types (same list the worker uses) ──
// Models come from the database (ai_studio_models). Filled when the admin logs in.
let MODEL_CAPS = {};
// Every size and aspect ratio an image model can have (the checkboxes on the Models screen)
const IMAGE_SIZES = ['0.5K', '1K', '2K', '4K'];
const IMAGE_ASPECTS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const capsOf = (id) => MODEL_CAPS[id] || { kind: 'text', label: '', aspects: [], sizes: [] };
function setModelCaps(rows) {
    MODEL_CAPS = {};
    (rows || []).filter(r => r.kind).forEach(r => {
        MODEL_CAPS[r.model_id] = { kind: r.kind, label: r.label || r.model_id, aspects: r.aspects || [], sizes: r.sizes || [] };
    });
}


// One task type in the Tools screen: on/off, customer view, and (on Open) its names and photo slots.
// The slots decide which photos the form asks for. Check the prompt after changing them.
// Chat answers: simple markdown (headings, bold, italic, code, lists, quotes) as React elements. No raw HTML.
function renderInline(text, keyPrefix) {
    const parts = [];
    const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;
    let last = 0;
    let match;
    while ((match = re.exec(text))) {
        if (match.index > last) parts.push(text.slice(last, match.index));
        const token = match[0];
        const key = `${keyPrefix}-${parts.length}`;
        if (token.startsWith('**')) parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
        else if (token.startsWith('`')) parts.push(<code key={key} className="font-mono text-[11px] bg-stone-800 px-1 rounded">{token.slice(1, -1)}</code>);
        else parts.push(<em key={key}>{token.slice(1, -1)}</em>);
        last = match.index + token.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
}
function ChatText({ text }) {
    const out = [];
    let items = null;
    const flush = () => {
        if (items) out.push(<ul key={`ul-${out.length}`} className="list-disc pl-5 space-y-0.5">{items}</ul>);
        items = null;
    };
    String(text).split('\n').forEach((raw, idx) => {
        const line = raw.trimEnd();
        const key = `l${idx}`;
        const bullet = /^\s*[*-]\s+(.*)$/.exec(line);
        if (bullet) {
            if (!items) items = [];
            items.push(<li key={key}>{renderInline(bullet[1], key)}</li>);
            return;
        }
        flush();
        if (!line.trim()) return;
        if (/^-{3,}$/.test(line.trim())) {
            out.push(<hr key={key} className="border-white/10" />);
            return;
        }
        const heading = /^(#{1,3})\s+(.*)$/.exec(line);
        if (heading) {
            out.push(<p key={key} className={heading[1].length === 1 ? 'text-sm font-extrabold' : 'text-xs font-bold'}>{renderInline(heading[2], key)}</p>);
            return;
        }
        const quote = /^>\s?(.*)$/.exec(line);
        if (quote) {
            out.push(<p key={key} className="border-l-2 border-yellow-400/60 pl-2 text-stone-300">{renderInline(quote[1], key)}</p>);
            return;
        }
        out.push(<p key={key}>{renderInline(line, key)}</p>);
    });
    flush();
    return <div className="text-xs text-stone-200 space-y-1.5 leading-relaxed">{out}</div>;
}

function CatalogRow({ row, apps, appTasks, onToggleApp, onToggle, onSave }) {
    const [f, setF] = useState(null);
    const start = () => setF({
        label: row.label || '',
        customer_label: row.customer_label || '',
        hint: row.hint || '',
        inputs: row.inputs || [],
        optional: row.optional || [],
        labels: row.labels || {}
    });
    const pick = (list, k, on) => (on ? [...list, k] : list.filter(x => x !== k));
    return (
        <div className="bg-stone-950 border border-white/10 rounded-xl p-2 space-y-1">
            <p className="text-[11px] font-bold text-stone-100">{row.label}</p>
            <p className="font-mono text-[10px] text-stone-500">{row.task_type} · {row.output === 'image' ? 'photo' : 'text'}</p>
            <div className="flex flex-wrap gap-4 text-[11px] text-stone-300">
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={row.enabled} onChange={e => onToggle(row.task_type, 'enabled', e.target.checked)} /> Chalu</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={row.customer_visible} onChange={e => onToggle(row.task_type, 'customer_visible', e.target.checked)} /> Customer ko dikhe</label>
                {apps.map(a => (
                    <label key={a.app_id} className="flex items-center gap-1.5"><input type="checkbox" checked={appTasks.some(x => x.app_id === a.app_id && x.task_type === row.task_type)} onChange={e => onToggleApp(a.app_id, row.task_type, e.target.checked)} /> {a.label} app mein</label>
                ))}
                {!f &&<button type="button" onClick={start} className="underline text-yellow-300">Naam aur slots badlo</button>}
            </div>
            {f && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                    <input value={f.label} onChange={e => setF({ ...f, label: e.target.value })} placeholder="Admin naam" className="h-9 w-full bg-stone-900 border border-white/10 rounded-lg px-3 text-xs" />
                    <input value={f.customer_label} onChange={e => setF({ ...f, customer_label: e.target.value })} placeholder="Customer naam" className="h-9 w-full bg-stone-900 border border-white/10 rounded-lg px-3 text-xs" />
                    <textarea value={f.hint} onChange={e => setF({ ...f, hint: e.target.value })} rows={2} placeholder="Customer ke liye hint" className="w-full bg-stone-900 border border-white/10 rounded-lg p-2 text-xs" />
                    <div className="flex flex-wrap gap-3 text-[11px]">
                        {['face', 'style', 'input'].map(k => (
                            <div key={k} className="space-y-1 border border-white/10 rounded-lg p-2">
                                <label className="flex items-center gap-1.5 text-stone-200"><input type="checkbox" checked={f.inputs.includes(k)} onChange={e => setF({ ...f, inputs: pick(f.inputs, k, e.target.checked) })} /> Slot: {k}</label>
                                {f.inputs.includes(k) && (
                                    <>
                                        <input value={f.labels[k] || ''} onChange={e => setF({ ...f, labels: { ...f.labels, [k]: e.target.value } })} placeholder="Admin label" className="h-8 w-full bg-stone-900 border border-white/10 rounded-lg px-2 text-[11px]" />
                                        <label className="flex items-center gap-1.5 text-stone-300"><input type="checkbox" checked={f.optional.includes(k)} onChange={e => setF({ ...f, optional: pick(f.optional, k, e.target.checked) })} /> Khali chhod sakte</label>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => { onSave(row.task_type, f); setF(null); }} className="h-9 px-4 bg-yellow-400 text-stone-950 rounded-lg text-xs font-black">Save</button>
                        <button type="button" onClick={() => setF(null)} className="h-9 px-4 border border-white/10 bg-stone-800 rounded-lg text-xs font-bold">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// The task types come from the database (ai_studio_task_catalog). Only enabled types are in TASK_TYPES.
const TASK_TYPES = {};
const EMPTY_TYPE = { label: '', output: 'text', kind: 'text', inputs: [], labels: {}, optional: [], extras: false, promptRequired: false, faceCheck: false };
const typeOf = (k) => TASK_TYPES[k] || EMPTY_TYPE;
let CUSTOMER_KINDS = [];   // task types the customer app shows (filled from the catalog)
function toTaskType(r) {
    return {
        label: r.label,
        output: r.output,
        kind: r.output,
        inputs: r.inputs || [],
        labels: r.labels || {},
        optional: r.optional || [],
        extras: !!r.extras,
        promptRequired: !!r.prompt_required,
        faceCheck: !!r.face_check,
        edit: !!r.edit,
        transparentOut: !!r.transparent,
        angles: r.angles || null,
        family: !!r.family
    };
}
function setTaskTypes(rows) {
    Object.keys(TASK_TYPES).forEach(k => delete TASK_TYPES[k]);
    (rows || []).filter(r => r.enabled).forEach(r => { TASK_TYPES[r.task_type] = toTaskType(r); });
    CUSTOMER_KINDS = (rows || []).filter(r => r.enabled && r.customer_visible).map(r => r.task_type);
}
const INPUT_LABEL = { face: 'Face reference', style: 'Style / outfit reference', input: 'Input photo' };
const INPUT_COLUMN = { face: 'face_image_url', style: 'style_image_url', input: 'input_image_url' };
// Name of an input for this task type (person and product tasks name them differently)
const labelFor = (type, key) => type.labels?.[key] || INPUT_LABEL[key];


// Family photo roles come from the database (ai_studio_family_roles). Only the enabled ones are here.
let FAMILY_ROLES = [];   // [{ role_key, label_admin, prompt_text, ... }] in order
// The order line for a family task: the role keys the task was made with (or the current roles for a preview)
function familyOrderText(task) {
    const keys = task.family_role_keys || FAMILY_ROLES.map(r => r.role_key);
    const names = Object.fromEntries(FAMILY_ROLES.map(r => [r.role_key, r.prompt_text || r.role_key]));
    const present = keys.filter((_, i) => (task.extra_image_urls || [])[i]);
    return `Photo order: ${present.map((k, i) => `IMAGE ${i + 1} = ${names[k] || k}`).join(', ')}.`;
}

// Everything the platform does, for the Features screen
const PLATFORM_FEATURES = [
    { title: 'Task banao (admin)', text: 'Admin khud task bana sakta hai: kaam, model, photos, prompt, batch.' },
    { title: 'Customer app', text: 'Customer login karke apna kaam banata hai, status aur result dekhta hai.' },
    { title: 'Workers', text: 'Worker ki live list, pause / resume, drain, aur har worker ki limit.' },
    { title: 'Fair sharing', text: 'Kaam workers mein barabar baatta jata hai (open tasks / live workers).' },
    { title: 'Retry aur timeout', text: 'Fail hone par dobara koshish, task ki max time, 5 failures par worker auto-pause.' },
    { title: 'Gemini budget', text: 'Din ka call budget. Khatam hone par workers ruk jaate hain.' },
    { title: 'Customer limit', text: 'Customer ka din ka task limit.' },
    { title: 'Maintenance mode', text: 'Customers ko message dikhta hai, naya kaam band.' },
    { title: 'Model on / off', text: 'Har Gemini model alag se band ya chalu kar sakte ho.' },
    { title: 'Priority', text: 'Kisi task ko pehle chalane ke liye.' },
    { title: 'Admin action log', text: 'Admin ke har change ka record.' },
    { title: 'Email alerts (Brevo)', text: 'Worker band, queue bhari, ya auto-pause hone par mail.' },
    { title: 'Upload', text: 'Photos Cloudinary aur / ya ImgBB par upload hoti hain (admin se on / off).' },
    { title: 'Face check', text: 'Chehra kitna match hua, score dekhna. Kam ho to dobara banana.' },
    { title: 'Task prompts (DB)', text: 'Har task type ka prompt database mein, admin edit kar sakta hai.' },
    { title: 'Hair, shirt, suit, background (brush)', text: 'Brush se area chuno aur sirf wahi badlega: baal, shirt, suit ya background.' },
    { title: 'Multi-tool (chat aur image alag workers)', text: 'Har tool ke alag workers. Admin Tools screen se tool, worker aur task type ka mapping set hota hai. Galat tool ka worker kaam nahi le sakta.' },
    { title: 'Woman ke liye: earring, nose pin, shoes, glasses', text: 'Brush se area chuno, prompt mein item batao. Chehra aur baaki photo same rehti hai.' },
    { title: 'Man ke liye: glasses, suit, shirt, jeans, shorts, shoes', text: 'Brush se area chuno, prompt mein kapda ya item batao. Chehra aur baaki photo same rehti hai.' },
    { title: 'Pose change', text: 'Front, back, side, walking, sitting. Chehra aur outfit same, sirf pose badlega.' },
    { title: 'Image se text (OCR, tags, photo check)', text: 'Photo se text padhna, product ke tags banana, aur blur ya inappropriate photo pakadna.' },
    { title: 'Poster, logo aur sticker', text: 'Text ke saath poster ya banner, aur transparent logo / sticker.' },
    { title: 'Background remove, restore, aspect extend', text: 'Background hatakar transparent PNG, purani photo sudharna, aur bina crop ke aspect badhana.' },
    { title: 'Style transfer aur mockup', text: 'Photo ko sketch / painting / cartoon style mein badalna, aur design ko t-shirt, mug, bag par dikhana.' },
    { title: 'Product multi-angle', text: 'Ek product photo se front, side, back, top angles. Batch mein har photo ka alag angle.' },
    { title: 'Outfit change (face ref + photo ref)', text: 'Apna chehra, jis photo mein badalna hai wo photo, aur outfit ki photo. Chehra same rehta hai.' },
    { title: 'Family photo', text: 'Aadmi, aurat, baby boy, baby girl, dadi / nani, dada / nana: jo hain unki photo do, ek saath wali family photo banti hai.' },
    { title: 'Couple photo', text: 'Ladki ki photo aur ladke ki photo se ek saath wali couple photo banti hai. Dono ke chehre alag rehte hain.' },
    { title: 'Face swap', text: 'Apna chehra reference photo par lagta hai. Pose, kapde aur background same rehte hain.' },
    { title: 'Brush edit', text: 'Photo par brush se area select karo, rang badlo, text add ya hatao. Baaki photo same rehti hai.' }
];

// The brush: paint over a photo. Painted area = red. Save gives a black / red mask (red = area to change).
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

// Upload a picture that is already in data-URL form (the brush mask)
async function uploadDataUrl(dataUrl) {
    const fd = new FormData();
    fd.append('file', dataUrl);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const data = await (await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: fd })).json();
    if (!data.secure_url) throw new Error(data.error?.message || 'Mask upload nahi hui');
    return data.secure_url;
}


// Same instruction text the worker sends. p is the prompt row from ai_studio_prompts.
// A missing or off prompt shows a placeholder here, and the form stays blocked (see problemsFor).
function instructionFor(task, p) {
    const userPrompt = (task.prompt || '').trim();
    if (task.task_type === 'chat') return userPrompt;
    if (task.task_type === 'photo_read') return userPrompt || 'Describe this photo in detail.';
    if (!p || !p.enabled) return '<prompt DB mein nahi ya band hai>';

    const parts = [
        task.system_text || p.system_text,
        p.role_text,
        userPrompt ? `Prompt: "${userPrompt}"` : '',
        p.negative_text ? `[NEGATIVE CONSTRAINTS]: ${p.negative_text}` : ''
    ];
    let text = parts.filter(Boolean).join('\n');
    if (task.task_type === 'family_photo') text += `\n${familyOrderText(task)}`;
    if (typeOf(task.task_type)?.output === 'image') text += `\nAspect ratio: ${task.aspect_ratio}.`;
    return text;
}

// Row that will be saved in the database (the upload payload)
function rowFromForm(f) {
    const type = typeOf(f.task_type);
    const isImage = type.output === 'image';
    return {
        task_type: f.task_type,
        model: f.model,
        prompt: f.prompt.trim() || null,
        aspect_ratio: isImage ? f.aspect_ratio : null,
        image_size: isImage && capsOf(f.model).sizes.length ? f.image_size : null,
        face_image_url: type.inputs.includes('face') ? f.face_image_url.trim() : null,
        style_image_url: type.inputs.includes('style') ? f.style_image_url.trim() : null,
        input_image_url: type.inputs.includes('input') ? f.input_image_url.trim() : null,
        extra_image_urls: type.family
            ? f.family_urls.map(s => s.trim())   // empty slots stay, so the roles keep their order
            : type.extras ? f.extra_image_urls.split('\n').map(s => s.trim()).filter(Boolean) : null,
        conversation_id: f.task_type === 'chat' ? (f.conversation_id.trim() || null) : null,
        user_id: f.user_id.trim() || 'weargen_user_1',
        batch_count: isImage ? Math.min(10, Math.max(1, Number(f.batch_count) || 1)) : 1
    };
}

// The exact request the worker will send to the model. Images are shown as placeholders (their base64 is made by the worker).
function requestPreview(row, prompts) {
    const type = typeOf(row.task_type);
    const isImage = type.output === 'image';
    const img = (url) => ({ inlineData: { mimeType: 'image/jpeg', data: url ? `<base64 of ${url}>` : '<MISSING>' } });

    const parts = [{ text: instructionFor(row, prompts[row.task_type]) }];
    for (const key of ['face', 'style', 'input']) {
        if (type.inputs.includes(key)) parts.push(img(row[INPUT_COLUMN[key]]));
    }
    if (type.extras) (row.extra_image_urls || []).filter(Boolean).forEach(u => parts.push(img(u)));

    const contents = [];
    if (row.task_type === 'chat' && row.conversation_id) {
        contents.push({ role: 'user', parts: [{ text: `<finished earlier messages of conversation "${row.conversation_id}" are added here>` }] });
    }
    contents.push({ role: 'user', parts });

    const body = { contents };
    if (isImage) {
        body.generationConfig = {
            responseModalities: ['IMAGE'],
            imageConfig: { aspectRatio: row.aspect_ratio, ...(row.image_size ? { imageSize: row.image_size } : {}) }
        };
    }
    return {
        method: 'POST',
        url: `${GEMINI_BASE}/${row.model}:generateContent?key=<AI_STUDIO_KEY>`,
        body
    };
}

// What is wrong with the form (shown in red, the send button stays off)
function problemsFor(f, row, prompts) {
    const p = [];
    const type = typeOf(f.task_type);
    const caps = capsOf(f.model);
    if (!['chat', 'photo_read'].includes(f.task_type) && !prompts[f.task_type]?.enabled) p.push('Is kaam ka prompt DB mein nahi ya band hai (Prompts section dekho)');
    if (!caps || caps.kind !== type.kind) p.push('Is task type ke liye ye model nahi chalega');
    for (const key of type.inputs) {
        if (!type.optional?.includes(key) && !row[INPUT_COLUMN[key]]) p.push(`${labelFor(type, key)} chahiye`);
    }
    if (type.promptRequired && !row.prompt) p.push('Prompt zaroori hai');
    if (type.family && (row.extra_image_urls || []).filter(Boolean).length < 2) p.push('Parivar ki kam se kam 2 photos chahiye');
    if (type.output === 'image') {
        if (!caps.aspects.includes(row.aspect_ratio)) p.push('Aspect ratio is model mein support nahi');
        if (row.image_size && !caps.sizes.includes(row.image_size)) p.push('Size is model mein support nahi');
        if (row.batch_count < 1 || row.batch_count > 10) p.push('Batch 1 se 10 ke beech hona chahiye');
    }
    return p;
}

// Cloudinary upload for input photos chosen in the form
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
    if (!data.secure_url) throw new Error(data.error?.message || 'Upload nahi hua');
    return data.secure_url;
}

const STATUS_STYLE = {
    pending: 'text-stone-300 bg-stone-800 border-white/10',
    processing: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
    done: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    failed: 'text-rose-300 bg-rose-500/10 border-rose-500/30'
};

const EMPTY_FORM = {
    task_type: 'image_to_image_prompt', model: 'gemini-3.1-flash-image-preview', prompt: '', aspect_ratio: '4:5', image_size: '2K',
    face_image_url: '', style_image_url: '', input_image_url: '', extra_image_urls: '', family_urls: ['', '', '', '', '', ''], conversation_id: '', user_id: 'weargen_user_1', batch_count: 1
};

export default function AiStudioAdmin() {
    const [anonKey, setAnonKey] = useState(SUPABASE_KEY);
    const [sb, setSb] = useState(null);
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginMsg, setLoginMsg] = useState('');
    const [screen, setScreen] = useState('task');   // 'task' | 'workers' | 'features'
    const [msg, setMsg] = useState('');

    // Task screen
    const [form, setForm] = useState(EMPTY_FORM);
    // Workers screen
    const [workers, setWorkers] = useState([]);
    const [workerView, setWorkerView] = useState('active');   // 'active' | 'offline' | 'all'
    const [tasks, setTasks] = useState([]);
    // Results (Task screen): one tab and one page, loaded only on click
    const [resultTab, setResultTab] = useState('pending');
    const [resultPage, setResultPage] = useState(0);
    const [resultRows, setResultRows] = useState([]);
    const [resultCounts, setResultCounts] = useState({});
    const RESULT_PAGE = 10;
    const screenRef = useRef(screen);
    // Tasks sent from this screen, shown like a chat (oldest on top). Their status comes from realtime, not from queries.
    const [liveTasks, setLiveTasks] = useState([]);
    const [viewTask, setViewTask] = useState(null);   // the task open in the detail view (null = closed)
    const liveRef = useRef(null);
    useEffect(() => {
        if (liveRef.current) liveRef.current.scrollTop = liveRef.current.scrollHeight;
    }, [liveTasks]);
    const [taskFilter, setTaskFilter] = useState('all');
    const [cfg, setCfg] = useState(null);
    const [cfgSaved, setCfgSaved] = useState('');
    const [models, setModels] = useState([]);
    const [logRows, setLogRows] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [prompts, setPrompts] = useState({});          // task_type -> prompt row
    const [promptType, setPromptType] = useState('image_to_image_prompt');
    const [promptSaved, setPromptSaved] = useState('');
    // Tools screen: tools, which type belongs to which tool, each worker's tools, pending tasks per tool
    const [tools, setTools] = useState([]);
    const [toolTypes, setToolTypes] = useState([]);
    const [workerTools, setWorkerTools] = useState([]);
    const [pendingByTool, setPendingByTool] = useState({});
    const [newToolKey, setNewToolKey] = useState('');
    const [newToolLabel, setNewToolLabel] = useState('');
    const [catalog, setCatalog] = useState([]);   // every task type row (also the disabled ones)
    const [apps, setApps] = useState([]);         // the apps (WearGen, PPP ...)
    const [appTasks, setAppTasks] = useState([]); // which task types each app shows: { app_id, task_type }
    const [familyRoles, setFamilyRoles] = useState([]);   // every family role (also the disabled ones)
    const emptyRole = { role_key: '', label_admin: '', label_customer: '', prompt_text: '' };
    const [newRole, setNewRole] = useState(emptyRole);

    const type = typeOf(form.task_type);
    const modelOptions = useMemo(() => Object.keys(MODEL_CAPS).filter(id => capsOf(id).kind === type.kind), [type.kind, models]);
    const caps = capsOf(form.model) || capsOf(modelOptions[0]);
    const row = useMemo(() => rowFromForm(form), [form]);
    const problems = useMemo(() => problemsFor(form, row, prompts), [form, row, prompts]);
    const preview = useMemo(() => requestPreview(row, prompts), [row, prompts]);

    // ── Connect and session ──
    const connect = () => {
        if (!anonKey) return setMsg('Supabase anon key daalo');
        loadSupabaseClient(anonKey).then(client => {
            setSb(client);
            setMsg('Connected');
        }).catch(err => setMsg('Connect error: ' + err.message));
    };

    useEffect(() => {
        if (!sb) return;
        sb.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: sub } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
        return () => sub.subscription.unsubscribe();
    }, [sb]);

    useEffect(() => {
        if (!sb || !session) { setIsAdmin(false); return; }
        sb.rpc(API.IS_ADMIN).then(({ data, error }) => setIsAdmin(!error && !!data));
    }, [sb, session]);

    const login = async () => {
        setLoginMsg('');
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) setLoginMsg('Login nahi hua: ' + error.message);
        setPassword('');
    };
    // Connect by itself when the page opens, so the saved login (session) is restored after a refresh
    useEffect(() => {
        connect();
    }, []);

    // Refresh: reload every screen's data
    const refreshAll = async () => {
        if (!sb || !isAdmin) return;
        await Promise.all([loadConfig(), loadWorkers(), loadTasks(), loadCatalog(), loadFamilyRoles(), loadTools(), loadLog(), loadResults(resultTab, resultPage)]);
        setMsg('Refresh ho gaya ' + new Date().toLocaleTimeString());
    };
    const logout = async () => { await sb.auth.signOut(); };

    // ── Data (admin screens) ──
    // ── Task catalog: the task types, from the database ──
    const loadCatalog = useCallback(async () => {
        if (!sb || !isAdmin) return;
        const { data } = await sb.from(TABLES.CATALOG).select('*').order('sort');
        if (!data) return;
        setCatalog(data);
        setTaskTypes(data);
        const { data: appRows } = await sb.from(TABLES.APPS).select('*').order('sort');
        const { data: links } = await sb.from(TABLES.APP_TASKS).select('app_id, task_type');
        if (appRows) setApps(appRows);
        if (links) setAppTasks(links);
    }, [sb, isAdmin]);

    // Which app shows a task type (the customer app of that app lists only these)
    const toggleAppTask = async (appId, taskType, on) => {
        const req = on
            ? sb.from(TABLES.APP_TASKS).insert({ app_id: appId, task_type: taskType })
            : sb.from(TABLES.APP_TASKS).delete().eq('app_id', appId).eq('task_type', taskType);
        const { error } = await req;
        if (error) return setMsg('App ka kaam save nahi hua: ' + error.message);
        logAction('app_task', taskType, { app: appId, on });
        loadCatalog();
    };

    // Family photo roles: the enabled ones (in order) are the slots of the family form
    const loadFamilyRoles = useCallback(async () => {
        if (!sb || !isAdmin) return;
        const { data } = await sb.from(TABLES.FAMILY_ROLES).select('*').order('sort_order');
        if (!data) return;
        setFamilyRoles(data);
        FAMILY_ROLES = data.filter(r => r.enabled);
        setForm(f => ({ ...f, family_urls: FAMILY_ROLES.map((_, i) => f.family_urls[i] || '') }));
    }, [sb, isAdmin]);

    const toggleFamilyRole = async (key, enabled) => {
        const { error } = await sb.from(TABLES.FAMILY_ROLES).update({ enabled, updated_at: new Date().toISOString() }).eq('role_key', key);
        if (error) return setMsg('Role badalne mein error: ' + error.message);
        logAction('family_role_toggle', key, { enabled });
        loadFamilyRoles();
    };

    const addFamilyRole = async (role) => {
        const { error } = await sb.from(TABLES.FAMILY_ROLES).insert(role);
        if (error) return setMsg('Role banane mein error: ' + error.message);
        logAction('family_role_add', role.role_key);
        setNewRole(emptyRole);
        loadFamilyRoles();
    };

    const toggleCatalog = async (taskType, field, value) => {
        const { error } = await sb.from(TABLES.CATALOG).update({ [field]: value, updated_at: new Date().toISOString() }).eq('task_type', taskType);
        if (error) return setMsg('Kaam badalne mein error: ' + error.message);
        logAction('catalog_set', taskType, { [field]: value });
        loadCatalog();
    };

    const setWorkerTaskTypes = async (workerId, types) => {
        const { error } = await sb.rpc(API.SET_WORKER_TASK_TYPES, { p_worker_id: workerId, p_types: types });
        if (error) return setMsg('Worker ke kaam error: ' + error.message);
        logAction('worker_task_types', workerId, { types });
        loadTools();
    };
    // "Sab kaam" is stored as NULL. Otherwise the worker runs only the chosen types.
    const toggleWorkerAll = (w, all) => setWorkerTaskTypes(w.worker_id, all ? null : []);
    const toggleWorkerTaskType = (w, taskType, on) => {
        const current = w.task_types ?? catalog.map(c => c.task_type);
        const next = on ? [...new Set([...current, taskType])] : current.filter(x => x !== taskType);
        setWorkerTaskTypes(w.worker_id, next);
    };

    // ── Tools: chat, image and more. Each tool has its own workers. ──
    const loadTools = useCallback(async () => {
        if (!sb || !isAdmin) return;
        const [t, tt, w, pend] = await Promise.all([
            sb.from(TABLES.TOOLS).select('*').order('tool'),
            sb.from(TABLES.TOOL_TYPES).select('task_type, tool').order('task_type'),
            sb.from(TABLES.WORKERS).select('worker_id, tools, task_types').order('worker_id'),
            sb.from(TABLES.TASKS).select('tool').eq('status', 'pending').limit(1000)
        ]);
        setTools(t.data || []);
        setToolTypes(tt.data || []);
        setWorkerTools(w.data || []);
        const counts = {};
        (pend.data || []).forEach(r => { counts[r.tool] = (counts[r.tool] || 0) + 1; });
        setPendingByTool(counts);
        loadCatalog();
    }, [sb, isAdmin, loadCatalog]);

    useEffect(() => { loadCatalog(); }, [loadCatalog]);
    useEffect(() => { loadFamilyRoles(); }, [loadFamilyRoles]);


    useEffect(() => { if (screen === 'tools') loadTools(); }, [screen, loadTools]);

    const toggleTool = async (tool, enabled) => {
        const { error } = await sb.from(TABLES.TOOLS).update({ enabled }).eq('tool', tool);
        if (error) return setMsg('Tool error: ' + error.message);
        logAction('tool_toggle', tool, { enabled });
        loadTools();
    };

    const addTool = async () => {
        const key = newToolKey.trim();
        if (!key || !newToolLabel.trim()) return setMsg('Tool ka key aur label dono daalo');
        const { error } = await sb.from(TABLES.TOOLS).insert({ tool: key, label: newToolLabel.trim() });
        if (error) return setMsg('Tool banane mein error: ' + error.message);
        logAction('tool_add', key);
        setNewToolKey('');
        setNewToolLabel('');
        loadTools();
    };

    const setTaskTool = async (taskType, tool) => {
        const { error } = await sb.from(TABLES.TOOL_TYPES).update({ tool }).eq('task_type', taskType);
        if (error) return setMsg('Task type ka tool badalne mein error: ' + error.message);
        logAction('task_tool_set', taskType, { tool });
        loadTools();
    };

    const toggleWorkerTool = async (workerId, tool, on) => {
        const current = (workerTools.find(w => w.worker_id === workerId)?.tools) || [];
        const next = on ? [...current, tool] : current.filter(x => x !== tool);
        const { error } = await sb.rpc(API.SET_WORKER_TOOLS, { p_worker_id: workerId, p_tools: next });
        if (error) return setMsg('Worker tools error: ' + error.message);
        logAction('worker_tools', workerId, { tools: next });
        loadTools();
    };

    const loadWorkers = useCallback(async () => {
        if (!sb || !isAdmin) return;
        const { data } = await sb.from(TABLES.WORKER_LOAD).select('*').order('worker_id');
        setWorkers(data || []);
        const { count } = await sb.from(TABLES.TASKS).select('id', { count: 'exact', head: true }).eq('status', 'pending');
        setPendingCount(count || 0);
        loadLog();
    }, [sb, isAdmin]);

    const loadTasks = useCallback(async () => {
        if (!sb || !isAdmin) return;
        let q = sb.from(TABLES.TASKS).select('id, task_type, model, prompt, status, error, worker_id, user_id, output_image_url, output_text, created_at, priority, attempts').order('id', { ascending: false }).limit(50);
        if (taskFilter !== 'all') q = q.eq('status', taskFilter);
        const { data } = await q;
        setTasks(data || []);
    }, [sb, isAdmin, taskFilter]);

    // Results: one request per tab or page click (no polling)
    const loadResults = async (tab, page) => {
        if (!sb || !isAdmin) return;
        const from = page * RESULT_PAGE;
        const { data, error, count } = await sb.from(TABLES.TASKS)
            .select('id, app_id, task_type, model, status, error, prompt, face_image_url, style_image_url, input_image_url, output_text, output_image_url, output_image_urls, face_match_score, aspect_ratio, image_size, worker_id, created_at, duration_ms, process_ms', { count: 'exact' })
            .eq('status', tab)
            .order('id', { ascending: false })
            .range(from, from + RESULT_PAGE - 1);
        if (error) return setMsg('Results load error: ' + error.message);
        setResultRows(data || []);
        setResultCounts(prev => ({ ...prev, [tab]: count ?? 0 }));
    };
    const pickResultTab = (tab) => { setResultTab(tab); setResultPage(0); loadResults(tab, 0); };
    const goResultPage = (page) => { setResultPage(page); loadResults(resultTab, page); };

    // The Workers screen's task list: loaded when that screen opens or its filter changes
    useEffect(() => {
        screenRef.current = screen;
        if (screen === 'workers') loadTasks();
    }, [screen, loadTasks]);

    // Workers and live updates. Task changes reload the task list only on the Workers screen.
    useEffect(() => {
        if (!sb || !isAdmin) return;
        loadWorkers();
        const timer = setInterval(loadWorkers, REFRESH_MS);
        const channel = sb.channel('ai-studio-admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.TASKS }, () => { if (screenRef.current === 'workers') loadTasks(); })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLES.TASKS }, ({ new: row }) => {
                // The changed row comes with the event: update the chat entry in place, no query
                setLiveTasks(list => (list.some(t => t.id === row.id) ? list.map(t => (t.id === row.id ? row : t)) : list));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.WORKERS }, () => loadWorkers())
            .subscribe();
        return () => { clearInterval(timer); sb.removeChannel(channel); };
    }, [sb, isAdmin, loadWorkers, loadTasks]);

    // ── Worker settings (limits, uploads, keys) ──
    const loadConfig = async () => {
        if (!sb || !isAdmin) return;
        const [s, k] = await Promise.all([
            sb.from(TABLES.SETTINGS).select('*').eq('id', 1).single(),
            sb.from(TABLES.SECRETS).select('imgbb_api_key, brevo_api_key').eq('id', 1).single()
        ]);
        if (s.data) setCfg({ ...s.data, imgbb_api_key: k.data?.imgbb_api_key || '', brevo_api_key: k.data?.brevo_api_key || '' });
        const m = await sb.from(TABLES.MODELS).select('*').order('model_id');
        setModels(m.data || []);
        setModelCaps(m.data || []);
        const pr = await sb.from(TABLES.PROMPTS).select('*');
        setPrompts(Object.fromEntries((pr.data || []).map(r => [r.task_type, r])));
    };

    const saveConfig = async () => {
        if (!cfg.cloudinary_enabled && !cfg.imgbb_enabled) return setMsg('Kam se kam ek upload chalu rakho');
        if (cfg.imgbb_enabled && !cfg.imgbb_api_key) return setMsg('ImgBB chalu hai to ImgBB key bhi daalo');
        const { error: e1 } = await sb.from(TABLES.SETTINGS).update({
            task_concurrency: Number(cfg.task_concurrency),
            gemini_concurrency: Number(cfg.gemini_concurrency),
            photos_per_task_max: Number(cfg.photos_per_task_max),
            cloudinary_enabled: cfg.cloudinary_enabled,
            cloudinary_cloud_name: cfg.cloudinary_cloud_name.trim(),
            cloudinary_upload_preset: cfg.cloudinary_upload_preset.trim(),
            imgbb_enabled: cfg.imgbb_enabled,
            max_attempts: Number(cfg.max_attempts),
            retry_delay_sec: Number(cfg.retry_delay_sec),
            task_timeout_sec: Number(cfg.task_timeout_sec),
            alert_queue_size: Number(cfg.alert_queue_size),
            user_daily_task_limit: Number(cfg.user_daily_task_limit),
            daily_gemini_budget: Number(cfg.daily_gemini_budget),
            maintenance_on: cfg.maintenance_on,
            maintenance_message: cfg.maintenance_message.trim(),
            alert_email_enabled: cfg.alert_email_enabled,
            alert_admin_email: cfg.alert_admin_email.trim(),
            alert_sender_email: cfg.alert_sender_email.trim(),
            alert_sender_name: cfg.alert_sender_name.trim() || 'AI Studio',
            alert_cooldown_min: Number(cfg.alert_cooldown_min),
            match_threshold: Number(cfg.match_threshold),
            match_retries: Number(cfg.match_retries),
            stale_min: Number(cfg.stale_min),
            fallback_sec: Number(cfg.fallback_sec),
            heartbeat_sec: Number(cfg.heartbeat_sec),
            image_max_side: Number(cfg.image_max_side),
            image_quality: Number(cfg.image_quality),
            updated_at: new Date().toISOString()
        }).eq('id', 1);
        if (e1) return setMsg('Settings save error: ' + e1.message);
        const { error: e2 } = await sb.from(TABLES.SECRETS).update({
            imgbb_api_key: cfg.imgbb_api_key.trim(),
            brevo_api_key: cfg.brevo_api_key.trim()
        }).eq('id', 1);
        if (e2) return setMsg('Key save error: ' + e2.message);
        setCfgSaved('Save ho gaya ' + new Date().toLocaleTimeString());
        logAction('settings_save', 'ai_studio_settings', { maintenance_on: cfg.maintenance_on, daily_gemini_budget: Number(cfg.daily_gemini_budget) });
        setMsg('Settings save ho gayi. Workers naye settings kuch second mein lenge.');
    };

    // Several photos at once (up to 10): each is compressed and uploaded, then the links go into the list
    const pickExtraFiles = async (e) => {
        const files = Array.from(e.target.files || []).slice(0, 10);
        if (!files.length) return;
        setMsg(`${files.length} photo upload ho rahi hai...`);
        try {
            const urls = [];
            for (const f of files) urls.push(await uploadFile(f));
            const current = form.extra_image_urls.split('\n').map(s => s.trim()).filter(Boolean);
            setForm(f => ({ ...f, extra_image_urls: [...current, ...urls].slice(0, 10).join('\n') }));
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
            const url = await uploadDataUrl(dataUrl);
            setForm(f => ({ ...f, style_image_url: url }));
            setMsg('Area save ho gaya');
        } catch (err) {
            setMsg('Area upload nahi hua: ' + err.message);
        }
    };

    // ── Task prompts (saved to ai_studio_prompts; workers read them on their next settings load) ──
    const setPromptField = (key, value) => setPrompts(p => ({ ...p, [promptType]: { ...p[promptType], [key]: value } }));
    const savePrompt = async () => {
        const row = prompts[promptType];
        if (!row.system_text.trim()) return setMsg('System text khali nahi ho sakta');
        const { error } = await sb.from(TABLES.PROMPTS).update({
            system_text: row.system_text.trim(),
            role_text: row.role_text.trim(),
            negative_text: row.negative_text.trim(),
            enabled: row.enabled,
            updated_at: new Date().toISOString()
        }).eq('task_type', promptType);
        if (error) return setMsg('Prompt save error: ' + error.message);
        setPromptSaved('Save ho gaya ' + new Date().toLocaleTimeString());
        logAction('prompt_save', promptType, { enabled: row.enabled });
    };

    // Brevo test mail: the database sends it, so the key never leaves the server
    const sendTestMail = async () => {
        const { error } = await sb.rpc('ai_studio_send_test_mail');
        setMsg(error ? 'Test mail error: ' + error.message : 'Test mail bheja gaya. Inbox check karo.');
    };

    // Load once when the admin logs in (not on every refresh, so typing is not overwritten)
    useEffect(() => { loadConfig(); }, [sb, isAdmin]);

    // ── Form helpers ──
    const changeTaskType = (taskType) => {
        const t = typeOf(taskType);
        const models = Object.keys(MODEL_CAPS).filter(id => capsOf(id).kind === t.kind);
        const model = models[0];
        const c = capsOf(model);
        setForm(f => ({
            ...f,
            task_type: taskType,
            model,
            aspect_ratio: c.kind === 'image' ? (c.aspects.includes(f.aspect_ratio) ? f.aspect_ratio : c.aspects[0]) : f.aspect_ratio,
            image_size: c.sizes.length ? (c.sizes.includes(f.image_size) ? f.image_size : c.sizes[1] || c.sizes[0]) : ''
        }));
    };

    const changeModel = (model) => {
        const c = capsOf(model);
        setForm(f => ({
            ...f,
            model,
            aspect_ratio: c.kind === 'image' ? (c.aspects.includes(f.aspect_ratio) ? f.aspect_ratio : c.aspects[0]) : f.aspect_ratio,
            image_size: c.sizes.length ? (c.sizes.includes(f.image_size) ? f.image_size : c.sizes[1] || c.sizes[0]) : ''
        }));
    };

    const pickFile = async (e, field) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setMsg('Upload ho raha hai...');
        try {
            const url = await uploadFile(file);
            setForm(f => ({ ...f, [field]: url }));
            setMsg('Upload ho gaya');
        } catch (err) {
            setMsg('Upload error: ' + err.message);
        }
    };

    const sendTask = async () => {
        if (problems.length) return setMsg('Pehle ye theek karo: ' + problems.join(', '));
        const { data, error } = await sb.rpc(API.CREATE_TASK, { p_payload: row });
        if (error) return setMsg('Task nahi bana: ' + error.message);
        const created = data?.[0];
        if (created) setLiveTasks(list => [...list, created].slice(-50));
        setMsg(`Task #${created?.id} queue mein daal diya. Worker ise uthayega.`);
        setForm(f => ({ ...f, prompt: '' }));
    };

    // ── Worker controls ──
    // Every change is written to the admin action log: who did what, and when
    // Save a catalog row (names, hint, photo slots)
    const saveCatalogRow = async (taskType, f) => {
        const { error } = await sb.from(TABLES.CATALOG).update({
            label: f.label.trim(),
            customer_label: f.customer_label.trim() || null,
            hint: f.hint.trim(),
            inputs: f.inputs,
            optional: f.optional,
            labels: f.labels,
            updated_at: new Date().toISOString()
        }).eq('task_type', taskType);
        if (error) return setMsg('Kaam save nahi hua: ' + error.message);
        logAction('catalog_edit', taskType, { inputs: f.inputs, optional: f.optional });
        loadCatalog();
    };

    // Clean-up: stuck tasks go back to pending, or failed tasks are deleted. workerId null = every worker.
    const cleanupTasks = async (kind, workerId) => {
        const who = workerId ? 'worker ' + workerId + ' ke' : 'sab workers ke';
        const what = kind === 'release'
            ? 'atke (processing) tasks pending mein wapas bheje jayenge'
            : 'failed tasks hamesha ke liye delete ho jayenge';
        if (!window.confirm(who + ' ' + what + '. Pakka karna hai?')) return;
        const fn = kind === 'release' ? API.RELEASE_TASKS : API.CLEAR_FAILED;
        const { data, error } = await sb.rpc(fn, { p_worker_id: workerId || null });
        if (error) return setMsg('Clean-up error: ' + error.message);
        logAction(kind === 'release' ? 'tasks_release' : 'tasks_clear_failed', workerId || 'all', { count: data });
        setMsg(data + ' task ' + (kind === 'release' ? 'wapas pending mein gaye' : 'delete ho gaye'));
        loadWorkers();
        loadTasks();
    };

    const logAction = (action, target, details) => sb.from(TABLES.LOG).insert([{ action, target: String(target ?? ''), details: details ?? null }]);

    const loadLog = async () => {
        const { data } = await sb.from(TABLES.LOG).select('*').order('id', { ascending: false }).limit(30);
        setLogRows(data || []);
    };

    const togglePause = async (targetId, pausedValue) => {
        const base = sb.from(TABLES.WORKERS).update(pausedValue ? { paused: true } : { paused: false, pause_reason: null });
        const { error } = targetId === 'all' ? await base.neq('worker_id', '') : await base.eq('worker_id', targetId);
        if (error) return setMsg('Pause error: ' + error.message);
        logAction(pausedValue ? 'pause' : 'resume', targetId);
        loadWorkers();
    };

    const toggleDrain = async (workerIdValue, value) => {
        const { error } = await sb.from(TABLES.WORKERS).update({ drain: value }).eq('worker_id', workerIdValue);
        if (error) return setMsg('Drain error: ' + error.message);
        logAction(value ? 'drain_on' : 'drain_off', workerIdValue);
        loadWorkers();
    };

    const setTaskLimit = async (workerIdValue, value) => {
        const limit = value === '' || value == null ? null : Math.min(50, Math.max(1, Number(value)));
        const { error } = await sb.from(TABLES.WORKERS).update({ task_limit: limit }).eq('worker_id', workerIdValue);
        if (error) return setMsg('Limit error: ' + error.message);
        logAction('task_limit', workerIdValue, { limit: limit });
        loadWorkers();
    };

    const toggleModel = async (modelId, enabled) => {
        const { error } = await sb.from(TABLES.MODELS).update({ enabled: enabled }).eq('model_id', modelId);
        if (error) return setMsg('Model error: ' + error.message);
        logAction(enabled ? 'model_on' : 'model_off', modelId);
        loadConfig();
    };

    // Image size (1K, 2K, 4K) and aspect ratio options of a model: the task form and the customer app read them
    const toggleModelOption = async (modelId, field, value, on) => {
        const order = field === 'sizes' ? IMAGE_SIZES : IMAGE_ASPECTS;
        const current = models.find(m => m.model_id === modelId)?.[field] || [];
        const next = (on ? [...current, value] : current.filter(x => x !== value))
            .sort((a, b) => order.indexOf(a) - order.indexOf(b));
        const { error } = await sb.from(TABLES.MODELS).update({ [field]: next }).eq('model_id', modelId);
        if (error) return setMsg('Model error: ' + error.message);
        logAction('model_option', modelId, { [field]: next });
        loadConfig();
    };

    const setPriority = async (taskId, priority) => {
        const { error } = await sb.from(TABLES.TASKS).update({ priority: priority }).eq('id', taskId);
        if (error) return setMsg('Priority error: ' + error.message);
        logAction('priority', taskId, { priority: priority });
        loadTasks();
    };

    const deleteTask = async (id) => {
        const { error } = await sb.from(TABLES.TASKS).delete().eq('id', id);
        if (error) return setMsg('Delete error: ' + error.message);
        logAction('delete_task', id);
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    // ── Derived numbers for the workers screen ──
    // A worker is active when it was seen within two heartbeats (at least 60 sec)
    const aliveMs = Math.max(60, Number(cfg?.heartbeat_sec || 30) * 2) * 1000;
    const isAlive = (w) => new Date(w.last_seen).getTime() > Date.now() - aliveMs;
    const liveWorkers = workers.filter(w => isAlive(w) && !w.paused);
    const activeCount = workers.filter(isAlive).length;
    const fairLimit = Math.max(1, Math.ceil((tasks.filter(t => t.status === 'pending' || t.status === 'processing').length) / Math.max(1, liveWorkers.length)));

    // Alerts for the admin (shown at the top of the workers screen)
    const alerts = [];
    if (cfg && pendingCount >= cfg.alert_queue_size) alerts.push(`Queue bhari: ${pendingCount} task pending hain`);
    if (pendingCount > 0 && liveWorkers.length === 0) alerts.push('Sab workers offline hain, pending tasks ruke hain');
    workers.filter(w => w.pause_reason).forEach(w => alerts.push(`${w.worker_id} khud pause hua: ${w.pause_reason}`));

    // ── Screens ──
    if (!sb) {
        return (
            <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-stone-900 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h1 className="text-lg font-extrabold flex items-center gap-2"><Shield className="w-5 h-5 text-yellow-300" /> AI Studio Admin</h1>
                    <button onClick={connect} className="w-full h-10 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black">Connect</button>
                    {msg && <p className="text-xs text-yellow-200">{msg}</p>}
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-stone-900 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h1 className="text-lg font-extrabold flex items-center gap-2"><Shield className="w-5 h-5 text-yellow-300" /> Admin login</h1>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Admin email" className="w-full h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                    <button onClick={login} className="w-full h-10 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black flex items-center justify-center gap-2"><LogIn className="w-4 h-4" /> Login</button>
                    {loginMsg && <p className="text-xs text-rose-300">{loginMsg}</p>}
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-stone-900 border border-rose-500/30 rounded-2xl p-6 space-y-4">
                    <p className="text-sm text-rose-300 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Ye account admin nahi hai.</p>
                    <p className="text-xs text-stone-400">Admin banane ke liye ai_studio_admin.sql ke aakhri hisse ka SQL chalao.</p>
                    <button onClick={logout} className="h-9 px-4 bg-stone-800 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-2"><LogOut className="w-3.5 h-3.5" /> Logout</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 text-stone-100 p-4 sm:p-6 space-y-5">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center"><Shield className="w-5 h-5 text-stone-950" /></div>
                    <div>
                        <h1 className="text-lg font-extrabold">AI Studio <span className="text-yellow-300">Admin</span></h1>
                        <p className="text-[11px] text-stone-400">{session.user.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setScreen('task')} className={`h-9 px-4 rounded-xl text-xs font-bold border ${screen === 'task' ? 'bg-yellow-400 text-stone-950 border-yellow-300' : 'bg-stone-900 border-white/10 text-stone-300'}`}>Task banao</button>
                    <button onClick={() => setScreen('workers')} className={`h-9 px-4 rounded-xl text-xs font-bold border ${screen === 'workers' ? 'bg-yellow-400 text-stone-950 border-yellow-300' : 'bg-stone-900 border-white/10 text-stone-300'}`}>Workers</button>
                    <button onClick={() => setScreen('tools')} className={`h-9 px-4 rounded-xl text-xs font-bold border ${screen === 'tools' ? 'bg-yellow-400 text-stone-950 border-yellow-300' : 'bg-stone-900 border-white/10 text-stone-300'}`}>Tools</button>
                    <button onClick={() => setScreen('features')} className={`h-9 px-4 rounded-xl text-xs font-bold border ${screen === 'features' ? 'bg-yellow-400 text-stone-950 border-yellow-300' : 'bg-stone-900 border-white/10 text-stone-300'}`}>Features</button>
                    <button onClick={refreshAll} title="Refresh" className="h-9 px-3 rounded-xl text-xs font-bold border border-white/10 bg-stone-900 text-stone-300 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
                    <button onClick={logout} className="h-9 px-3 rounded-xl text-xs font-bold border border-white/10 bg-stone-900 text-stone-300 flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Logout</button>
                </div>
            </header>

            {msg && <p className="text-xs text-yellow-200 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-3 py-2">{msg}</p>}

            {screen === 'task' && (
                <div className="grid gap-5 lg:grid-cols-2">
                    {/* LEFT: input */}
                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-4">
                        <h2 className="text-sm font-extrabold">1. Input</h2>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <select value={form.task_type} onChange={e => changeTaskType(e.target.value)} className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs">
                                {Object.entries(TASK_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
                            </select>
                            <select value={form.model} onChange={e => changeModel(e.target.value)} className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs">
                                {modelOptions.map(m => <option key={m} value={m}>{capsOf(m).label} ({m})</option>)}
                            </select>
                        </div>

                        {/* What this task type accepts */}
                        <div className="bg-stone-950 border border-white/10 rounded-xl p-3 text-[11px] space-y-1">
                            <p className="font-bold text-stone-200">Is task type mein ye input lagta hai:</p>
                            {type.inputs.length === 0 && <p className="text-stone-400">Koi reference photo nahi.</p>}
                            {type.inputs.map(k => <p key={k} className="text-stone-300">• {labelFor(type, k)} {type.optional?.includes(k) ? <span className="text-stone-400">(optional)</span> : <span className="text-yellow-300">(zaroori)</span>}</p>)}
                            {type.extras && <p className="text-stone-300">• Extra photos <span className="text-stone-400">(optional, ek line mein ek URL)</span></p>}
                            <p className="text-stone-300">• Prompt: {type.promptRequired ? <span className="text-yellow-300">zaroori</span> : <span className="text-stone-400">optional</span>}</p>
                            <p className="text-stone-300">• Output: {type.output === 'image' ? 'photo' : 'text'}</p>
                        </div>

                        {/* Model capabilities */}
                        {caps.kind === 'image' && (
                            <div className="bg-stone-950 border border-white/10 rounded-xl p-3 text-[11px] text-stone-300">
                                <p className="font-bold text-stone-200 mb-1">Is model ki settings</p>
                                <p>Aspect ratio: {caps.aspects.join(', ')}</p>
                                <p>Size: {caps.sizes.length ? caps.sizes.join(', ') : 'is model mein size option nahi'}</p>
                            </div>
                        )}

                        {/* Reference inputs */}
                        {type.inputs.map(key => type.edit && key === 'style' ? (
                            <MaskBlock key={key} label={labelFor(type, key)} photoUrl={form.face_image_url} maskUrl={form.style_image_url} onSave={saveMask} />
                        ) : (
                            <div key={key} className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
                                <input value={form[INPUT_COLUMN[key]]} onChange={e => setForm({ ...form, [INPUT_COLUMN[key]]: e.target.value })} placeholder={`${labelFor(type, key)} URL`} className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                                <label className="h-10 px-3 flex items-center gap-1.5 bg-stone-800 border border-white/10 rounded-xl text-xs font-bold cursor-pointer">
                                    <Upload className="w-3.5 h-3.5" /> Upload
                                    <input type="file" accept="image/*" className="hidden" onChange={e => pickFile(e, INPUT_COLUMN[key])} />
                                </label>
                            </div>
                        ))}

                        {type.family && (
                            <div className="space-y-2">
                                <p className="text-[11px] text-stone-400">Parivar ke members (jo nahi hai use khali chhodo, kam se kam 2 photos)</p>
                                {FAMILY_ROLES.map((role, i) => (
                                    <div key={role.role_key} className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
                                        <input value={form.family_urls[i]} onChange={e => setFamilyUrl(i, e.target.value)} placeholder={`${role.label_admin} ka photo link`} className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                                        <label className="h-10 px-3 flex items-center gap-1.5 bg-stone-800 border border-white/10 rounded-xl text-xs font-bold cursor-pointer">
                                            <Upload className="w-3.5 h-3.5" /> Upload
                                            <input type="file" accept="image/*" className="hidden" onChange={e => pickFamilyFile(e, i)} />
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {type.extras && !type.family && (
                            <input type="file" accept="image/*" multiple onChange={pickExtraFiles} className="text-xs text-stone-300" />
                        )}

                        {type.extras && !type.family && (
                            <textarea value={form.extra_image_urls} onChange={e => setForm({ ...form, extra_image_urls: e.target.value })} rows={2} placeholder="Extra photos (optional): ek line mein ek URL" className="w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs font-mono" />
                        )}

                        <textarea value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })} rows={3} placeholder={type.promptRequired ? 'Prompt (zaroori)' : 'Prompt (optional)'} className="w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs" />

                        {form.task_type === 'chat' && (
                            <input value={form.conversation_id} onChange={e => setForm({ ...form, conversation_id: e.target.value })} placeholder="Conversation ID (same = same chat, khali = single message)" className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                        )}

                        {caps.kind === 'image' && (
                            <div className="grid gap-3 sm:grid-cols-3">
                                <select value={form.aspect_ratio} onChange={e => setForm({ ...form, aspect_ratio: e.target.value })} className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs">
                                    {caps.aspects.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                                <select value={form.image_size} onChange={e => setForm({ ...form, image_size: e.target.value })} disabled={!caps.sizes.length} className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs disabled:opacity-40">
                                    {(caps.sizes.length ? caps.sizes : ['']).map(s => <option key={s} value={s}>{s || 'Size option nahi'}</option>)}
                                </select>
                                <input type="number" min={1} max={10} value={form.batch_count} onChange={e => setForm({ ...form, batch_count: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })} placeholder="Kitni photos (1-4)" className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                            </div>
                        )}

                        <input value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} placeholder="User ID" className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                    </section>

                    {/* RIGHT: checks + payload */}
                    <section className="space-y-5">
                        <div className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                            <h2 className="text-sm font-extrabold">2. Check</h2>
                            {problems.length === 0
                                ? <p className="text-xs text-emerald-300">Sab theek hai. Task bheja ja sakta hai.</p>
                                : <ul className="text-xs text-rose-300 space-y-1">{problems.map(p => <li key={p}>• {p}</li>)}</ul>}
                            <button onClick={sendTask} disabled={problems.length > 0} className="h-11 px-5 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black flex items-center gap-2 disabled:opacity-40"><Send className="w-4 h-4" /> Task queue mein daalo</button>
                        </div>

                        <div className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                            <h2 className="text-sm font-extrabold flex items-center gap-2"><Eye className="w-4 h-4 text-yellow-300" /> Model ko jo jayega (request)</h2>
                            <p className="text-[11px] text-stone-400">Model: <span className="font-mono text-stone-200">{row.model}</span></p>
                            <pre className="text-[10px] text-stone-200 bg-stone-950 border border-white/10 rounded-xl p-3 max-h-80 overflow-auto whitespace-pre-wrap">{JSON.stringify(preview, null, 2)}</pre>
                            {caps.kind === 'image' && (
                                <p className="text-[11px] text-stone-400">Har photo ke baad {row.batch_count > 1 ? `${row.batch_count} photos banengi` : '1 photo banegi'}. Face reference ho to face score {MATCH_THRESHOLD} se kam aane par dobara banegi (max 2 baar).</p>
                            )}
                        </div>

                        <div className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                            <h2 className="text-sm font-extrabold">DB mein jo save hoga</h2>
                            <pre className="text-[10px] text-stone-200 bg-stone-950 border border-white/10 rounded-xl p-3 max-h-64 overflow-auto whitespace-pre-wrap">{JSON.stringify(row, null, 2)}</pre>
                        </div>
                    </section>
                </div>
            )}

            {viewTask && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setViewTask(null)}>
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-stone-900 border border-white/10 rounded-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-sm font-extrabold"><span className="font-mono text-yellow-300">#{viewTask.id}</span> · {apps.find(a => a.app_id === viewTask.app_id)?.label || viewTask.app_id} · {typeOf(viewTask.task_type).label || viewTask.task_type}</h2>
                            <button type="button" onClick={() => setViewTask(null)} className="h-8 px-3 rounded-lg border border-white/10 bg-stone-950 text-xs font-bold">Band karo</button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 text-xs text-stone-300">
                            <p>Status: <span className="font-bold">{viewTask.status}</span></p>
                            <p>Model: <span className="font-mono">{viewTask.model}</span></p>
                            <p>Worker: <span className="font-mono">{viewTask.worker_id || '—'}</span></p>
                            <p>Bheja gaya: {viewTask.created_at ? new Date(viewTask.created_at).toLocaleString() : '—'}</p>
                            <p>Kitna time: {viewTask.duration_ms != null ? `${(viewTask.duration_ms / 1000).toFixed(1)} sek` : '—'}{viewTask.process_ms != null && <span className="text-stone-400"> (worker {(viewTask.process_ms / 1000).toFixed(1)} sek)</span>}</p>
                            {viewTask.aspect_ratio && <p>Aspect / size: {viewTask.aspect_ratio}{viewTask.image_size ? ' · ' + viewTask.image_size : ''}</p>}
                            {viewTask.face_match_score != null && <p>Chehra match: {viewTask.face_match_score}</p>}
                        </div>
                        {viewTask.prompt && (
                            <div className="space-y-1">
                                <p className="text-[11px] text-stone-400">Prompt</p>
                                <p className="text-xs text-stone-200 whitespace-pre-wrap bg-stone-950 border border-white/10 rounded-xl p-3">{viewTask.prompt}</p>
                            </div>
                        )}
                        {[['Chehra', viewTask.face_image_url], ['Style / kapde', viewTask.style_image_url], ['Input photo', viewTask.input_image_url]].filter(x => x[1]).map(([label, url]) => (
                            <div key={label} className="space-y-1">
                                <p className="text-[11px] text-stone-400">{label}</p>
                                <a href={url} target="_blank" rel="noreferrer" className="text-xs text-sky-300 underline break-all">{url}</a>
                            </div>
                        ))}
                        {(viewTask.output_image_urls?.length ? viewTask.output_image_urls : viewTask.output_image_url ? [viewTask.output_image_url] : []).map(u => (
                            <img key={u} src={u} alt="" className="max-h-80 rounded-lg" />
                        ))}
                        {viewTask.output_text && <ChatText text={viewTask.output_text} />}
                        {viewTask.error && <p className="text-xs text-rose-300 whitespace-pre-wrap">{viewTask.error}</p>}
                    </div>
                </div>
            )}

            {screen === 'task' && liveTasks.length > 0 && (
                <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                    <h2 className="text-sm font-extrabold">Bheje gaye kaam (live)</h2>
                    <div ref={liveRef} className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                        {liveTasks.map(t => (
                            <div key={t.id} className="bg-stone-950 border border-white/10 rounded-xl p-3 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <span><span className="font-mono text-yellow-300">#{t.id}</span> · <span className="font-bold text-sky-300">{apps.find(a => a.app_id === t.app_id)?.label || t.app_id}</span> · <span className="text-stone-300">{typeOf(t.task_type).label || t.task_type}</span></span>
                                    <span className="flex items-center gap-2">
                                        <button type="button" onClick={() => setViewTask(t)} className="underline text-yellow-300">Dekho</button>
                                        {t.duration_ms != null && (
                                            <span className="font-mono text-stone-400" title="Queue se finish tak">
                                                {(t.duration_ms / 1000).toFixed(1)} sek
                                                {t.process_ms != null && <span className="text-stone-500"> (worker {(t.process_ms / 1000).toFixed(1)} sek)</span>}
                                            </span>
                                        )}
                                        <span className={`font-bold ${t.status === 'done' ? 'text-emerald-300' : t.status === 'failed' ? 'text-rose-300' : 'text-yellow-300'}`}>{t.status}</span>
                                    </span>
                                </div>
                                {t.output_image_url && <img src={t.output_image_url} alt="" className="max-h-64 rounded-lg" />}
                                {t.output_text && <ChatText text={t.output_text} />}
                                {t.error && <p className="text-xs text-rose-300">{t.error}</p>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {screen === 'task' && (
                <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-extrabold">Results</h2>
                        <div className="flex gap-1.5">
                            {[['pending', 'Pending'], ['processing', 'Processing'], ['done', 'Completed'], ['failed', 'Failed']].map(([key, label]) => (
                                <button key={key} type="button" onClick={() => pickResultTab(key)} className={`h-8 px-3 rounded-lg text-xs font-bold border ${resultTab === key ? 'bg-yellow-400 text-stone-950 border-yellow-300' : 'bg-stone-950 border-white/10 text-stone-300'}`}>{label}{resultCounts[key] != null ? ` (${resultCounts[key]})` : ''}</button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="text-left text-stone-400"><tr><th className="p-2">#</th><th className="p-2">App</th><th className="p-2">Kaam</th><th className="p-2">Model</th><th className="p-2">Worker</th><th className="p-2">Sek</th><th className="p-2">Result</th><th className="p-2">Error</th><th className="p-2">Dekho</th></tr></thead>
                            <tbody>
                                {resultRows.map(t => (
                                    <tr key={t.id} className="border-t border-white/5 align-top">
                                        <td className="p-2 font-mono text-yellow-300">#{t.id}</td>
                                        <td className="p-2 font-bold text-sky-300">{apps.find(a => a.app_id === t.app_id)?.label || t.app_id}</td>
                                        <td className="p-2 text-stone-300">{typeOf(t.task_type).label || t.task_type}</td>
                                        <td className="p-2 font-mono text-stone-400">{t.model}</td>
                                        <td className="p-2 font-mono text-stone-400">{t.worker_id || '—'}</td>
                                        <td className="p-2 font-mono text-stone-300">{t.duration_ms != null ? (t.duration_ms / 1000).toFixed(1) : '—'}</td>
                                        <td className="p-2">{t.output_image_url && <a href={t.output_image_url} target="_blank" rel="noreferrer" className="text-emerald-300 underline mr-2">Photo</a>}{t.output_text && <span className="text-stone-200">{t.output_text.slice(0, 120)}</span>}{!t.output_image_url && !t.output_text && '—'}</td>
                                        <td className="p-2 text-rose-300">{t.error || ''}</td>
                                        <td className="p-2"><button type="button" onClick={() => setViewTask(t)} className="underline text-yellow-300">Dekho</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {resultRows.length === 0 && <p className="text-center text-xs text-stone-500 py-6">{resultCounts[resultTab] == null ? 'Upar se tab chunein' : 'Is tab mein koi task nahi.'}</p>}
                    {resultCounts[resultTab] > RESULT_PAGE && (
                        <div className="flex items-center justify-between text-xs">
                            <button type="button" disabled={resultPage === 0} onClick={() => goResultPage(resultPage - 1)} className="h-8 px-3 rounded-lg border border-white/10 bg-stone-950 disabled:opacity-40">Pichhla</button>
                            <span className="font-mono text-stone-400">Page {resultPage + 1} / {Math.ceil(resultCounts[resultTab] / RESULT_PAGE)}</span>
                            <button type="button" disabled={(resultPage + 1) * RESULT_PAGE >= resultCounts[resultTab]} onClick={() => goResultPage(resultPage + 1)} className="h-8 px-3 rounded-lg border border-white/10 bg-stone-950 disabled:opacity-40">Agla</button>
                        </div>
                    )}
                </section>
            )}

            {screen === 'workers' && (
                <div className="space-y-5">
                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                        <h2 className="text-sm font-extrabold">Clean-up (sab workers)</h2>
                        <p className="text-[11px] text-stone-400">Atke tasks (processing) pending mein wapas bhejo, ya failed tasks delete karo. Har click se pehle confirm hoga.</p>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => cleanupTasks('release', null)} className="h-10 px-4 rounded-xl border border-white/10 bg-stone-800 text-xs font-bold">Sab atke tasks wapas pending</button>
                            <button onClick={() => cleanupTasks('clear', null)} className="h-10 px-4 rounded-xl border border-rose-500/40 bg-rose-500/15 text-rose-200 text-xs font-bold">Sab failed tasks delete</button>
                        </div>
                    </section>

                    {alerts.length > 0 && (
                        <section className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 space-y-1">
                            {alerts.map(a => <p key={a} className="text-xs text-rose-200 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> {a}</p>)}
                        </section>
                    )}

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-4">
                        <h2 className="text-sm font-extrabold">Worker settings</h2>
                        <p className="text-[11px] text-stone-400">Ye sab workers par ek saath lagti hain. Har worker ki apni limit Workers screen se badlein.</p>
                        {!cfg ? <p className="text-xs text-stone-500">Load ho raha hai...</p> : (
                            <div className="grid gap-4 md:grid-cols-3">
                                {[['max_attempts', 'Kitni baar koshish (1-5)', 1, 5], ['retry_delay_sec', 'Retry se pehle wait (sec, 0-3600)', 0, 3600], ['task_timeout_sec', 'Task ki max time (sec, 60-3600)', 60, 3600], ['alert_queue_size', 'Queue alert kab (pending tasks)', 1, 100000], ['user_daily_task_limit', 'Customer ka din ka limit (0 = koi nahi)', 0, 100000], ['daily_gemini_budget', 'Din ka Gemini budget (0 = unlimited)', 0, 10000000], ['match_threshold', 'Chehra match kam se kam (0-100)', 0, 100], ['match_retries', 'Chehra kam mile to dobara (0-5)', 0, 5], ['stale_min', 'Atki task kitne minute baad dobara (1-240)', 1, 240], ['fallback_sec', 'Pending check kitne sec mein (10-600)', 10, 600], ['heartbeat_sec', 'Heartbeat kitne sec mein (5-120)', 5, 120], ['image_max_side', 'Photo ka max size px (512-4096)', 512, 4096], ['image_quality', 'Photo quality (0.5-1, jaise 0.85)', 0.5, 1]].map(([key, label, min, max]) => (
                                    <label key={key} className="block text-[11px] text-stone-300 space-y-1">{label}
                                        <input type="number" min={min} max={max} value={cfg[key]} onChange={e => setCfg({ ...cfg, [key]: Math.min(max, Math.max(min, Number(e.target.value) || min)) })} className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    </label>
                                ))}
                                <div className="space-y-2 md:col-span-3">
                                    <label className="flex items-center gap-2 text-xs text-stone-200"><input type="checkbox" checked={cfg.maintenance_on} onChange={e => setCfg({ ...cfg, maintenance_on: e.target.checked })} /> Maintenance mode (customers ko message dikhega, naya kaam nahi banega)</label>
                                    <input value={cfg.maintenance_message} onChange={e => setCfg({ ...cfg, maintenance_message: e.target.value })} placeholder="Maintenance message" className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                                </div>
                            </div>
                        )}
                        <button onClick={saveConfig} disabled={!cfg} className="h-10 px-5 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black disabled:opacity-40">Settings save karo</button>
                    </section>

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                        <h2 className="text-sm font-extrabold">Model on / off</h2>
                        <div className="flex flex-wrap gap-3">
                            {models.map(m => (
                                <label key={m.model_id} className="flex items-center gap-2 text-xs bg-stone-950 border border-white/10 rounded-xl px-3 py-2"><input type="checkbox" checked={m.enabled} onChange={() => toggleModel(m.model_id, !m.enabled)} /> <span className="font-mono">{m.model_id}</span></label>
                            ))}
                        </div>
                        <h2 className="text-sm font-extrabold pt-2">Image model ki settings (size aur aspect ratio)</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {models.filter(m => m.kind === 'image').map(m => (
                                <div key={m.model_id} className="bg-stone-950 border border-white/10 rounded-xl p-3 space-y-2">
                                    <p className="font-mono text-[11px] text-stone-200">{m.model_id}</p>
                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-300">
                                        <span className="text-stone-400 w-14">Size:</span>
                                        {IMAGE_SIZES.map(s => (
                                            <label key={s} className="flex items-center gap-1"><input type="checkbox" checked={(m.sizes || []).includes(s)} onChange={e => toggleModelOption(m.model_id, 'sizes', s, e.target.checked)} /> {s}</label>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-300">
                                        <span className="text-stone-400 w-14">Aspect:</span>
                                        {IMAGE_ASPECTS.map(a => (
                                            <label key={a} className="flex items-center gap-1"><input type="checkbox" checked={(m.aspects || []).includes(a)} onChange={e => toggleModelOption(m.model_id, 'aspects', a, e.target.checked)} /> {a}</label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm font-extrabold">Task prompts (database se, workers yahin se lete hain)</h2>
                            {promptSaved && <span className="text-[11px] text-emerald-300">{promptSaved}</span>}
                        </div>
                        <select value={promptType} onChange={e => { setPromptType(e.target.value); setPromptSaved(''); }} className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs">
                            {Object.keys(TASK_TYPES).filter(k => typeOf(k).output === 'image').map(k => <option key={k} value={k}>{typeOf(k).label}</option>)}
                        </select>
                        {!prompts[promptType] ? (
                            <p className="text-xs text-rose-300">Is kaam ka prompt table mein nahi hai. SQL file ai_studio_prompts.sql run karo.</p>
                        ) : (
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs text-stone-200"><input type="checkbox" checked={prompts[promptType].enabled} onChange={e => setPromptField('enabled', e.target.checked)} /> Ye kaam chalu hai (band ho to ye type ke tasks nahi chalenge)</label>
                                <p className="text-[11px] text-stone-400">System text (main instruction, sabse upar)</p>
                                <textarea rows={3} value={prompts[promptType].system_text} onChange={e => setPromptField('system_text', e.target.value)} className="w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs" />
                                <p className="text-[11px] text-stone-400">IMAGE 1 / IMAGE 2 rules (khali ho sakta hai)</p>
                                <textarea rows={4} value={prompts[promptType].role_text} onChange={e => setPromptField('role_text', e.target.value)} className="w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs" />
                                <p className="text-[11px] text-stone-400">Negative constraints (kya nahi aana chahiye, khali ho sakta hai)</p>
                                <textarea rows={4} value={prompts[promptType].negative_text ?? ''} onChange={e => setPromptField('negative_text', e.target.value)} className="w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs" />
                                <button onClick={savePrompt} className="h-10 px-5 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black">Prompt save karo</button>
                            </div>
                        )}
                    </section>

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                        <h2 className="text-sm font-extrabold">Admin action log (last 30)</h2>
                        <div className="max-h-64 overflow-auto space-y-1 font-mono text-[11px] text-stone-300">
                            {logRows.map(r => <p key={r.id}><span className="text-stone-500">{new Date(r.at).toLocaleString()}</span> {r.action}{r.target ? ' · ' + r.target : ''}</p>)}
                            {logRows.length === 0 && <p className="text-stone-500">Abhi koi action nahi.</p>}
                        </div>
                    </section>

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm font-extrabold">Worker settings (sab workers par lagti hain)</h2>
                            {cfgSaved && <span className="text-[11px] text-emerald-300">{cfgSaved}</span>}
                        </div>
                        {!cfg ? <p className="text-xs text-stone-500">Load ho raha hai...</p> : (
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-stone-200">Upload</p>
                                    <label className="flex items-center gap-2 text-xs text-stone-200"><input type="checkbox" checked={cfg.cloudinary_enabled} onChange={e => setCfg({ ...cfg, cloudinary_enabled: e.target.checked })} /> Cloudinary par upload</label>
                                    <input value={cfg.cloudinary_cloud_name} onChange={e => setCfg({ ...cfg, cloudinary_cloud_name: e.target.value })} placeholder="Cloudinary cloud name" className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    <input value={cfg.cloudinary_upload_preset} onChange={e => setCfg({ ...cfg, cloudinary_upload_preset: e.target.value })} placeholder="Cloudinary upload preset (unsigned)" className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    <label className="flex items-center gap-2 text-xs text-stone-200"><input type="checkbox" checked={cfg.imgbb_enabled} onChange={e => setCfg({ ...cfg, imgbb_enabled: e.target.checked })} /> ImgBB par upload</label>
                                    <input type="password" value={cfg.imgbb_api_key} onChange={e => setCfg({ ...cfg, imgbb_api_key: e.target.value })} placeholder="ImgBB API key" className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-stone-200">Limits</p>
                                    {[['task_concurrency', 'Ek worker mein ek saath tasks (1-50)', 1, 50], ['gemini_concurrency', 'Ek worker mein ek saath model calls (1-16)', 1, 16], ['photos_per_task_max', 'Ek task mein photos ki upper limit (1-10)', 1, 10]].map(([key, label, min, max]) => (
                                        <label key={key} className="block text-[11px] text-stone-300 space-y-1">{label}
                                            <input type="number" min={min} max={max} value={cfg[key]} onChange={e => setCfg({ ...cfg, [key]: Math.min(max, Math.max(min, Number(e.target.value) || min)) })} className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button onClick={saveConfig} disabled={!cfg} className="h-10 px-5 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black disabled:opacity-40">Settings save karo</button>
                    </section>

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-4">
                        <h2 className="text-sm font-extrabold">Email alerts (Brevo)</h2>
                        <p className="text-[11px] text-stone-400">Alert tab jaata hai jab sab workers offline hon, queue bhari ho ya koi worker khud pause ho. Database har minute check karta hai, isliye browser band ho tab bhi mail jaata hai.</p>
                        {!cfg ? <p className="text-xs text-stone-500">Load ho raha hai...</p> : (
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs text-stone-200"><input type="checkbox" checked={cfg.alert_email_enabled} onChange={e => setCfg({ ...cfg, alert_email_enabled: e.target.checked })} /> Email alerts chalu</label>
                                    <input value={cfg.alert_admin_email} onChange={e => setCfg({ ...cfg, alert_admin_email: e.target.value })} placeholder="Admin email (mail yahan jaayega)" className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    <input value={cfg.alert_sender_email} onChange={e => setCfg({ ...cfg, alert_sender_email: e.target.value })} placeholder="Sender email (Brevo mein verified)" className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    <input value={cfg.alert_sender_name} onChange={e => setCfg({ ...cfg, alert_sender_name: e.target.value })} placeholder="Sender name" className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                                </div>
                                <div className="space-y-3">
                                    <input type="password" value={cfg.brevo_api_key} onChange={e => setCfg({ ...cfg, brevo_api_key: e.target.value })} placeholder="Brevo API key (v3)" className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    <label className="block text-[11px] text-stone-300 space-y-1">Same alert ek baar kitne minute baad dobara jaaye (1-1440)
                                        <input type="number" min={1} max={1440} value={cfg.alert_cooldown_min} onChange={e => setCfg({ ...cfg, alert_cooldown_min: Math.min(1440, Math.max(1, Number(e.target.value) || 1)) })} className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    </label>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <button onClick={saveConfig} disabled={!cfg} className="h-10 px-5 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black disabled:opacity-40">Email settings save karo</button>
                            <button onClick={sendTestMail} disabled={!cfg} className="h-10 px-5 border border-white/10 bg-stone-800 rounded-xl text-xs font-bold disabled:opacity-40">Test mail bhejo</button>
                        </div>
                    </section>

                    <section className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                        {[['Live workers', liveWorkers.length], ['Chal rahe tasks', workers.reduce((s, w) => s + (w.processing || 0), 0)], ['Done (total)', workers.reduce((s, w) => s + (w.done || 0), 0)], ['Har worker ka limit', fairLimit]].map(([label, value]) => (
                            <div key={label} className="bg-stone-900 border border-white/10 rounded-2xl p-4">
                                <p className="text-[11px] text-stone-400">{label}</p>
                                <p className="text-2xl font-extrabold font-mono">{value}</p>
                            </div>
                        ))}
                    </section>

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm font-extrabold flex items-center gap-2"><Users className="w-4 h-4 text-yellow-300" /> Workers</h2>
                            <div className="flex gap-2">
                                <button onClick={() => togglePause('all', true)} className="h-9 px-3 rounded-xl border border-white/10 bg-stone-800 text-xs font-bold flex items-center gap-1.5"><Pause className="w-3.5 h-3.5" /> Sab pause</button>
                                <button onClick={() => togglePause('all', false)} className="h-9 px-3 rounded-xl border border-white/10 bg-stone-800 text-xs font-bold flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Sab resume</button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {[['active', `Active (${activeCount})`], ['offline', `Offline (${workers.length - activeCount})`], ['all', `Sab (${workers.length})`]].map(([key, label]) => (
                                <button key={key} type="button" onClick={() => setWorkerView(key)} className={`h-8 px-3 rounded-lg text-xs font-bold border ${workerView === key ? 'bg-yellow-400 text-stone-950 border-yellow-300' : 'bg-stone-950 border-white/10 text-stone-300'}`}>{label}</button>
                            ))}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="text-stone-400 text-left">
                                    <tr><th className="py-2">Worker</th><th>Status</th><th>Chal rahe</th><th>Done</th><th>Last seen</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {workers.filter(w => workerView === 'all' || (workerView === 'active') === isAlive(w)).map(w => {
                                        const alive = isAlive(w);
                                        return (
                                            <tr key={w.worker_id} className="border-t border-white/5">
                                                <td className="py-2 font-mono font-bold text-yellow-300">{w.worker_id}</td>
                                                <td>
                                                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${!alive ? 'bg-stone-800 border-white/10 text-stone-400' : w.paused ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                                                        {!alive ? 'Offline' : w.paused ? 'Paused' : 'Live'}
                                                    </span>
                                                </td>
                                                <td className="font-mono">{w.processing}</td>
                                                <td className="font-mono">{w.done}</td>
                                                <td className="font-mono text-stone-400">{new Date(w.last_seen).toLocaleTimeString()}</td>
                                                <td className="text-right">
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        <input type="number" min={1} max={50} defaultValue={w.task_limit ?? ''} placeholder="Limit" onBlur={e => setTaskLimit(w.worker_id, e.target.value)} className="h-8 w-20 bg-stone-950 border border-white/10 rounded-lg px-2 text-[11px] font-mono" />
                                                        <button onClick={() => toggleDrain(w.worker_id, !w.drain)} className={`h-8 px-3 rounded-lg border font-bold ${w.drain ? 'bg-sky-500/15 border-sky-500/40 text-sky-200' : 'border-white/10 bg-stone-800'}`}>{w.drain ? 'Drain band' : 'Drain'}</button>
                                                        <button onClick={() => togglePause(w.worker_id, !w.paused)} className="h-8 px-3 rounded-lg border border-white/10 bg-stone-800 font-bold">{w.paused ? 'Resume' : 'Pause'}</button>
                                                        <button onClick={() => cleanupTasks('release', w.worker_id)} className="h-8 px-3 rounded-lg border border-white/10 bg-stone-800 text-[11px] font-bold">Atke tasks wapas</button>
                                                        <button onClick={() => cleanupTasks('clear', w.worker_id)} className="h-8 px-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-200 text-[11px] font-bold">Failed hatao</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {workers.length === 0 && <p className="text-center text-xs text-stone-500 py-6">Abhi koi worker nahi.</p>}
                        </div>
                    </section>

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm font-extrabold flex items-center gap-2"><List className="w-4 h-4 text-yellow-300" /> Tasks</h2>
                            <div className="flex flex-wrap gap-2 text-xs">
                                {['all', 'pending', 'processing', 'done', 'failed'].map(s => (
                                    <button key={s} onClick={() => setTaskFilter(s)} className={`h-8 px-3 rounded-lg font-bold border ${taskFilter === s ? 'bg-yellow-400 text-stone-950 border-yellow-300' : 'bg-stone-800 border-white/10 text-stone-300'}`}>{s}</button>
                                ))}
                                <button onClick={loadTasks} className="h-8 px-3 rounded-lg border border-white/10 bg-stone-800 text-stone-300"><RefreshCw className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {tasks.map(t => (
                                <div key={t.id} className="flex flex-wrap items-center gap-2 bg-stone-950 border border-white/5 rounded-xl px-3 py-2 text-xs">
                                    <span className="font-mono text-yellow-300">#{t.id}</span>
                                    <span className="text-stone-300">{typeOf(t.task_type)?.label || t.task_type}</span>
                                    <span className="font-mono text-[10px] text-stone-500">{t.model}</span>
                                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${STATUS_STYLE[t.status] || STATUS_STYLE.pending}`}>{t.status}</span>
                                    <span className="font-mono text-[10px] text-stone-400">{t.worker_id || '—'}</span>
                                    <span className="text-[10px] text-stone-500 truncate max-w-[30ch]">{t.prompt}</span>
                                    {t.error && <span className="text-[10px] text-rose-300 truncate max-w-[30ch]">{t.error}</span>}
                                    <button onClick={() => setPriority(t.id, (t.priority || 0) > 0 ? 0 : 10)} className="h-7 px-2 rounded-lg border border-white/10 bg-stone-800 text-[10px] font-bold">{(t.priority || 0) > 0 ? 'Priority ✓' : 'Priority'}</button>
                                    <button onClick={() => deleteTask(t.id)} className="ml-auto h-7 w-7 flex items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                            {tasks.length === 0 && <p className="text-center text-xs text-stone-500 py-6">Is filter mein koi task nahi.</p>}
                        </div>
                    </section>
                </div>
            )}

            {screen === 'tools' && (
                <div className="space-y-5">
                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                        <h2 className="text-sm font-extrabold">Tools (chat, image aur aage aur bhi: har tool ke alag workers)</h2>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {tools.map(t => (
                                <div key={t.tool} className="bg-stone-950 border border-white/10 rounded-xl p-3 space-y-2">
                                    <p className="text-xs font-bold text-stone-100">{t.label} <span className="font-mono text-stone-500">({t.tool})</span></p>
                                    <p className="text-[11px] text-stone-300">Pending tasks: {pendingByTool[t.tool] || 0} · Workers: {workerTools.filter(w => (w.tools || []).includes(t.tool)).length}</p>
                                    <label className="flex items-center gap-2 text-xs text-stone-200"><input type="checkbox" checked={t.enabled} onChange={e => toggleTool(t.tool, e.target.checked)} /> Chalu hai (band hone par is tool ke naye tasks nahi banenge)</label>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <input value={newToolKey} onChange={e => setNewToolKey(e.target.value.toLowerCase())} placeholder="Naya tool key (jaise video)" className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                            <input value={newToolLabel} onChange={e => setNewToolLabel(e.target.value)} placeholder="Label (jaise Video tool)" className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                            <button onClick={addTool} className="h-10 px-5 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black">Tool banao</button>
                        </div>
                    </section>

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                        <h2 className="text-sm font-extrabold">Worker aur unke tools (worker sirf chune hue tools ka kaam lega)</h2>
                        {workerTools.length === 0 && <p className="text-xs text-stone-500">Abhi koi worker nahi.</p>}
                        <div className="space-y-2">
                            {workerTools.map(w => (
                                <div key={w.worker_id} className="flex flex-wrap items-center gap-4 bg-stone-950 border border-white/10 rounded-xl p-3">
                                    <span className="font-mono text-xs font-bold w-24">{w.worker_id}</span>
                                    {tools.map(t => (
                                        <label key={t.tool} className="flex items-center gap-1.5 text-xs text-stone-200">
                                            <input type="checkbox" checked={(w.tools || []).includes(t.tool)} onChange={e => toggleWorkerTool(w.worker_id, t.tool, e.target.checked)} /> {t.label}
                                        </label>
                                    ))}
                                    <label className="flex items-center gap-1.5 text-xs text-stone-200 border-l border-white/10 pl-4">
                                        <input type="checkbox" checked={w.task_types === null} onChange={e => toggleWorkerAll(w, e.target.checked)} /> Sab kaam
                                    </label>
                                    {w.task_types !== null && (
                                        <div className="w-full flex flex-wrap gap-x-4 gap-y-2 pt-2">
                                            {catalog.filter(c => c.enabled).map(c => (
                                                <label key={c.task_type} className="flex items-center gap-1.5 text-[11px] text-stone-300">
                                                    <input type="checkbox" checked={(w.task_types || []).includes(c.task_type)} onChange={e => toggleWorkerTaskType(w, c.task_type, e.target.checked)} /> {c.label}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                        <h2 className="text-sm font-extrabold">Kaam (task types): chalu hain ya nahi, customer ko dikhein ya nahi</h2>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {catalog.map(c => <CatalogRow key={c.task_type} row={c} apps={apps} appTasks={appTasks} onToggleApp={toggleAppTask} onToggle={toggleCatalog} onSave={saveCatalogRow} />)}
                        </div>
                    </section>

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                        <h2 className="text-sm font-extrabold">Parivar ke roles (family photo ke slots, is order mein)</h2>
                        <p className="text-[11px] text-stone-400">Chalu roles hi slots banate hain. Order ke liye sort order se naya role neeche jayega. Jo task pehle ban chuka, wo apne purane roles se chalega.</p>
                        <div className="space-y-2">
                            {familyRoles.map(r => (
                                <div key={r.role_key} className="flex flex-wrap items-center gap-4 bg-stone-950 border border-white/10 rounded-xl p-2">
                                    <span className="font-mono text-[11px] text-stone-400 w-28">{r.role_key}</span>
                                    <span className="text-xs text-stone-200">{r.label_admin}</span>
                                    <label className="flex items-center gap-1.5 text-xs text-stone-200"><input type="checkbox" checked={r.enabled} onChange={e => toggleFamilyRole(r.role_key, e.target.checked)} /> Chalu</label>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <input value={newRole.role_key} onChange={e => setNewRole({ ...newRole, role_key: e.target.value.toLowerCase() })} placeholder="role key (jaise chacha)" className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                            <input value={newRole.label_admin} onChange={e => setNewRole({ ...newRole, label_admin: e.target.value })} placeholder="Admin label" className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                            <input value={newRole.label_customer} onChange={e => setNewRole({ ...newRole, label_customer: e.target.value })} placeholder="Customer label (khali = admin label)" className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                            <input value={newRole.prompt_text} onChange={e => setNewRole({ ...newRole, prompt_text: e.target.value })} placeholder="Prompt text (english, jaise uncle)" className="h-10 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs" />
                            <button onClick={() => {
                                if (!newRole.role_key || !newRole.label_admin) return setMsg('Role key aur admin label dono daalo');
                                addFamilyRole({
                                    role_key: newRole.role_key,
                                    label_admin: newRole.label_admin,
                                    label_customer: newRole.label_customer || newRole.label_admin,
                                    prompt_text: newRole.prompt_text || newRole.role_key,
                                    sort_order: Math.max(0, ...familyRoles.map(r => r.sort_order)) + 10
                                });
                            }} className="h-10 px-5 bg-yellow-400 text-stone-950 rounded-xl text-xs font-black">Role banao</button>
                        </div>
                    </section>

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                        <h2 className="text-sm font-extrabold">Task type kis tool mein jayega</h2>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {toolTypes.map(r => (
                                <div key={r.task_type} className="flex items-center justify-between gap-2 bg-stone-950 border border-white/10 rounded-xl p-2">
                                    <span className="font-mono text-[11px] text-stone-300">{r.task_type}</span>
                                    <select value={r.tool} onChange={e => setTaskTool(r.task_type, e.target.value)} className="h-8 bg-stone-900 border border-white/10 rounded-lg px-2 text-xs">
                                        {tools.map(t => <option key={t.tool} value={t.tool}>{t.label}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {screen === 'features' && (
                <div className="space-y-5">
                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                        <h2 className="text-sm font-extrabold">Platform features (system mein kya kya hai)</h2>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {PLATFORM_FEATURES.map(f => (
                                <div key={f.title} className="bg-stone-950 border border-white/10 rounded-xl p-3">
                                    <p className="text-xs font-bold text-stone-100">{f.title}</p>
                                    <p className="text-[11px] text-stone-400">{f.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                        <h2 className="text-sm font-extrabold">Task types (kaam ke prakar)</h2>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {Object.entries(TASK_TYPES).map(([k, t]) => {
                                const pr = prompts[k];
                                return (
                                    <div key={k} className="bg-stone-950 border border-white/10 rounded-xl p-3 space-y-1">
                                        <p className="text-xs font-bold text-stone-100">{t.label}</p>
                                        <p className="font-mono text-[10px] text-stone-500">{k}</p>
                                        <p className="text-[11px] text-stone-300">Input: {t.family ? 'parivar ki 6 slots (kam se kam 2 photos)' : t.inputs.length ?t.inputs.map(key => labelFor(t, key) + (t.optional?.includes(key) ? ' (optional)' : '')).join(' + ') : 'sirf text'}</p>
                                        <p className="text-[11px] text-stone-300">
                                            Prompt: {t.output === 'text' ? 'user ka apna text' : !pr ? <span className="text-rose-300">DB mein nahi</span> : pr.enabled ? <span className="text-emerald-300">chalu (v{pr.prompt_version})</span> : <span className="text-rose-300">band</span>}
                                        </p>
                                        <p className="text-[11px] text-stone-300">
                                            Face check: {t.faceCheck ? 'haan' : 'nahi'} · Brush mask: {t.edit ? 'haan' : 'nahi'} · Customer app mein: {CUSTOMER_KINDS.includes(k) ? 'haan' : 'nahi'}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

// Loads the Supabase client (CDN) with the anon key
let supabaseLoading = null;
function loadSupabaseClient(anonKey) {
    if (!window.supabase) {
        if (!supabaseLoading) {
            supabaseLoading = new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                s.onload = () => resolve();
                s.onerror = () => reject(new Error('Supabase script load failed'));
                document.head.appendChild(s);
            });
        }
        return supabaseLoading.then(() => window.supabase.createClient(SUPABASE_URL, anonKey));
    }
    return Promise.resolve(window.supabase.createClient(SUPABASE_URL, anonKey));
}
