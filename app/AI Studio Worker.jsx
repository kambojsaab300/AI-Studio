import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2, Cpu, Image as ImageIcon } from 'lucide-react';

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
// AI STUDIO WORKER: picks tasks, calls the model, uploads photos (ImgBB + Cloudinary), saves the result.
// Limits come from the ai_studio_settings table, so they can be changed while the worker runs.
// Powered by .NET Core Web API & Microsoft SQL Server
// ============================================================

// ── Config ──
const API_URL = "https://aistudio.runasp.net";
// Realtime (instant updates). The blob: preview (Canvas) does not allow WebSockets, so there the timers do the work.
const USE_REALTIME = location.protocol !== 'blob:';
// Publishable key: safe in the app code (row security protects the data)
const API_KEY = "aistudio_worker_local_key";

// Repeats fn. The delay is read again after every run, so a new value from the database is used at once.
function everyMs(fn, delayOf) {
    let t;
    const tick = () => { fn(); t = setTimeout(tick, delayOf()); };
    t = setTimeout(tick, delayOf());
    return () => clearTimeout(t);
}

// Gemini key: read from this browser only (localStorage "gemini_api_key", same as weargen automatic).
// Strict check: it must look like AIza followed by at least 30 letters, digits, _ or -.
const GEMINI_KEY_STORAGE = 'gemini_api_key';
const GEMINI_API_KEY = "";   // provided by the Canvas environment (as in the sample code)
const validGeminiKey = (k) => /^AIza[0-9A-Za-z_-]{30,}$/.test((k || '').trim());

// Engine values from the database (get_worker_config). The numbers here are only the starting values,
// used until the first config arrives.
let RUNTIME = {
    match_model: 'gemini-3-flash-preview',
    match_threshold: 70,          // face score below this -> generate again
    match_retries: 2,
    gemini_base: 'https://generativelanguage.googleapis.com/v1beta/models',
    imgbb_upload_url: 'https://api.imgbb.com/1/upload',
    stale_ms: 10 * 60 * 1000,     // a stuck task older than this can be picked again
    heartbeat_ms: 5000,           // "I am alive" every 5 s (and reads the paused flag)
    fallback_ms: 2000,            // polls & fetches new tasks from DB every 2 s!
    image_max_side: 2048,
    image_quality: 0.85,
    model_caps: {}                // filled from ai_studio_models (kind, label, aspects, sizes)
};
function applyRuntime(d) {
    RUNTIME = {
        match_model: d.match_model || RUNTIME.match_model,
        match_threshold: d.match_threshold ?? RUNTIME.match_threshold,
        match_retries: d.match_retries ?? RUNTIME.match_retries,
        gemini_base: d.gemini_base || RUNTIME.gemini_base,
        imgbb_upload_url: d.imgbb_upload_url || RUNTIME.imgbb_upload_url,
        stale_ms: (d.stale_min ?? 10) * 60 * 1000,
        heartbeat_ms: (d.heartbeat_sec ?? 5) * 1000,
        fallback_ms: (d.fallback_sec ?? 2) * 1000,
        image_max_side: d.image_max_side ?? RUNTIME.image_max_side,
        image_quality: d.image_quality ?? RUNTIME.image_quality,
        model_caps: d.model_caps || RUNTIME.model_caps
    };
}

// Used until the settings table is read. Same values as the table defaults.
const DEFAULT_SETTINGS = { task_concurrency: 20, gemini_concurrency: 8, photos_per_task_max: 50, max_attempts: 2, retry_delay_sec: 30, task_timeout_sec: 300, budget_left: null, disabled_models: [], cloudinary_enabled: true, cloudinary_cloud_name: 'draaqjcre', cloudinary_upload_preset: 'ml_default', imgbb_enabled: false, imgbb_api_key: '', worker_recycle_after_tasks: 50 };

// ── API: every call the app makes, named in one place ──
// Database functions (sb.rpc)
const API = {
    REGISTER_WORKER: 'register_ai_studio_worker',  // GET a worker id: worker_1, worker_2 ...
    HEARTBEAT: 'worker_heartbeat',                 // "I am alive". Returns paused (true / false)
    RELEASE_WORKER: 'worker_release',              // tab closing: give my tasks back
    GET_PENDING: 'get_pending_for_worker',         // GET the tasks that are ready to run for this worker's tools
    CLAIM_TASK: 'claim_ai_studio_task',            // take ONE task (only one worker gets it)
    SAVE_RESULT: 'worker_complete_task',           // UPLOAD my result (or failure) for my task
    GET_CONFIG: 'get_worker_config',               // GET limits, upload settings and keys
    GET_PROMPTS: 'get_task_prompts',               // GET the task prompts (from the ai_studio_prompts table)
    GET_CATALOG: 'get_task_catalog',               // GET the task types: names, photo slots, rules (from ai_studio_task_catalog)
    GET_FAMILY_ROLES: 'get_family_roles',          // GET the family photo roles, in order (from ai_studio_family_roles)
    AUTO_PAUSE: 'worker_auto_pause',               // pause myself (too many failures, bad key)
    TAKE_BUDGET: 'worker_budget_take'              // use one Gemini call from today's budget
};

// Database tables (sb.from)
const TABLES = {
    TASKS: 'ai_studio_tasks',                      // GET my tasks
    WORKERS: 'ai_studio_workers',                  // realtime: is my pause flag changed?
    SETTINGS: 'ai_studio_settings',                // GET the limits (one row)
    PROMPTS: 'ai_studio_prompts',                  // realtime: prompt changed
    CATALOG: 'ai_studio_task_catalog',             // realtime: task type changed
    FAMILY_ROLES: 'ai_studio_family_roles',        // realtime: family role changed
    MODELS: 'ai_studio_models'                     // realtime: model changed
};

// External services

// ── Models and task types (the same list the admin app uses) ──

// inputs: which reference images the task takes. optional: inputs that may be left out.
// labels: names of the inputs for this type. extras: more photos allowed. promptRequired: prompt must be filled.
// faceCheck: compare the face in the result with IMAGE 1. The instruction text comes from the database (ai_studio_prompts).
// The task types come from the database (ai_studio_task_catalog). loadSettings() fills this.
const TASK_TYPES = {};
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
        family: !!r.family,
        perPhoto: !!r.per_photo
    };
}
function setTaskTypes(rows) {
    Object.keys(TASK_TYPES).forEach(k => delete TASK_TYPES[k]);
    (rows || []).forEach(r => { TASK_TYPES[r.task_type] = toTaskType(r); });
}
const INPUT_LABEL = { face: 'Face reference', style: 'Style / outfit reference', input: 'Input photo' };
const INPUT_COLUMN = { face: 'face_image_url', style: 'style_image_url', input: 'input_image_url' };
// Name of an input for this task type (person and product tasks name them differently)
const labelFor = (type, key) => type.labels?.[key] || INPUT_LABEL[key];


const STATUS_STYLE = {
    pending: 'text-stone-300 bg-stone-800 border-white/10',
    processing: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
    done: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    failed: 'text-rose-300 bg-rose-500/10 border-rose-500/30'
};

// ── Helpers ──
const loadApiClient = () => Promise.resolve({ createClient });

// Limiter: runs at most `max` jobs at once. `max` can be a number or a function, so a settings change applies.
const createLimiter = (max) => {
    let active = 0;
    const queue = [];
    const cap = () => (typeof max === 'function' ? max() : max);
    const pump = () => {
        while (active < cap() && queue.length > 0) {
            active++;
            const { task, resolve, reject } = queue.shift();
            task().then(resolve, reject).finally(() => { active--; pump(); });
        }
    };
    const limiter = (task) => new Promise((resolve, reject) => { queue.push({ task, resolve, reject }); pump(); });
    limiter.pump = pump;
    return limiter;
};

// Image URL -> base64 (no prefix)
// Photos already downloaded (URL -> base64). Keeps the last 60, so the same photo is not downloaded again.
const inputCache = new Map();

// Task-specific cache cleaner: deletes input, face, style and extra images from memory
function cleanTaskCache(task) {
    if (!task) return;
    const urls = [
        task.input_image_url,
        task.face_image_url,
        task.style_image_url,
        ...(task.extra_image_urls || [])
    ].filter(Boolean);
    for (const u of urls) {
        inputCache.delete(u);
    }
}

// Complete memory purge: clears all cached images and triggers browser GC if exposed
function purgeAllMemory() {
    inputCache.clear();
    if (typeof window !== 'undefined' && window.gc) {
        try { window.gc(); } catch {}
    }
}

// Live memory usage reader (JS Heap in MB)
function getMemoryStats() {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
        const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = window.performance.memory;
        return {
            usedMB: Math.round(usedJSHeapSize / (1024 * 1024)),
            totalMB: Math.round(totalJSHeapSize / (1024 * 1024)),
            limitMB: Math.round(jsHeapSizeLimit / (1024 * 1024)),
            supported: true
        };
    }
    return {
        usedMB: 0,
        totalMB: 0,
        limitMB: 0,
        cacheCount: inputCache.size,
        supported: false
    };
}
async function urlToBase64(url) {
    if (!url) return '';
    if (inputCache.has(url)) return inputCache.get(url);
    if (typeof url === 'string' && url.startsWith('data:')) {
        const parts = url.split(',');
        const b64 = parts[1] || parts[0];
        inputCache.set(url, b64);
        return b64;
    }
    const blob = await (await fetch(url)).blob();
    const b64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(blob);
    });
    inputCache.set(url, b64);
    if (inputCache.size > 20) inputCache.delete(inputCache.keys().next().value);
    return b64;
}

// Generated image (data URL) -> Cloudinary link. Cloud name and preset come from the admin settings.
async function uploadDataUrlToCloudinary(dataUrl, cfg) {
    const fd = new FormData();
    fd.append('file', dataUrl);
    fd.append('upload_preset', cfg.cloudinary_upload_preset);
    const url = `https://api.cloudinary.com/v1_1/${cfg.cloudinary_cloud_name}/image/upload`;
    const data = await (await fetch(url, { method: 'POST', body: fd })).json();
    if (!data.secure_url) throw new Error(data.error?.message || 'Cloudinary upload failed');
    return data.secure_url;
}

// Generated image (data URL) -> ImgBB link. Needs the ImgBB key typed in the app.
async function uploadToImgbb(dataUrl, key) {
    if (!key) throw new Error('ImgBB key nahi di');
    const fd = new FormData();
    fd.append('key', key);
    fd.append('image', dataUrl.split(',')[1]);
    const data = await (await fetch(RUNTIME.imgbb_upload_url, { method: 'POST', body: fd })).json();
    if (!data.success) throw new Error(data.error?.message || 'ImgBB upload failed');
    return data.data.url;
}

// Family photo roles come from the database (ai_studio_family_roles). loadSettings() fills this.
let FAMILY_ROLES = [];   // [{ role_key, prompt_text }] in order
// The order line for a family task: the role keys the task was made with, for the photos that are there
function familyOrderText(task) {
    const keys = task.family_role_keys || FAMILY_ROLES.map(r => r.role_key);
    const names = Object.fromEntries(FAMILY_ROLES.map(r => [r.role_key, r.prompt_text || r.role_key]));
    const present = keys.filter((_, i) => (task.extra_image_urls || [])[i]);
    return `Photo order: ${present.map((k, i) => `IMAGE ${i + 1} = ${names[k] || k}`).join(', ')}.`;
}

// The instruction text for a task. Image types take their text from the database row (p, from ai_studio_prompts).
// The admin preview uses this same function.
function instructionFor(task, p) {
    const userPrompt = (task.prompt || '').trim();
    if (task.task_type === 'chat') return userPrompt;
    if (task.task_type === 'photo_read') return userPrompt || 'Describe this photo in detail.';
    if (!p || !p.enabled) throw new Error(`Is kaam ka prompt DB mein nahi ya band hai: ${task.task_type}`);

    const parts = [
        task.system_text || p.system_text,
        p.role_text,
        userPrompt ? `Prompt: "${userPrompt}"` : '',
        p.negative_text ? `[NEGATIVE CONSTRAINTS]: ${p.negative_text}` : ''
    ];
    let text = parts.filter(Boolean).join('\n');
    if (task.task_type === 'family_photo') text += `\n${familyOrderText(task)}`;
    if (task.angle) text += `\nCamera angle for this photo: ${task.angle}.`;
    if (TASK_TYPES[task.task_type].output === 'image') text += `\nAspect ratio: ${task.aspect_ratio}.`;
    return text;
}

// ── Photo edit: only the masked area comes from the model, everything else is the original pixels ──
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image load nahi hui'));
        img.src = src;
    });
}

// photoB64 / maskB64: raw base64 (no prefix). generatedDataUrl: the model result.
// Mask: white-red area = take the model result, black = keep the original photo pixel for pixel.
async function compositeEdit(photoB64, maskB64, generatedDataUrl) {
    const [photo, mask, gen] = await Promise.all([
        loadImage(`data:image/jpeg;base64,${photoB64}`),
        loadImage(`data:image/jpeg;base64,${maskB64}`),
        loadImage(generatedDataUrl)
    ]);
    const w = photo.naturalWidth;
    const h = photo.naturalHeight;
    const pixelsOf = (img) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0, w, h);
        const data = x.getImageData(0, 0, w, h).data;
        c.width = 0;
        c.height = 0;
        img.src = '';
        return data;
    };
    const orig = pixelsOf(photo);
    const edited = pixelsOf(gen);
    const maskPx = pixelsOf(mask);

    const out = new ImageData(w, h);
    for (let i = 0; i < orig.length; i += 4) {
        const a = maskPx[i] / 255;          // red channel = how much of the model result to use
        for (let k = 0; k < 3; k++) out.data[i + k] = orig[i + k] * (1 - a) + edited[i + k] * a;
        out.data[i + 3] = 255;
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d').putImageData(out, 0, 0);
    const result = c.toDataURL('image/jpeg', 0.92);
    c.width = 0;
    c.height = 0;
    return result;
}

// ── Smaller pictures: at most 2048 px on the long side, saved as JPEG (safe to store, much less space) ──
async function shrinkDataUrl(dataUrl) {
    const img = await loadImage(dataUrl);
    const k = Math.min(1, RUNTIME.image_max_side / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const result = c.toDataURL('image/jpeg', RUNTIME.image_quality);
    c.width = 0;
    c.height = 0;
    img.src = '';
    return result;
}

// ── Transparent output: pure white becomes transparent, soft edges become partly see-through ──
async function knockoutWhite(dataUrl) {
    const img = await loadImage(dataUrl);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < px.data.length; i += 4) {
        const min = Math.min(px.data[i], px.data[i + 1], px.data[i + 2]);
        if (min >= 240) px.data[i + 3] = 0;
        else if (min >= 215) px.data[i + 3] = Math.round((240 - min) / 25 * 255);
    }
    ctx.putImageData(px, 0, 0);
    const result = c.toDataURL('image/png');
    c.width = 0;
    c.height = 0;
    img.src = '';
    return result;
}

// ── Model call: one function for every task type ──
// Returns { text } for text tasks, or { image: { dataUrl, mimeType } } for image tasks.
async function callAiStudio(task, inputs, apiKey, promptRow) {
    let type = TASK_TYPES[task.task_type];
    if (!type && sbRef.current) {
        await loadSettings(sbRef.current);
        type = TASK_TYPES[task.task_type];
    }
    if (!type) throw new Error(`Task type galat hai: ${task.task_type}`);
    const isImage = type.output === 'image';

    if (isImage) {
        const caps = RUNTIME.model_caps[task.model];
        if (!caps || caps.kind !== 'image') throw new Error(`Image model nahi hai: ${task.model}`);
        if (!caps.aspects.includes(task.aspect_ratio)) throw new Error(`${task.model} mein aspect ratio ${task.aspect_ratio} support nahi`);
        if (task.image_size && !caps.sizes.includes(task.image_size)) throw new Error(`${task.model} mein size ${task.image_size} support nahi`);
    }

    // Parts in a fixed order: text, face (IMAGE 1), style (IMAGE 2), input photo, then extra photos
    const parts = [{ text: instructionFor(task, promptRow) }];
    for (const key of ['face', 'style', 'input']) {
        if (inputs[key]) parts.push({ inlineData: { mimeType: 'image/jpeg', data: inputs[key] } });
    }
    for (const extra of inputs.extras || []) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: extra } });
    }

    // Chat: finished messages of the same conversation come first, so the model remembers them
    const contents = [
        ...(task.history || []).flatMap(h => [
            { role: 'user', parts: [{ text: h.prompt }] },
            { role: 'model', parts: [{ text: h.output_text }] }
        ]),
        { role: 'user', parts }
    ];
    const body = { contents };
    if (isImage) {
        body.generationConfig = {
            responseModalities: ['IMAGE'],
            imageConfig: { aspectRatio: task.aspect_ratio, ...(task.image_size ? { imageSize: task.image_size } : {}) }
        };
    }

    const url = `${RUNTIME.gemini_base}/${task.model}:generateContent?key=${apiKey}`;
    let data = null;
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            data = await res.json();
            if (!res.ok) {
                const err = new Error(data.error?.message || `HTTP ${res.status}`);
                if ([400, 401, 403, 404].includes(res.status)) err.retry = false;
                throw err;
            }
            break;
        } catch (err) {
            if (err.retry === false || attempt === 4) throw err;
            await new Promise(r => setTimeout(r, 1000 * 2 ** attempt));
        }
    }

    if (data.promptFeedback?.blockReason) throw new Error(`Prompt block hua: ${data.promptFeedback.blockReason}`);
    const cand = data.candidates?.[0];
    const finish = cand?.finishReason ? ` (finishReason: ${cand.finishReason})` : '';

    if (isImage) {
        const imgPart = cand?.content?.parts?.find(p => p.inlineData);
        if (!imgPart) throw new Error(`Image nahi aayi${finish}`);
        const mimeType = imgPart.inlineData.mimeType || 'image/png';
        return { image: { dataUrl: `data:${mimeType};base64,${imgPart.inlineData.data}`, mimeType } };
    }

    const text = (cand?.content?.parts || []).map(p => p.text || '').join('').trim();
    if (!text) throw new Error(`Text nahi aaya${finish}`);
    return { text };
}

// Face score: compares the reference face (IMAGE 1) with a generated photo (IMAGE 2). Returns 0-100, or null.
async function checkFaceMatch(faceB64, outputB64, apiKey) {
    const body = {
        contents: [{ role: 'user', parts: [
            { text: 'IMAGE 1 and IMAGE 2: are they the same person (same face)? Return only JSON: {"score": <0-100>}, where 100 = identical face.' },
            { inlineData: { mimeType: 'image/jpeg', data: faceB64 } },
            { inlineData: { mimeType: 'image/jpeg', data: outputB64 } }
        ] }],
        generationConfig: { responseMimeType: 'application/json' }
    };
    try {
        const res = await fetch(`${RUNTIME.gemini_base}/${RUNTIME.match_model}:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        const data = await res.json();
        const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
        const score = Number(JSON.parse(text).score);
        return Number.isFinite(score) ? score : null;
    } catch {
        return null;
    }
}

// Rejects if the task runs longer than `ms` (the task keeps running in the background, but the worker moves on)
const withTimeout = (promise, ms) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${ms / 1000} second se zyada chala`)), ms);
    promise.then(
        (value) => { clearTimeout(timer); resolve(value); },
        (err) => { clearTimeout(timer); reject(err); }
    );
});

export default function AiStudioWorker() {
    const [apiKey, setApiKey] = useState(API_KEY);
    const [customApiUrl, setCustomApiUrl] = useState(() => getEffectiveApiUrl(API_URL));
    // Reads the browser key (gemini_api_key). An older save under ai_studio_api_key is used too if it is the only one.
    const [aiStudioKey, setAiStudioKey] = useState(() => {
        const first = (localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim();
        if (validGeminiKey(first)) return first;
        return (localStorage.getItem('ai_studio_api_key') || '').trim();
    });
    const [keyDraft, setKeyDraft] = useState('');
    const [keyMsg, setKeyMsg] = useState('');

    // Save Configuration: the key goes to this browser (localStorage gemini_api_key), like weargen automatic
    const saveGeminiKey = () => {
        const k = keyDraft.trim();
        if (!validGeminiKey(k)) return setKeyMsg('Key galat hai. AIza se shuru honi chahiye.');
        localStorage.setItem(GEMINI_KEY_STORAGE, k);
        setAiStudioKey(k);
        setKeyDraft('');
        setKeyMsg('');
    };
    const [sb, setSb] = useState(null);
    const [workerId, setWorkerId] = useState('');
    const [paused, setPaused] = useState(false);
    const [drain, setDrain] = useState(false);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [myTasks, setMyTasks] = useState([]);
    const [logs, setLogs] = useState([]);
    const MAX_LOGS = 30; // 30 records hone par pura log automatic clear/reset ho jayega
    const log = useCallback((text) => {
        setLogs(prev => {
            if (prev.length >= MAX_LOGS) {
                // 30 records pure hone par screen se purane logs clear karke fresh start
                return [
                    { t: new Date().toLocaleTimeString(), text },
                    { t: new Date().toLocaleTimeString(), text: '⚡ [Auto-Clear] 30 logs limit reached: Screen logs reset ho gaye' }
                ];
            }
            return [{ t: new Date().toLocaleTimeString(), text }, ...prev];
        });
    }, []);

    // Auto-clear watcher: jaise hi 30 logs reach hote hain, screen 1.5s me auto-clean ho jayegi
    useEffect(() => {
        if (logs.length >= 30) {
            const timer = setTimeout(() => {
                setLogs([
                    { t: new Date().toLocaleTimeString(), text: '⚡ [Auto-Clear] 30 logs pure ho gaye: Screen logs auto-clear ho gaye' }
                ]);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [logs.length]);
    const [running, setRunning] = useState(0);
    const [refreshIntervalSec, setRefreshIntervalSec] = useState(() => Math.round(RUNTIME.fallback_ms / 1000) || 2);
    const [nextDbSec, setNextDbSec] = useState(() => Math.round(RUNTIME.fallback_ms / 1000) || 2);
    const [lastDbFetch, setLastDbFetch] = useState('');
    const [memStats, setMemStats] = useState(() => getMemoryStats());

    // Live Memory monitor & auto-cleanup (runs every 3 seconds)
    useEffect(() => {
        const checkMemory = () => {
            const stats = getMemoryStats();
            setMemStats(stats);
            // If used JS Heap is above 150 MB or cache has > 20 items, auto-clean
            if ((stats.supported && stats.usedMB > 150) || inputCache.size > 20) {
                const countBefore = inputCache.size;
                const ramBefore = stats.usedMB;
                purgeAllMemory();
                const newStats = getMemoryStats();
                setMemStats(newStats);
                log(`[Auto-RAM Purge] RAM ${ramBefore}MB high tha. Caches saaf hue (${countBefore} items). RAM ab: ${newStats.usedMB || 'OK'}MB`);
            }
        };
        const timer = setInterval(checkMemory, 3000);
        return () => clearInterval(timer);
    }, [log]);

    // Refs so the timers, limiters and realtime handlers always see the latest values
    const sbRef = useRef(null);
    const workerIdRef = useRef('');
    const pausedRef = useRef(false);
    const drainRef = useRef(false);
    const failStreakRef = useRef(0);
    const sessionTasksDoneRef = useRef(0);
    const [sessionTasksDone, setSessionTasksDone] = useState(0);
    const settingsRef = useRef(DEFAULT_SETTINGS);
    const promptsRef = useRef({});   // task_type -> { system_text, role_text, enabled }
    const seenLimitRef = useRef(null);   // the task_limit this worker last reacted to (heartbeats do not change it)
    const kickRef = useRef(() => { });
    const refreshRef = useRef(() => { });
    const inFlight = useRef(new Set());
    const retryAfterMap = useRef(new Map()); // taskId -> timestamp ms jab tak retry wait karna hai
    const connectingRef = useRef(false); // parallel/duplicate connect calls prevent karne ke liye
    // Dynamic Auto-Scaling (Standard: 10, Rush Turbo: 20 parallel tasks for < 1 min response)
    const dynamicTaskConcurrencyRef = useRef(10);
    const dynamicGeminiConcurrencyRef = useRef(8);
    const [isTurboMode, setIsTurboMode] = useState(false);
    const [currentConcurrency, setCurrentConcurrency] = useState(10);

    // Tasks this worker runs at once, and model calls it makes at once. Both read the dynamic auto-scaled values.
    const taskLimiter = useRef(createLimiter(() => dynamicTaskConcurrencyRef.current)).current;
    const geminiLimiter = useRef(createLimiter(() => dynamicGeminiConcurrencyRef.current)).current;

    sbRef.current = sb;

    // Live countdown timer for DB refresh interval
    useEffect(() => {
        if (!sb) return;
        const timer = setInterval(() => {
            setNextDbSec(prev => (prev > 1 ? prev - 1 : refreshIntervalSec));
        }, 1000);
        return () => clearInterval(timer);
    }, [sb, refreshIntervalSec]);

    // The screen log is cleared every 10 minutes. It only clears what is on screen, not the database.
    useEffect(() => {
        const timer = setInterval(() => setLogs([]), 10 * 60 * 1000);
        return () => clearInterval(timer);
    }, []);

    // This worker's tasks: one tab and one page per click (no polling)
    const [myTab, setMyTab] = useState('pending');
    const [myPage, setMyPage] = useState(0);
    const [myRows, setMyRows] = useState([]);
    const [myCounts, setMyCounts] = useState({});
    const MY_PAGE_SIZE = 10;
    const loadMyTasks = useCallback(async (tab, page) => {
        const client = sbRef.current;
        if (!client || !workerIdRef.current) return;
        const from = page * MY_PAGE_SIZE;
        const { data, error, count } = await client.from(TABLES.TASKS)
            .select('id, app_id, task_type, model, status, error, output_text, output_image_url, imgbb_image_urls, face_match_score, batch_count, created_at', { count: 'exact' })
            .eq('worker_id', workerIdRef.current)
            .eq('status', tab)
            .order('id', { ascending: false })
            .range(from, from + MY_PAGE_SIZE - 1);
        if (error) return log('Tasks load error: ' + error.message);
        setMyRows(data || []);
        setMyCounts(prev => ({ ...prev, [tab]: count ?? 0 }));
    }, [log]);
    const pickTab = (tab) => { setMyTab(tab); setMyPage(0); loadMyTasks(tab, 0); };
    const goPage = (page) => { setMyPage(page); loadMyTasks(myTab, page); };
    refreshRef.current = () => {};   // the list is not reloaded by timers; only on click or the Refresh button


    // Read the worker config from the DB: limits, upload switches, cloud settings and the ImgBB key.
    // Runs on connect and whenever the admin changes the settings.
    const loadSettings = async (client) => {
        // Task types from the database first: a task is never run with a type the database does not know
        const { data: catalog } = await client.rpc(API.GET_CATALOG);
        if (catalog) setTaskTypes(catalog);
        const { data: roles } = await client.rpc(API.GET_FAMILY_ROLES);
        if (roles) FAMILY_ROLES = roles;
        const { data, error } = await client.rpc(API.GET_CONFIG, { p_worker_id: workerIdRef.current });
        if (error || !data) return;
        settingsRef.current = data;
        applyRuntime(data);
        setSettings(data);
        const baseTaskLimit = Number(data?.task_concurrency) || 10;
        const baseGeminiLimit = Number(data?.gemini_concurrency) || 8;
        if (!isTurboMode) {
            dynamicTaskConcurrencyRef.current = baseTaskLimit;
            dynamicGeminiConcurrencyRef.current = baseGeminiLimit;
            setCurrentConcurrency(baseTaskLimit);
        }
        const fbSec = data?.fallback_sec || Math.round(RUNTIME.fallback_ms / 1000) || 2;
        setRefreshIntervalSec(fbSec);
        setNextDbSec(fbSec);
        // Task prompts: a task whose prompt is missing or off is failed, never run with a default text
        const { data: prompts } = await client.rpc(API.GET_PROMPTS, { p_worker_id: workerIdRef.current });
        if (prompts) promptsRef.current = Object.fromEntries(prompts.map(p => [p.task_type, p]));
        kickRef.current();
    };

    // Ask the DB to claim one task. Returns true only if this worker got it.
    const claim = async (id) => {
        const { data, error } = await sbRef.current.rpc(API.CLAIM_TASK, { p_id: id, p_worker_id: workerIdRef.current });
        if (error) throw error;
        return (data || []).length > 0;
    };

    // Send the result (or failure) back through the worker function. Only this worker can change its own task.
    const complete = async (id, patch) => {
        const { data, error } = await sbRef.current.rpc(API.SAVE_RESULT, { p_id: id, p_worker_id: workerIdRef.current, p_patch: patch });
        if (error) throw error;
        if (!data || data.length === 0) log(`Task #${id}: ownership nahi mili, result save nahi hua`);
    };

    // Model call through the Gemini limiter (so the total calls stay within the setting)
    const takeCall = async () => {
        const { data, error } = await sbRef.current.rpc(API.TAKE_BUDGET, { p_worker_id: workerIdRef.current, p_calls: 1 });
        if (error) throw error;
        if (!data) throw new Error('Aaj ka Gemini budget khatam');
    };
    const askModel = (task, inputs) => geminiLimiter(async () => { await takeCall(); return callAiStudio(task, inputs, GEMINI_API_KEY, promptsRef.current[task.task_type]); });
    const checkFace = (faceB64, outB64) => geminiLimiter(async () => { await takeCall(); return checkFaceMatch(faceB64, outB64, GEMINI_API_KEY); });

    // One photo: generate (again if the face is weak), then upload to every service the admin turned on
    const makePhoto = async (task, inputs) => {
        let best = null;
        for (let attempt = 0; attempt <= RUNTIME.match_retries; attempt++) {
            const { image: generated } = await askModel(task, inputs);
            const type = TASK_TYPES[task.task_type];
            const image = type.edit
                ? { dataUrl: await compositeEdit(inputs.face, inputs.style, generated.dataUrl), mimeType: 'image/jpeg' }
                : type.transparentOut
                    ? { dataUrl: await knockoutWhite(generated.dataUrl), mimeType: 'image/png' }
                    : generated;
            const score = inputs.face && TASK_TYPES[task.task_type].faceCheck ? await checkFace(inputs.face, image.dataUrl.split(',')[1]) : null;
            if (!best || (score ?? 0) > (best.score ?? 0)) best = { image, score };
            if (score === null || score >= RUNTIME.match_threshold) break;
        }
        const cfg = settingsRef.current;
        const isTransparent = TASK_TYPES[task.task_type].transparentOut;
        let fullDataUrl = best.image.dataUrl;
        let compressedDataUrl = isTransparent ? fullDataUrl : await shrinkDataUrl(fullDataUrl);
        if (!cfg.cloudinary_enabled && !cfg.imgbb_enabled) {
            fullDataUrl = null;
            compressedDataUrl = null;
            best = null;
            throw new Error('Admin ne upload band kar rakha hai');
        }
        let cloud = null;
        let imgbb = null;
        const uploads = [];
        if (cfg.cloudinary_enabled) uploads.push(uploadDataUrlToCloudinary(compressedDataUrl, cfg).then(u => { cloud = u; }).catch(() => {}));
        if (cfg.imgbb_enabled) uploads.push(uploadToImgbb(fullDataUrl, cfg.imgbb_api_key).then(u => { imgbb = u; }).catch(() => {}));
        await Promise.all(uploads);

        const score = best.score;
        // Task upload complete: Release large base64 buffers immediately to keep RAM low
        fullDataUrl = null;
        compressedDataUrl = null;
        if (best.image) best.image.dataUrl = null;
        best = null;

        if (!cloud && !imgbb) throw new Error('Upload nahi hua: dono service fail');
        return { cloud, imgbb, score };
    };

    // A failed task: try again later while attempts are left, otherwise mark it failed.
    // A bad key pauses the worker at once. 5 failures in a row also pause it.
    const autoPause = async (reason) => {
        if (pausedRef.current) return;
        pausedRef.current = true;
        setPaused(true);
        if (sbRef.current && workerIdRef.current) {
            try {
                await sbRef.current.rpc(API.AUTO_PAUSE, { p_worker_id: workerIdRef.current, p_reason: reason });
            } catch (err) {
                console.warn('AutoPause error:', err);
            }
        }
        log('Worker khud pause ho gaya: ' + reason);
    };

    const failTask = async (task, err) => {
        const msg = err?.message || 'Unknown error';
        const keyProblem = /HTTP 40[13]|API key|API_KEY|PERMISSION_DENIED/i.test(msg);
        const isValidationError = /chahiye|Task type galat|DB mein nahi|Prompt khali/i.test(msg);
        const cfg = settingsRef.current;
        const attempts = (task.attempts || 0) + 1;

        // Task fail hone par worker ko KABHI BHI auto-pause nahi karna hai (Worker hamesha non-stop chalta rahega)
        if (keyProblem) {
            log(`Task #${task.id} warning: Key problem (${msg.slice(0, 70)})`);
        }

        // Validation errors (missing photos/prompts) permanent hain, inko repeat karne ka fayda nahi
        if (!keyProblem && !isValidationError && attempts < cfg.max_attempts) {
            const delaySec = cfg.retry_delay_sec || 30;
            const nextRun = new Date(Date.now() + delaySec * 1000).toISOString();
            retryAfterMap.current.set(task.id, Date.now() + delaySec * 1000);
            await complete(task.id, { status: 'pending', attempts, next_run_at: nextRun, error: msg });
            log(`Task #${task.id}: fail, ${delaySec} second baad dobara (${attempts}/${cfg.max_attempts}): ${msg}`);
        } else {
            retryAfterMap.current.delete(task.id);
            await complete(task.id, { status: 'failed', attempts, error: msg });
            log(`Task #${task.id}: fail: ${msg}`);
        }
    };

    const onTaskCompletedSuccess = () => {
        failStreakRef.current = 0;
        sessionTasksDoneRef.current += 1;
        const currentDone = sessionTasksDoneRef.current;
        setSessionTasksDone(currentDone);
        const recycleLimit = Number(settingsRef.current.worker_recycle_after_tasks) || 50;

        if (currentDone >= recycleLimit) {
            log(`[Auto-Recycle] ${currentDone}/${recycleLimit} tasks complete ho gaye! Logs aur cache clear karke fresh page reload hoga...`);
            // 1. Activity Logs clear
            setLogs([]);
            // 2. Memory & Image Caches purge
            purgeAllMemory();
            // 3. Reset session counter
            sessionTasksDoneRef.current = 0;
            setSessionTasksDone(0);
            // 4. Fresh page reload taaki page hamesha smooth & fresh rahe
            setTimeout(() => {
                if (inFlight.current.size === 0) {
                    window.location.reload();
                }
            }, 1200);
        }
    };

    // Run one claimed task from start to finish
    const processTask = async (task) => {
        const client = sbRef.current;
        let inputs = {};
        try {
            let type = TASK_TYPES[task.task_type];
            if (!type) {
                console.log(`[Worker] Unknown task_type ${task.task_type}, refreshing catalog from database...`);
                await loadSettings(client);
                type = TASK_TYPES[task.task_type];
            }
            if (!type) throw new Error(`Task type galat hai: ${task.task_type}`);
            for (const key of type.inputs) {
                if (type.optional?.includes(key)) continue;
                if (!task[INPUT_COLUMN[key]]) throw new Error(`${labelFor(type, key)} chahiye`);
            }
            if (type.promptRequired && !(task.prompt || '').trim()) throw new Error('Prompt chahiye');

            // Chat: wait until earlier messages of the same conversation are finished
            let history = [];
            if (task.task_type === 'chat' && task.conversation_id) {
                const { data: waiting, error: waitErr } = await client.from(TABLES.TASKS)
                    .select('id')
                    .eq('conversation_id', task.conversation_id)
                    .lt('id', task.id)
                    .in('status', ['pending', 'processing'])
                    .limit(1);
                if (waitErr) throw waitErr;
                if (waiting?.length) {
                    await complete(task.id, { status: 'pending' });   // give it back, try again later
                    log(`Task #${task.id}: pichhle message ka wait`);
                    return;
                }
                const { data, error } = await client.from(TABLES.TASKS)
                    .select('prompt, output_text')
                    .eq('conversation_id', task.conversation_id)
                    .eq('status', 'done')
                    .lt('id', task.id)
                    .order('id', { ascending: true });
                if (error) throw error;
                history = data || [];
            }

            // Load the reference images in parallel
            inputs = {};
            const keys = type.inputs;
            const loaded = await Promise.all(keys.map(k => urlToBase64(task[INPUT_COLUMN[k]])));
            keys.forEach((k, i) => { inputs[k] = loaded[i]; });
            if (type.extras && !type.perPhoto && task.extra_image_urls?.length) {
                // Empty slots (family photo) are skipped; the rest keep their order
                inputs.extras = await Promise.all(task.extra_image_urls.filter(Boolean).map(urlToBase64));
            }

            if (type.output === 'text') {
                const result = await askModel({ ...task, history }, inputs);
                await complete(task.id, { status: 'done', output_text: result.text });
                onTaskCompletedSuccess();
                log(`[${appLabel}] Task #${task.id}: text response tayyar`);
                return;
            }

            // Photos one by one: each uploaded photo (up to 10) gets the same prompt, so one result per photo
            if (type.perPhoto) {
                const maxBatch = settingsRef.current?.photos_per_task_max || 50;
                const photosIn = (task.extra_image_urls || []).filter(Boolean).slice(0, maxBatch);
                const done = await Promise.allSettled(photosIn.map(async (url) => {
                    const b64 = await urlToBase64(url);
                    return makePhoto(task, { extras: [b64] });
                }));
                const made = done.filter(r => r.status === 'fulfilled').map(r => r.value);
                if (made.length === 0) throw new Error(done[0]?.reason?.message || 'Koi photo nahi bani');
                const cloudOut = made.map(p => p.cloud).filter(Boolean);
                const imgbbOut = made.map(p => p.imgbb).filter(Boolean);
                await complete(task.id, {
                    status: 'done',
                    output_image_url: cloudOut[0] || imgbbOut[0] || null,
                    output_image_urls: cloudOut,
                    imgbb_image_urls: imgbbOut,
                    face_match_score: null
                });
                onTaskCompletedSuccess();
                log(`Task #${task.id}: ${made.length} / ${photosIn.length} photo bani`);
                return;
            }

            // Image tasks: batch_count photos (up to the settings limit), all made in parallel
            const count = Math.min(Math.max(task.batch_count || 1, 1), settingsRef.current.photos_per_task_max);
            // Each photo is independent. A photo that fails does not cancel the others.
            // Product angles: each photo of the batch gets the next angle
            const settled = await Promise.allSettled(Array.from({ length: count }, (_, idx) =>
                makePhoto(type.angles ? { ...task, angle: type.angles[idx % type.angles.length] } : task, inputs)));
            const photos = settled.filter(r => r.status === "fulfilled").map(r => r.value);
            const failedPhotos = settled.filter(r => r.status === "rejected");
            // The whole task fails only when no photo came out at all
            if (photos.length === 0) throw new Error(failedPhotos[0]?.reason?.message || "Koi photo nahi bani");
            if (failedPhotos.length) log(`Task #${task.id}: ${failedPhotos.length} photo fail, ${photos.length} save hui`);
            const cloudUrls = photos.map(p => p.cloud).filter(Boolean);
            const imgbbUrls = photos.map(p => p.imgbb).filter(Boolean);
            const scores = photos.map(p => p.score).filter(s => s != null);
            await complete(task.id, {
                status: 'done',
                output_image_url: cloudUrls[0] || imgbbUrls[0] || null,
                output_image_urls: cloudUrls,
                imgbb_image_urls: imgbbUrls,
                face_match_score: scores.length ? Math.max(...scores) : null
            });
            onTaskCompletedSuccess();
            log(`[${appLabel}] Task #${task.id}: ${photos.length} photo (Cloudinary ${cloudUrls.length}, ImgBB ${imgbbUrls.length})`);
        } catch (err) {
            await failTask(task, err);
        } finally {
            // Task complete ho gaya (ImgBB/Cloudinary + DB done) -> Cache & Base64 memory free karo
            cleanTaskCache(task);
            if (inputs) {
                for (const k in inputs) { inputs[k] = null; }
                inputs = null;
            }
        }
    };

    // Looks for work and gives it to the task limiter (it keeps at most task_concurrency running)
    const kick = async () => {
        const client = sbRef.current;
        if (!client || !workerIdRef.current || pausedRef.current || drainRef.current) return;
        if (!Object.keys(TASK_TYPES).length) return;   // wait until the task types are loaded
        if (!Object.keys(RUNTIME.model_caps).length) return;   // and until the model list is known
        if (settingsRef.current.budget_left === 0) return;
        const baseLimit = Math.max(1, Number(settingsRef.current.task_concurrency) || 10);
        const maxLimit = dynamicTaskConcurrencyRef.current;
        if (inFlight.current.size >= maxLimit) return;   // no free slot: do not ask the DB
        setLastDbFetch(new Date().toLocaleTimeString());
        setNextDbSec(refreshIntervalSec);
        try {
            const stale = new Date(Date.now() - RUNTIME.stale_ms).toISOString();
            const { data, error } = await client.rpc(API.GET_PENDING, { p_worker_id: workerIdRef.current, p_stale_before: stale, p_limit: 40 });
            if (error) throw error;
            const pendingTasks = data || [];

            // ⚡ DYNAMIC AUTO-SCALER TURBO LOGIC (< 1 minute latency guarantee)
            // If rush traffic arrives (>= 4 tasks waiting or active load high):
            const rushDetected = pendingTasks.length >= 4 || inFlight.current.size >= 8;
            if (rushDetected && dynamicTaskConcurrencyRef.current < 20) {
                dynamicTaskConcurrencyRef.current = 20;
                dynamicGeminiConcurrencyRef.current = 16;
                setIsTurboMode(true);
                setCurrentConcurrency(20);
                taskLimiter.pump?.();
                geminiLimiter.pump?.();
                log('⚡ [Auto-Scale Turbo Active] Queue rush detected! Scaled worker limit from 10 -> 20 parallel tasks (Gemini: 16) to ensure < 1 min clearance.');
            } else if (!rushDetected && pendingTasks.length <= 1 && inFlight.current.size <= 5 && dynamicTaskConcurrencyRef.current > baseLimit) {
                // Cool down to normal limit once backlog is cleared
                dynamicTaskConcurrencyRef.current = baseLimit;
                dynamicGeminiConcurrencyRef.current = Math.min(8, Number(settingsRef.current.gemini_concurrency) || 8);
                setIsTurboMode(false);
                setCurrentConcurrency(baseLimit);
                log(`🌿 [Auto-Scale Normal] Queue cleared. Worker limit normalized to ${baseLimit} parallel tasks.`);
            }

            for (const task of pendingTasks) {
                if (inFlight.current.size >= dynamicTaskConcurrencyRef.current) break;
                if (inFlight.current.has(task.id)) continue;
                if (retryAfterMap.current.has(task.id) && Date.now() < retryAfterMap.current.get(task.id)) continue;
                if ((settingsRef.current.disabled_models || []).includes(task.model)) continue;
                inFlight.current.add(task.id);
                setRunning(inFlight.current.size);
                taskLimiter(async () => {
                    try {
                        if (!pausedRef.current && await claim(task.id)) {
                            log(`Task #${task.id} mila (${task.task_type}, ${task.model})`);
                            await withTimeout(processTask({ ...task, status: 'processing' }), (settingsRef.current.task_timeout_sec || 300) * 1000);
                        }
                    } catch (err) {
                        if (/^Timeout:/.test(err.message)) await failTask(task, err);
                        else log('Claim error: ' + err.message);
                    } finally {
                        inFlight.current.delete(task.id);
                        setRunning(inFlight.current.size);
                        if (drainRef.current && inFlight.current.size === 0) log('Drain complete: ab is tab ko band kar sakte ho');
                        // Instant slot fill: immediately check for remaining tasks without waiting 2 seconds
                        if (!pausedRef.current && !drainRef.current && inFlight.current.size < dynamicTaskConcurrencyRef.current) {
                            kickRef.current();
                        }
                    }
                });
            }
        } catch (err) {
            log('Pending error: ' + err.message);
        }
    };
    kickRef.current = kick;

    // Refresh: reload the config and the lists, and look for tasks again
    const refreshAll = async () => {
        const c = sbRef.current;
        if (c) await loadSettings(c);
        loadMyTasks(myTab, myPage);
        kickRef.current();
    };

    const connect = async (overrideUrl) => {
        if (connectingRef.current || sbRef.current) return;
        connectingRef.current = true;
        try {
            const targetUrl = typeof overrideUrl === 'string' ? overrideUrl : (customApiUrl || API_URL);
            const lib = await loadApiClient();
            const client = lib.createClient(targetUrl, apiKey);
            log(`Connecting to ${client.apiUrl}...`);

            // Unique worker id from the DB (worker_1, worker_2 ...). The same tab keeps its id.
            const wanted = sessionStorage.getItem('ai_studio_worker_id');
            const { data, error } = await client.rpc(API.REGISTER_WORKER, { p_wanted: wanted });
            if (error) throw error;
            sessionStorage.setItem('ai_studio_worker_id', data);
            workerIdRef.current = data;
            sbRef.current = client;
            setWorkerId(data);
            await loadSettings(client);
            setSb(client);
            log(`Connected as ${data}`);
        } catch (err) {
            sbRef.current = null;
            log('Connect error: ' + err.message);
        } finally {
            connectingRef.current = false;
        }
    };

    // Everything that happens while connected: heartbeat, realtime, safety-net refresh, and release on close
    useEffect(() => {
        if (!sb) return;

        const heartbeat = async () => {
            const w = workerIdRef.current;
            if (!w) return;
            const { data, error } = await sb.rpc(API.HEARTBEAT, { p_worker_id: w });
            if (error) return;
            const isPaused = !!data?.paused;
            drainRef.current = !!data?.drain;
            setDrain(!!data?.drain);
            pausedRef.current = isPaused;
            setPaused(isPaused);
        };

        // A burst of task changes becomes one refresh (1 s)
        let refreshTimer = null;
        const scheduleRefresh = () => {
            clearTimeout(refreshTimer);
            refreshTimer = setTimeout(() => { refreshRef.current(); kickRef.current(); }, 3000);
        };

        heartbeat();
        refreshRef.current();
        kickRef.current();
        const stopHb = everyMs(heartbeat, () => RUNTIME.heartbeat_ms);
        const stopFb = everyMs(() => { refreshRef.current(); kickRef.current(); }, () => RUNTIME.fallback_ms);

        let channel = null;
        if (USE_REALTIME) try {
        channel = sb.channel('ai-studio-worker-' + workerIdRef.current)
            // Only a new task wakes the worker. Its own status updates (processing, done) do not cause a call.
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.TASKS }, () => scheduleRefresh())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLES.WORKERS }, (payload) => {
                if (payload.new?.worker_id !== workerIdRef.current) return;
                // The admin changed this worker's limit (task_limit): read the settings again, once
                const limit = payload.new.task_limit ?? null;
                if (limit !== seenLimitRef.current) {
                    seenLimitRef.current = limit;
                    loadSettings(sb);
                }
                const isPaused = !!payload.new.paused;
                drainRef.current = !!payload.new.drain;
                setDrain(!!payload.new.drain);
                pausedRef.current = isPaused;
                setPaused(isPaused);
                if (!isPaused) kickRef.current();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLES.SETTINGS }, () => loadSettings(sb))
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.PROMPTS }, () => loadSettings(sb))
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.CATALOG }, () => loadSettings(sb))
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.FAMILY_ROLES }, () => loadSettings(sb))
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.MODELS }, () => loadSettings(sb))
            .subscribe();
        } catch (err) {
            // No realtime here (for example, a sandboxed preview): the timers still keep the worker going
            log('Realtime band hai, timer se chalega: ' + err.message);
        }

        // Tab closing: free this worker's tasks right away
        const release = () => {
            const w = workerIdRef.current;
            if (!w) return;
            const targetUrl = sbRef.current?.apiUrl || API_URL;
            fetch(`${targetUrl}/rest/v1/rpc/${API.RELEASE_WORKER}`, {
                method: 'POST',
                keepalive: true,
                headers: { 'Bypass-Tunnel-Reminder': 'true', apikey: apiKey, Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ p_worker_id: w })
            });
        };
        window.addEventListener('pagehide', release);

        return () => {
            stopHb();
            stopFb();
            clearTimeout(refreshTimer);
            if (channel) sb.removeChannel(channel);
            window.removeEventListener('pagehide', release);
        };
    }, [sb, apiKey]);

    // Connects by itself: when the page opens, and again every 15 s until it is connected (needs the Gemini key in this browser)
    useEffect(() => {
        const tryConnect = () => { if (!sbRef.current) connect(); };
        tryConnect();
        const t = setInterval(tryConnect, 15000);
        return () => clearInterval(t);
    }, []);

    const status = !sb ? 'Offline' : paused ? 'Paused (admin)' : 'Live';
    const statusStyle = !sb ? 'bg-stone-800 text-stone-300 border-white/10' : paused ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';

    return (
        <div className="min-h-screen bg-stone-950 text-stone-100 p-4 sm:p-6 space-y-5">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-stone-950" />
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold">AI Studio <span className="text-yellow-300">Worker</span></h1>
                        <p className="text-[11px] text-stone-400">Task uthata hai, model chalata hai, photo ImgBB + Cloudinary par upload karke save karta hai</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    {/* Dynamic Auto-Scale Concurrency Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                        isTurboMode
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : 'bg-stone-900 text-stone-300 border-white/10'
                    }`} title={isTurboMode ? '⚡ Turbo Auto-Scaler Active: 20 parallel tasks running to complete requests in under 1 minute!' : '🟢 Normal Mode: Standard parallel processing'}>
                        <span>{isTurboMode ? '⚡ TURBO: 20 Parallel (<1m)' : `⚡ Parallel: ${currentConcurrency}`}</span>
                    </div>

                    {/* Session Tasks Progress Badge */}
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-white/10 text-xs font-mono" title="Worker auto-recycle limit from DB">
                        <span className="text-stone-400">Tasks:</span>
                        <strong className="text-yellow-300">{sessionTasksDone}/{settings.worker_recycle_after_tasks || 50}</strong>
                    </div>
                    {/* RAM Live Monitor Badge & Purge Button */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-white/10 text-xs font-mono">
                        <span className={`w-2 h-2 rounded-full ${memStats.usedMB > 150 ? 'bg-rose-500 animate-ping' : memStats.usedMB > 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                        <span>RAM: <strong className={memStats.usedMB > 150 ? 'text-rose-400' : 'text-stone-200'}>{memStats.supported ? `${memStats.usedMB} MB` : 'Normal'}</strong></span>
                        <button
                            type="button"
                            onClick={() => {
                                purgeAllMemory();
                                const fresh = getMemoryStats();
                                setMemStats(fresh);
                                log('RAM & Cache memory saaf kar di gayi');
                            }}
                            title="RAM aur Caches abhi saaf karein"
                            className="ml-1 text-[10px] text-yellow-300 hover:text-yellow-200 underline font-sans font-bold"
                        >
                            Purge
                        </button>
                    </div>
                    <button onClick={refreshAll} title="Refresh" className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/10 bg-stone-900 text-stone-300"><RefreshCw className="w-4 h-4" /></button>
                    {!sb && <button onClick={connect} disabled={!!sb} className="h-9 px-4 rounded-xl bg-yellow-400 text-stone-950 font-black disabled:opacity-40">Connect</button>}
                    <span className="font-mono font-bold text-yellow-300">{workerId || '—'}</span>
                    <span className={`px-2.5 py-1 rounded-lg border font-bold ${statusStyle}`}>{status}</span>
                </div>
            </header>

                        {/* ⚙️ Top API Settings Bar */}
            <div className="bg-stone-900 border border-yellow-400/20 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
                <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                    <span className="flex items-center gap-1.5 font-bold text-yellow-300 text-xs whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        API Endpoint:
                    </span>
                    <input
                        type="text"
                        value={customApiUrl}
                        onChange={(e) => {
                            const val = e.target.value.trim();
                            setCustomApiUrl(val);
                            try { localStorage.setItem('aistudio_api_url', val); } catch {}
                        }}
                        placeholder="https://aistudio.runasp.net"
                        className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-yellow-400"
                    />
                    <button
                        type="button"
                        onClick={() => connect(customApiUrl)}
                        className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold rounded-xl transition-all text-xs"
                    >
                        Save & Connect
                    </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-stone-400">
                    <span>Default:</span>
                    <button
                        type="button"
                        onClick={() => {
                            const u = "https://aistudio.runasp.net";
                            setCustomApiUrl(u);
                            try { localStorage.setItem('aistudio_api_url', u); } catch {}
                            connect(u);
                        }}
                        className="font-mono text-yellow-300 hover:underline font-bold"
                    >
                        https://aistudio.runasp.net
                    </button>
                </div>
            </div>

            {/* Numbers */}
            <section className="grid gap-3 grid-cols-2 sm:grid-cols-6">
                {[
                    ['Abhi chal rahe', running],
                    ['Done', myCounts.done ?? '—'],
                    ['Failed', myCounts.failed ?? '—'],
                    ['Ek saath tasks', isTurboMode ? `${currentConcurrency} (⚡ Turbo)` : currentConcurrency],
                    ['Memory (RAM)', memStats.supported ? `${memStats.usedMB} MB` : `${inputCache.size} Cache`],
                    ['Recycle (Done/Limit)', `${sessionTasksDone} / ${settings.worker_recycle_after_tasks || 50}`]
                ].map(([label, value]) => (
                    <div key={label} className="bg-stone-900 border border-white/10 rounded-2xl p-4">
                        <p className="text-[11px] text-stone-400">{label}</p>
                        <p className="text-2xl font-extrabold font-mono text-stone-100">{value}</p>
                    </div>
                ))}
            </section>
            <p className="text-[11px] text-stone-500">Upload: {settings.cloudinary_enabled ? 'Cloudinary ON' : 'Cloudinary OFF'} · {settings.imgbb_enabled ? 'ImgBB ON' : 'ImgBB OFF'} (admin se)</p>
            <p className="text-[11px] text-stone-500">Model calls ek saath: {isTurboMode ? 16 : settings.gemini_concurrency} · Photos per task: {settings.photos_per_task_max} · ⚡ Auto-Scaler: Rush par limit automatic 20 ho jati hai (&lt; 1 min response guarantee)</p>

            {drain && <p className="text-xs text-sky-200 bg-sky-500/10 border border-sky-500/30 rounded-xl px-3 py-2">Drain mode: naya task nahi lega, chal rahe tasks khatam honge.</p>}
            {settings.budget_left != null && <p className="text-[11px] text-stone-400">Aaj ka bacha Gemini budget: {settings.budget_left}</p>}
            {settings.disabled_models?.length > 0 && <p className="text-[11px] text-stone-400">Band models: {settings.disabled_models.join(', ')}</p>}
            {!paused && (
                <button type="button" onClick={() => autoPause('Worker ne khud pause kiya (screen se)')} className="h-9 px-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs font-bold">
                    Pause karo (naya task mat lo)
                </button>
            )}
            {paused && (
                <p className="text-xs text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Ye worker pause hai. Naya task nahi lega, jo chal raha hai wo complete hoga. Wapas chalu karne ke liye admin ke Workers screen se Resume karein.
                </p>
            )}

            {/* My tasks: a table with tabs and pages (loaded on click only) */}
            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-extrabold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-yellow-300" /> Is worker ke tasks</h2>
                    <div className="flex gap-1.5">
                        {[['pending', 'Pending'], ['processing', 'Processing'], ['done', 'Completed'], ['failed', 'Failed']].map(([key, label]) => (
                            <button key={key} type="button" onClick={() => pickTab(key)} className={`h-8 px-3 rounded-lg text-xs font-bold border ${myTab === key ? 'bg-yellow-400 text-stone-950 border-yellow-300' : 'bg-stone-900 border-white/10 text-stone-300'}`}>{label}{myCounts[key] != null ? ` (${myCounts[key]})` : ''}</button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto bg-stone-900 border border-white/10 rounded-2xl">
                    <table className="w-full text-xs">
                        <thead className="text-left text-stone-400"><tr><th className="p-2">#</th><th className="p-2">App</th><th className="p-2">Kaam</th><th className="p-2">Model</th><th className="p-2">Result</th><th className="p-2">Error</th></tr></thead>
                        <tbody>
                            {myRows.map(t => (
                                <tr key={t.id} className="border-t border-white/5 align-top">
                                    <td className="p-2 font-mono text-yellow-300">#{t.id}</td><td className="p-2"><span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border ${t.app_id === 'ppp' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-amber-400/10 text-amber-300 border-amber-400/30'}`}>{t.app_id || 'weargen'}</span></td>
                                    <td className="p-2">{TASK_TYPES[t.task_type]?.label || t.task_type}</td>
                                    <td className="p-2 font-mono text-stone-400">{t.model}</td>
                                    <td className="p-2">{t.output_image_url && <a href={t.output_image_url} target="_blank" rel="noreferrer" className="text-emerald-300 underline mr-2">Photo</a>}{t.output_text && <span className="text-stone-200">{t.output_text.slice(0, 120)}</span>}{!t.output_image_url && !t.output_text && '—'}</td>
                                    <td className="p-2 text-rose-300">{t.error || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {myRows.length === 0 && <p className="text-center text-xs text-stone-500 py-6">{myCounts[myTab] == null ? 'Upar se tab chunein' : 'Is tab mein koi task nahi.'}</p>}
                {myCounts[myTab] > MY_PAGE_SIZE && (
                    <div className="flex items-center justify-between text-xs">
                        <button type="button" disabled={myPage === 0} onClick={() => goPage(myPage - 1)} className="h-8 px-3 rounded-lg border border-white/10 bg-stone-900 disabled:opacity-40">Pichhla</button>
                        <span className="font-mono text-stone-400">Page {myPage + 1} / {Math.ceil(myCounts[myTab] / MY_PAGE_SIZE)}</span>
                        <button type="button" disabled={(myPage + 1) * MY_PAGE_SIZE >= myCounts[myTab]} onClick={() => goPage(myPage + 1)} className="h-8 px-3 rounded-lg border border-white/10 bg-stone-900 disabled:opacity-40">Agla</button>
                    </div>
                )}
            </section>

            {/* Console & Activity Log */}
            <section className="bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-extrabold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Console & Activity Log
                        </h2>
                        <span className="text-[10px] text-stone-400 font-mono">({logs.length}/30 max)</span>
                        {logs.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setLogs([])}
                                className="text-[10px] text-stone-400 hover:text-yellow-300 underline font-mono ml-1"
                                title="Abhi log saaf karein"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            DB Refresh: Har {refreshIntervalSec}s me
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-stone-800 border border-white/10 text-stone-300 font-semibold">
                            Agla DB fetch: <span className="text-yellow-300 font-bold font-mono">{nextDbSec}s</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-stone-800 border border-white/10 text-stone-300 font-semibold" title="Auto-purges cache when task ends or high RAM">
                            RAM: <span className="text-emerald-300 font-bold font-mono">{memStats.supported ? `${memStats.usedMB} MB` : 'Safe'}</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-stone-800 border border-white/10 text-stone-300 font-semibold" title="Tasks before auto-recycle and fresh reload">
                            Auto-Recycle: <span className="text-yellow-300 font-bold font-mono">{sessionTasksDone}/{settings.worker_recycle_after_tasks || 50}</span>
                        </span>
                        {lastDbFetch && (
                            <span className="text-stone-400 text-[10px]">
                                (Aakhri fetch: {lastDbFetch})
                            </span>
                        )}
                    </div>
                </div>
                <div className="max-h-56 overflow-auto space-y-1 font-mono text-[11px] text-stone-300">
                    {logs.map((l, i) => <p key={i}><span className="text-stone-500">{l.t}</span> {l.text}</p>)}
                    {logs.length === 0 && <p className="text-stone-500">Connect karo to log yahan aayega.</p>}
                </div>
            </section>
            {running > 0 && <p className="text-[10px] text-stone-500 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> {running} task chal rahe hain</p>}
        </div>
    );
}
