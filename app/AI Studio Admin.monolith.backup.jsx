import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
    Shield, LogIn, LogOut, Send, Trash2, Pause, Play, RefreshCw, AlertCircle, Upload, 
    Users, List, Eye, Sparkles, Search, CheckCircle2, Sliders, Image, Grid, ArrowUpRight,
    Camera, Palette, ShoppingBag, EyeOff, Check, X, ChevronRight, ChevronDown, ChevronUp, 
    Activity, Terminal, Download, ExternalLink, HelpCircle, Layers, SlidersHorizontal, 
    Sun, Moon, Info, Code, Copy, Save, Plus, Pencil, Wrench, Loader2
} from 'lucide-react';

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
// AI STUDIO ADMIN: login required. Two screens:
//   1. Task banao: choose task type and model, fill the inputs the model accepts, see the exact payload.
//   2. Workers: live workers, pause / resume, task list.
// The worker app does the actual generation. This app only creates tasks and controls workers.
// Powered by .NET Core Web API & Microsoft SQL Server
// ============================================================

// ── Config (public values; the secret keys are typed in, never stored in code) ──
const API_URL = "https://aistudio.runasp.net";
// Publishable key: safe in the app code (row security protects the data)
const API_KEY = "aistudio_admin_local_key";
const CLOUDINARY_CLOUD_NAME = "draaqjcre";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const REFRESH_MS = 2000;          // Auto-refresh from DB every 2 seconds
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


// ── Visual Categories for Modern SaaS Tool Browser ──
const TOOL_CATEGORIES = [
    { id: 'all', label: 'All Tools', icon: '✨' },
    { id: 'fashion', label: 'Fashion & Suits', icon: '👗' },
    { id: 'catalog', label: 'Catalog & Studio', icon: '🛍️' },
    { id: 'tryon', label: 'Try-On & Jewelry', icon: '💎' },
    { id: 'portrait', label: 'Portraits & Wedding', icon: '📸' },
    { id: 'utility', label: 'Retouch & Utility', icon: '🪄' },
    { id: 'arch', label: 'Spaces & Interior', icon: '🏠' },
    { id: 'vision', label: 'AI Vision & Chat', icon: '👁️' }
];

function getToolCategory(taskType) {
    if (['batch_model_to_garment', 'suit_studio', 'saree_lehenga_studio', 'ghost_mannequin', 'outfit_change', 'outfit_change_ref', 'man_shirt', 'man_suit', 'man_jeans', 'man_shorts', 'man_shoes', 'shirt_change', 'suit_change', 'woman_shoes'].includes(taskType)) return 'fashion';
    if (['combo_5pose_studio', 'luxury_product_podium', 'food_photography_studio', 'festival_sale_banner', 'product_angles', 'product_catalog', 'product_scene', 'mockup', 'sticker_logo', 'poster_text'].includes(taskType)) return 'catalog';
    if (['jewellery_tryon', 'watch_sunglasses_tryon', 'virtual_tryon', 'man_glasses', 'woman_glasses', 'woman_earrings', 'woman_nose_pin'].includes(taskType)) return 'tryon';
    if (['prewedding_studio', 'bridal_makeup_studio', 'couple_photo', 'family_photo', 'hair_salon_studio', 'hair_change', 'face_swap', 'pose_change'].includes(taskType)) return 'portrait';
    if (['room_interior_redesign', 'house_exterior_paint', 'kids_milestone_studio'].includes(taskType)) return 'arch';
    if (['chat', 'photo_read', 'product_tag', 'ocr_text', 'moderation_check'].includes(taskType)) return 'vision';
    return 'utility';
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
    const cat = getToolCategory(row.task_type);
    const catObj = TOOL_CATEGORIES.find(c => c.id === cat) || TOOL_CATEGORIES[0];

    return (
        <div className="bg-[#0b0e17] border border-white/[0.08] hover:border-amber-400/40 rounded-2xl p-4 space-y-3 transition-all shadow-md group">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-base">{catObj.icon}</span>
                        <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">{row.label}</h3>
                    </div>
                    <p className="font-mono text-[10px] text-stone-400">{row.task_type} · <span className="uppercase text-amber-400 font-semibold">{row.output}</span></p>
                    {row.hint && <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">{row.hint}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${row.enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                        {row.enabled ? 'Active' : 'Disabled'}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-white/5 text-[11px] text-stone-300">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white font-medium">
                    <input type="checkbox" checked={row.enabled} onChange={e => onToggle(row.task_type, 'enabled', e.target.checked)} className="rounded border-white/20 text-amber-400 focus:ring-0 cursor-pointer" /> 
                    <span>Chalu</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white font-medium">
                    <input type="checkbox" checked={row.customer_visible} onChange={e => onToggle(row.task_type, 'customer_visible', e.target.checked)} className="rounded border-white/20 text-amber-400 focus:ring-0 cursor-pointer" /> 
                    <span>Customer App me</span>
                </label>
                {apps.map(a => (
                    <label key={a.app_id} className="flex items-center gap-1.5 cursor-pointer text-stone-400 hover:text-white font-medium">
                        <input type="checkbox" checked={appTasks.some(x => x.app_id === a.app_id && x.task_type === row.task_type)} onChange={e => onToggleApp(a.app_id, row.task_type, e.target.checked)} className="rounded border-white/20 text-amber-400 focus:ring-0 cursor-pointer" /> 
                        <span>{a.label}</span>
                    </label>
                ))}
                {!f && (
                    <button type="button" onClick={start} className="ml-auto text-amber-400 hover:text-amber-300 font-semibold underline text-[11px]">
                        Naam & Slots badlo ✎
                    </button>
                )}
            </div>

            {f && (
                <div className="space-y-3 pt-3 border-t border-white/10 bg-black/40 p-3 rounded-xl mt-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                            <label className="block text-[10px] text-stone-400 mb-1">Admin Label</label>
                            <input value={f.label} onChange={e => setF({ ...f, label: e.target.value })} placeholder="Admin naam" className="h-9 w-full bg-stone-900 border border-white/10 rounded-lg px-3 text-xs text-white" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-stone-400 mb-1">Customer Label</label>
                            <input value={f.customer_label} onChange={e => setF({ ...f, customer_label: e.target.value })} placeholder="Customer naam" className="h-9 w-full bg-stone-900 border border-white/10 rounded-lg px-3 text-xs text-white" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] text-stone-400 mb-1">Customer Hint</label>
                        <textarea value={f.hint} onChange={e => setF({ ...f, hint: e.target.value })} rows={2} placeholder="Customer ke liye hint" className="w-full bg-stone-900 border border-white/10 rounded-lg p-2 text-xs text-white" />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-[10px] text-stone-400">Photo Slots Configuration</label>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {['face', 'style', 'input'].map(k => (
                                <div key={k} className="space-y-1.5 border border-white/10 rounded-xl p-2.5 bg-stone-950">
                                    <label className="flex items-center gap-1.5 text-xs text-stone-200 font-bold">
                                        <input type="checkbox" checked={f.inputs.includes(k)} onChange={e => setF({ ...f, inputs: pick(f.inputs, k, e.target.checked) })} className="rounded border-white/20 text-amber-400" /> 
                                        Slot: {k}
                                    </label>
                                    {f.inputs.includes(k) && (
                                        <>
                                            <input value={f.labels[k] || ''} onChange={e => setF({ ...f, labels: { ...f.labels, [k]: e.target.value } })} placeholder="Slot label" className="h-7 w-full bg-stone-900 border border-white/10 rounded px-2 text-[10px] text-white" />
                                            <label className="flex items-center gap-1 text-[10px] text-stone-400">
                                                <input type="checkbox" checked={f.optional.includes(k)} onChange={e => setF({ ...f, optional: pick(f.optional, k, e.target.checked) })} className="rounded border-white/20 text-amber-400" /> 
                                                Optional slot
                                            </label>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => setF(null)} className="h-8 px-3 border border-white/10 bg-stone-800 rounded-lg text-xs font-bold text-stone-300 hover:text-white">Cancel</button>
                        <button type="button" onClick={() => { onSave(row.task_type, f); setF(null); }} className="h-8 px-4 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-black">Save Changes</button>
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
            ? (Array.isArray(f.family_urls) ? f.family_urls : []).map(s => String(s || '').trim())
            : type.extras
                ? (Array.isArray(f.extra_image_urls) ? f.extra_image_urls : String(f.extra_image_urls || '').split('\n')).map(s => String(s || '').trim()).filter(Boolean)
                : null,
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
    // Only complain if prompt explicitly exists in memory and is disabled
    if (!['chat', 'photo_read'].includes(f.task_type) && prompts && prompts[f.task_type] && prompts[f.task_type].enabled === false) {
        p.push('Is kaam ka prompt DB mein band hai (Prompts section dekho)');
    }
    if (caps && caps.kind && type && type.kind && caps.kind !== type.kind) {
        p.push('Is task type ke liye ye model nahi chalega');
    }
    for (const key of (type.inputs || [])) {
        if (!type.optional?.includes(key) && !row[INPUT_COLUMN[key]]) {
            p.push(`${labelFor(type, key)} chahiye`);
        }
    }
    if (type.promptRequired && !row.prompt) p.push('Creative prompt zaroori hai');
    if (type.family && (row.extra_image_urls || []).filter(Boolean).length < 2) {
        p.push('Parivar ki kam se kam 2 photos chahiye');
    }
    if (type.extras && !type.family && (!row.extra_image_urls || row.extra_image_urls.length === 0)) {
        p.push('Kam se kam 1 photo upload karein (1 se 50 photos tak)');
    }
    if (type.output === 'image' && caps && caps.kind === 'image') {
        if (caps.aspects && caps.aspects.length > 0 && row.aspect_ratio && !caps.aspects.includes(row.aspect_ratio)) {
            p.push('Aspect ratio is model mein support nahi');
        }
        if (row.image_size && caps.sizes && caps.sizes.length > 0 && !caps.sizes.includes(row.image_size)) {
            p.push('Size is model mein support nahi');
        }
        if (row.batch_count < 1 || row.batch_count > 10) {
            p.push('Batch 1 se 10 ke beech hona chahiye');
        }
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
    if (!file) throw new Error('File missing hai');
    
    // Tier 1: Try Cloudinary direct raw file upload (supports JPG, PNG, WEBP, HEIC natively)
    try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || 'ml_default');
        const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: fd });
        if (res.ok) {
            const data = await res.json();
            if (data.secure_url) return data.secure_url;
        }
    } catch (e) {
        console.warn('Cloudinary raw upload error, trying compressed upload...', e);
    }

    // Tier 2: Try Cloudinary canvas compressed upload
    try {
        const dataUrl = await compressFile(file);
        const fd = new FormData();
        fd.append('file', dataUrl);
        fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || 'ml_default');
        const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: fd });
        if (res.ok) {
            const data = await res.json();
            if (data.secure_url) return data.secure_url;
        }
    } catch (e) {
        console.warn('Cloudinary compressed upload failed, generating guaranteed instant local data link...', e);
    }

    // Tier 3: Guaranteed instant Base64 Data URL (Never fails, never blocked by CORS/network)
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error('Photo read error'));
        r.readAsDataURL(file);
    });
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

// Mobile-friendly interactive tooltip with tap and hover support
function InfoTip({ text, className = "" }) {
    const [open, setOpen] = useState(false);
    const tipRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handleOutside = (e) => {
            if (tipRef.current && !tipRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', handleOutside);
        return () => document.removeEventListener('pointerdown', handleOutside);
    }, [open]);

    if (!text) return null;
    return (
        <span ref={tipRef} className={`relative inline-flex items-center ml-1 text-slate-400 hover:text-amber-300 ${className}`}>
            <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                className="w-4 h-4 rounded-full bg-white/10 hover:bg-amber-400/20 hover:text-amber-300 flex items-center justify-center text-[10px] font-mono leading-none transition-colors"
                title={text}
                aria-label={text}
            >
                i
            </button>
            {open && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-slate-200 text-xs font-sans font-normal rounded-xl shadow-2xl whitespace-normal z-50 w-56 sm:w-64 text-left leading-relaxed animate-in fade-in zoom-in-95 duration-150">
                    {text}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></span>
                </span>
            )}
        </span>
    );
}

export default function AiStudioAdmin() {
    const [anonKey, setAnonKey] = useState(API_KEY);
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
    const [catalogFilter, setCatalogFilter] = useState('');
    const [toolTypeFilter, setToolTypeFilter] = useState('');
    const [featureFilter, setFeatureFilter] = useState('');
    const [apps, setApps] = useState([]);         // the apps (WearGen, PPP ...)
    const [appTasks, setAppTasks] = useState([]); // which task types each app shows: { app_id, task_type }
    const [familyRoles, setFamilyRoles] = useState([]);   // every family role (also the disabled ones)
    const emptyRole = { role_key: '', label_admin: '', label_customer: '', prompt_text: '' };
    const [newRole, setNewRole] = useState(emptyRole);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showCatalog, setShowCatalog] = useState(true); // Always visible by default
    const [mobileStudioTab, setMobileStudioTab] = useState('studio');
    // ── Tool Builder & Schema Manager State ──
    const EMPTY_TOOL_BUILDER = {
        mode: 'new', // 'new' | 'edit'
        selectedExisting: '',
        task_type: '',
        label: '',
        customer_label: '',
        hint: '',
        output: 'image', // 'image' | 'text'
        category: 'fashion',
        hasFace: true,
        faceLabel: 'Face reference photo',
        faceCheck: true,
        hasStyle: true,
        styleLabel: 'Clothing / Style reference',
        hasInput: false,
        inputLabel: 'Original input photo',
        hasExtras: false,
        perPhoto: false,
        optionalSlots: [],
        hasMaskEdit: false,
        system_text: 'You are an expert commercial fashion photographer and studio retoucher.',
        role_text: 'Generate a high-resolution commercial photograph based on the reference inputs and prompt instructions.',
        negative_text: 'bad anatomy, blurry, distorted face, oversaturated, low quality, artifacts, watermark',
        prompt_required: false,
        angles: 'Front view, Side profile, 45 degree angle, Close-up',
        enabled: true
    };
    const [builderForm, setBuilderForm] = useState(EMPTY_TOOL_BUILDER);
    const [builderSavedMsg, setBuilderSavedMsg] = useState('');
    const [builderSaving, setBuilderSaving] = useState(false);
    const [builderJsonTab, setBuilderJsonTab] = useState('catalog'); // 'catalog' | 'prompt' | 'curl'

    const selectToolToEdit = (selectedType) => {
        const item = catalog.find(c => c.task_type === selectedType);
        if (!item) return;
        const pr = prompts[selectedType] || {};
        setBuilderForm({
            mode: 'edit',
            selectedExisting: selectedType,
            task_type: item.task_type,
            label: item.label || '',
            customer_label: item.customer_label || item.label || '',
            hint: item.hint || '',
            output: item.output || 'image',
            category: getToolCategory(item.task_type),
            hasFace: (item.inputs || []).includes('face'),
            faceLabel: item.labels?.face || 'Face reference',
            faceCheck: !!item.face_check,
            hasStyle: (item.inputs || []).includes('style'),
            styleLabel: item.labels?.style || 'Style reference',
            hasInput: (item.inputs || []).includes('input'),
            inputLabel: item.labels?.input || 'Input photo',
            hasExtras: !!item.extras,
            perPhoto: !!item.per_photo,
            optionalSlots: item.optional || [],
            hasMaskEdit: !!item.edit,
            system_text: pr.system_text || '',
            role_text: pr.role_text || '',
            negative_text: pr.negative_text || '',
            prompt_required: !!item.prompt_required,
            angles: (item.angles || []).join(', '),
            enabled: item.enabled !== false
        });
    };

    const saveToolDefinition = async () => {
        if (!sb || !isAdmin) return;
        const taskType = builderForm.task_type.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        if (!taskType) return setMsg('Tool ID / task_type zaroori hai (e.g. custom_tryon)');
        if (!builderForm.label.trim()) return setMsg('Tool Label / Name zaroori hai');

        setBuilderSaving(true);
        try {
            const inputs = [];
            const labels = {};
            const optional = [];

            if (builderForm.hasFace) {
                inputs.push('face');
                labels.face = builderForm.faceLabel.trim() || 'Face reference';
                if (builderForm.optionalSlots.includes('face')) optional.push('face');
            }
            if (builderForm.hasStyle) {
                inputs.push('style');
                labels.style = builderForm.styleLabel.trim() || 'Style / outfit reference';
                if (builderForm.optionalSlots.includes('style')) optional.push('style');
            }
            if (builderForm.hasInput) {
                inputs.push('input');
                labels.input = builderForm.inputLabel.trim() || 'Input photo';
                if (builderForm.optionalSlots.includes('input')) optional.push('input');
            }

            const anglesList = builderForm.angles ? builderForm.angles.split(',').map(s => s.trim()).filter(Boolean) : null;
            const isExisting = catalog.some(c => c.task_type === taskType);

            // 1. Catalog row
            const catalogRow = {
                task_type: taskType,
                label: builderForm.label.trim(),
                customer_label: builderForm.customer_label.trim() || builderForm.label.trim(),
                hint: builderForm.hint.trim() || null,
                output: builderForm.output,
                inputs,
                labels,
                optional,
                extras: !!builderForm.hasExtras,
                per_photo: !!builderForm.perPhoto,
                prompt_required: !!builderForm.prompt_required,
                face_check: !!builderForm.faceCheck,
                edit: !!builderForm.hasMaskEdit,
                angles: anglesList && anglesList.length ? anglesList : null,
                customer_visible: true,
                enabled: !!builderForm.enabled
            };

            if (isExisting) {
                await sb.from(TABLES.CATALOG).eq('task_type', taskType).update(catalogRow);
            } else {
                const nextSort = (Math.max(...catalog.map(c => c.sort || 0), 0) || 0) + 1;
                await sb.from(TABLES.CATALOG).insert({ ...catalogRow, sort: nextSort });
            }

            // 2. Prompts row
            const promptRow = {
                task_type: taskType,
                system_text: builderForm.system_text.trim(),
                role_text: builderForm.role_text.trim(),
                negative_text: builderForm.negative_text.trim(),
                enabled: !!builderForm.enabled
            };

            const hasPrompt = !!prompts[taskType];
            if (hasPrompt) {
                await sb.from(TABLES.PROMPTS).eq('task_type', taskType).update(promptRow);
            } else {
                await sb.from(TABLES.PROMPTS).insert(promptRow);
            }

            // 3. Tool types mapping row
            const toolRow = {
                task_type: taskType,
                tool: builderForm.output === 'image' ? 'image' : 'chat'
            };
            const hasToolType = toolTypes.some(t => t.task_type === taskType);
            if (hasToolType) {
                await sb.from(TABLES.TOOL_TYPES).eq('task_type', taskType).update(toolRow);
            } else {
                await sb.from(TABLES.TOOL_TYPES).insert(toolRow);
            }

            // 4. Link to weargen app if new
            if (!isExisting) {
                try {
                    await sb.from(TABLES.APP_TASKS).insert({ app_id: 'weargen', task_type: taskType });
                } catch {}
            }

            await loadCatalog();
            await loadConfig();
            setBuilderSavedMsg(`✨ Tool "${builderForm.label}" successfully saved to Database!`);
            setTimeout(() => setBuilderSavedMsg(''), 4000);
        } catch (err) {
            setMsg('Tool save error: ' + err.message);
        } finally {
            setBuilderSaving(false);
        }
    };
 // 'studio' | 'json'
    const [toolSearch, setToolSearch] = useState('');

    const type = typeOf(form.task_type);
    const modelOptions = useMemo(() => Object.keys(MODEL_CAPS).filter(id => capsOf(id).kind === type.kind), [type.kind, models]);
    const caps = capsOf(form.model) || capsOf(modelOptions[0]);
    const row = useMemo(() => rowFromForm(form), [form]);
    const problems = useMemo(() => problemsFor(form, row, prompts), [form, row, prompts]);
    const preview = useMemo(() => requestPreview(row, prompts), [row, prompts]);

    // ── Live JSON & API Integration Inspector State ──
    const [isGenerating, setIsGenerating] = useState(false);
    const [btnFeedback, setBtnFeedback] = useState(null); // { type: 'success' | 'error', message: string }
    const [jsonInspectorTab, setJsonInspectorTab] = useState('payload'); // 'payload' | 'model' | 'curl' | 'response'
    const [copiedJson, setCopiedJson] = useState(false);

    const apiPayload = useMemo(() => {
        return JSON.stringify(row, null, 2);
    }, [row]);

    const modelPayload = useMemo(() => {
        return JSON.stringify(preview, null, 2);
    }, [preview]);

    const curlSnippet = useMemo(() => {
        return `# 1. cURL API Call (MonsterASP / .NET Core):
curl -X POST "${API_URL}/rest/v1/ai_studio_tasks" \\
  -H "apikey: ${anonKey}" \\
  -H "Authorization: Bearer ${anonKey}" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '${JSON.stringify(row, null, 2)}'

// 2. JavaScript / Node.js fetch snippet:
const response = await fetch("${API_URL}/rest/v1/ai_studio_tasks", {
  method: "POST",
  headers: {
    "apikey": "${anonKey}",
    "Authorization": "Bearer ${anonKey}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  },
  body: JSON.stringify(${JSON.stringify(row, null, 2)})
});
const task = await response.json();
console.log("Task Dispatched:", task);`;
    }, [row, anonKey]);

    const sampleResponse = useMemo(() => {
        const isImage = type.output === 'image';
        if (isImage) {
            return JSON.stringify({
                id: 101,
                app_id: form.app_id || 'weargen',
                task_type: form.task_type,
                model: form.model,
                status: "done",
                output_image_url: "https://res.cloudinary.com/draaqjcre/image/upload/v1730000000/generated_output.jpg",
                imgbb_image_urls: [
                    "https://i.ibb.co/example/generated_output.jpg"
                ],
                face_match_score: form.face_image_url ? 88 : null,
                duration_ms: 3850,
                created_at: new Date().toISOString()
            }, null, 2);
        }
        return JSON.stringify({
            id: 102,
            app_id: form.app_id || 'weargen',
            task_type: form.task_type,
            model: form.model,
            status: "done",
            output_text: "Model response text returned here based on prompt and input parameters...",
            duration_ms: 1240,
            created_at: new Date().toISOString()
        }, null, 2);
    }, [form, type]);

    const activeInspectorText = useMemo(() => {
        if (jsonInspectorTab === 'payload') return apiPayload;
        if (jsonInspectorTab === 'model') return modelPayload;
        if (jsonInspectorTab === 'curl') return curlSnippet;
        return sampleResponse;
    }, [jsonInspectorTab, apiPayload, modelPayload, curlSnippet, sampleResponse]);

    const copyToClipboard = (textToCopy) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy);
            } else {
                const ta = document.createElement('textarea');
                ta.value = textToCopy;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            setCopiedJson(true);
            setTimeout(() => setCopiedJson(false), 2000);
        } catch (e) {
            console.error('Copy failed', e);
        }
    };

    // ── Connect and session ──
    const connect = () => {
        if (!anonKey) return setMsg('API key daalo');
        loadApiClient(anonKey).then(client => {
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
        const [cat, apps, links] = await Promise.all([
            sb.from(TABLES.CATALOG).select('*').order('sort'),
            sb.from(TABLES.APPS).select('*').order('sort'),
            sb.from(TABLES.APP_TASKS).select('app_id, task_type')
        ]);
        if (!cat.data) return;
        setCatalog(cat.data);
        setTaskTypes(cat.data);
        if (apps.data) setApps(apps.data);
        if (links.data) setAppTasks(links.data);
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
        const [w, p, _] = await Promise.all([
            sb.from(TABLES.WORKER_LOAD).select('*').order('worker_id'),
            sb.from(TABLES.TASKS).select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            loadLog()
        ]);
        setWorkers(w.data || []);
        setPendingCount(p.count || 0);
    }, [sb, isAdmin]);

    const loadTasks = useCallback(async () => {
        if (!sb || !isAdmin) return;
        let q = sb.from(TABLES.TASKS).select('id, task_type, model, prompt, status, error, worker_id, user_id, output_image_url, output_text, imgbb_image_urls, created_at, priority, attempts').order('id', { ascending: false }).limit(50);
        if (taskFilter !== 'all') q = q.eq('status', taskFilter);
        const { data } = await q;
        setTasks(data || []);
    }, [sb, isAdmin, taskFilter]);

    // Results: one request per tab or page click (no polling)
    const loadResults = async (tab, page) => {
        if (!sb || !isAdmin) return;
        const from = page * RESULT_PAGE;
        const { data, error, count } = await sb.from(TABLES.TASKS)
            .select('id, app_id, task_type, model, status, error, prompt, face_image_url, style_image_url, input_image_url, output_text, output_image_url, output_image_urls, imgbb_image_urls, face_match_score, aspect_ratio, image_size, worker_id, created_at, duration_ms, process_ms', { count: 'exact' })
            .eq('status', tab)
            .order('id', { ascending: false })
            .range(from, from + RESULT_PAGE - 1);
        if (error) return setMsg('Results load error: ' + error.message);
        setResultRows(data || []);
        setResultCounts(prev => ({ ...prev, [tab]: count ?? 0 }));
    };
    const pickResultTab = (tab) => { setResultTab(tab); setResultPage(0); loadResults(tab, 0); };
    const goResultPage = (page) => { setResultPage(page); loadResults(resultTab, page); };

    // Live sync for Admin: Polls latest tasks & results every 2s (simulates realtime chat updates)
    const syncLiveTasks = useCallback(async () => {
        if (!sb || !isAdmin) return;
        try {
            const { data } = await sb.from(TABLES.TASKS)
                .select('id, app_id, task_type, model, status, error, prompt, face_image_url, style_image_url, input_image_url, output_text, output_image_url, output_image_urls, imgbb_image_urls, face_match_score, aspect_ratio, image_size, worker_id, created_at, duration_ms, process_ms')
                .order('id', { ascending: false })
                .limit(20);
            if (data && data.length) {
                setLiveTasks(prev => {
                    const byId = new Map(data.map(d => [d.id, d]));
                    if (prev.length === 0) {
                        return data.slice().reverse();
                    }
                    const updated = prev.map(t => byId.get(t.id) || t);
                    for (const d of data.slice().reverse()) {
                        if (!updated.some(u => u.id === d.id)) {
                            updated.push(d);
                        }
                    }
                    return updated.slice(-30);
                });
                setViewTask(curr => (curr ? data.find(d => d.id === curr.id) || curr : null));
            }
        } catch (err) {
            console.warn('syncLiveTasks error:', err);
        }
    }, [sb, isAdmin]);

    // The Workers screen's task list: loaded when that screen opens or its filter changes
    useEffect(() => {
        screenRef.current = screen;
        if (screen === 'workers') loadTasks();
        if (screen === 'task') syncLiveTasks();
    }, [screen, loadTasks, syncLiveTasks]);

    // Workers and live updates. Task changes reload the task list on screen.
    useEffect(() => {
        if (!sb || !isAdmin) return;
        loadWorkers();
        loadTasks();
        syncLiveTasks();
        const timer = setInterval(() => {
            loadWorkers();
            if (screenRef.current === 'workers') loadTasks();
            if (screenRef.current === 'task') syncLiveTasks();
        }, REFRESH_MS);
        return () => clearInterval(timer);
    }, [sb, isAdmin, loadWorkers, loadTasks, syncLiveTasks]);

    // ── Worker settings (limits, uploads, keys) ──
    const loadConfig = async () => {
        if (!sb || !isAdmin) return;
        const [s, k, m, pr] = await Promise.all([
            sb.from(TABLES.SETTINGS).select('*').eq('id', 1).single(),
            sb.from(TABLES.SECRETS).select('imgbb_api_key, brevo_api_key').eq('id', 1).single(),
            sb.from(TABLES.MODELS).select('*').order('model_id'),
            sb.from(TABLES.PROMPTS).select('*')
        ]);
        if (s.data) setCfg({ ...s.data, imgbb_api_key: k.data?.imgbb_api_key || '', brevo_api_key: k.data?.brevo_api_key || '' });
        setModels(m.data || []);
        setModelCaps(m.data || []);
        setPrompts(Object.fromEntries((pr.data || []).map(r => [r.task_type, r])));
    };

    const saveConfig = async () => {
        if (!cfg.cloudinary_enabled && !cfg.imgbb_enabled) return setMsg('Kam se kam ek upload chalu rakho');
        if (cfg.imgbb_enabled && !cfg.imgbb_api_key) return setMsg('ImgBB chalu hai to ImgBB key bhi daalo');
        const { error: e1 } = await sb.from(TABLES.SETTINGS).update({
            task_concurrency: Number(cfg.task_concurrency),
            gemini_concurrency: Number(cfg.gemini_concurrency),
            photos_per_task_max: Number(cfg.photos_per_task_max),
            worker_recycle_after_tasks: Number(cfg.worker_recycle_after_tasks) || 50,
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
        const files = Array.from(e.target.files || []).slice(0, 50);
        if (!files.length) return;
        setMsg(`${files.length} photos upload ho rahi hain...`);
        try {
            const urls = [];
            for (let i = 0; i < files.length; i++) {
                setMsg(`Uploading ${i + 1}/${files.length} photos...`);
                urls.push(await uploadFile(files[i]));
            }
            const current = form.extra_image_urls.split('\n').map(s => s.trim()).filter(Boolean);
            const combined = [...current, ...urls].slice(0, 50);
            setForm(f => ({ ...f, extra_image_urls: combined.join('\n') }));
            setMsg(`${combined.length} photos successfully upload ho gayi!`);
        } catch (err) {
            setMsg('Upload error: ' + err.message);
        }
    };

    const removeExtraPhoto = (idx) => {
        const current = form.extra_image_urls.split('\n').map(s => s.trim()).filter(Boolean);
        current.splice(idx, 1);
        setForm(f => ({ ...f, extra_image_urls: current.join('\n') }));
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
        if (problems.length) {
            const errText = problems.join(', ');
            setBtnFeedback({ type: 'error', message: errText });
            setMsg('Pehle ye theek karo: ' + errText);
            return;
        }
        setIsGenerating(true);
        setBtnFeedback(null);
        try {
            const { data, error } = await sb.rpc(API.CREATE_TASK, { p_payload: row });
            if (error) {
                const errText = 'Task nahi bana: ' + (error.message || JSON.stringify(error));
                setBtnFeedback({ type: 'error', message: errText });
                setMsg(errText);
                return;
            }
            const taskId = typeof data === 'number' ? data : (data?.[0]?.id || data?.id || (Array.isArray(data) && data[0]) || data);
            const successMsg = `⚡ Task #${taskId} queue mein successfully dispatch ho gaya! Worker ise process karega.`;
            setBtnFeedback({ type: 'success', message: successMsg });
            setMsg(successMsg);

            // Directly inject into liveTasks list so user immediately sees it
            const newTaskObj = {
                id: taskId,
                app_id: row.app_id || 'weargen',
                task_type: row.task_type,
                model: row.model,
                prompt: row.prompt,
                aspect_ratio: row.aspect_ratio,
                image_size: row.image_size,
                status: 'pending',
                created_at: new Date().toISOString(),
                extra_image_urls: row.extra_image_urls,
                face_image_url: row.face_image_url,
                style_image_url: row.style_image_url,
                input_image_url: row.input_image_url
            };
            setLiveTasks(list => [newTaskObj, ...list.filter(x => x.id !== taskId)].slice(0, 50));
            setForm(f => ({ ...f, prompt: '' }));
            setTimeout(syncLiveTasks, 500);
            setTimeout(syncLiveTasks, 2000);
            setTimeout(() => setBtnFeedback(null), 8000);
        } catch (err) {
            const errText = 'Send error: ' + err.message;
            setBtnFeedback({ type: 'error', message: errText });
            setMsg(errText);
        } finally {
            setIsGenerating(false);
        }
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
            <div className="min-h-screen bg-[#07080d] text-slate-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#0b0e17] border border-white/10 rounded-3xl p-8 space-y-5 shadow-2xl text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-stone-950 font-black text-lg flex items-center justify-center mx-auto shadow-lg shadow-amber-400/20">AI</div>
                    <h1 className="text-xl font-extrabold text-white">AI Studio Suite</h1>
                    <p className="text-xs text-stone-400">Connecting to .NET Core Live Backend...</p>
                    <button onClick={connect} className="w-full h-11 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black shadow-lg shadow-amber-400/20 transition-all">Connect Now</button>
                    {msg && <p className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded-lg">{msg}</p>}
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-[#07080d] text-slate-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#0b0e17] border border-white/10 rounded-3xl p-8 space-y-5 shadow-2xl">
                    <div className="text-center space-y-1">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-stone-950 font-black text-lg flex items-center justify-center mx-auto shadow-lg shadow-amber-400/20">AI</div>
                        <h1 className="text-xl font-extrabold text-white pt-2">Admin Portal</h1>
                        <p className="text-xs text-stone-400">Enter your credentials to manage studio and workers</p>
                    </div>
                    <div className="space-y-3">
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@email.com" className="w-full h-11 bg-stone-950 border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-amber-400" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 bg-stone-950 border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-amber-400" />
                        <button onClick={login} className="w-full h-11 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all">
                            <LogIn className="w-4 h-4" /> Sign In to Admin
                        </button>
                    </div>
                    {loginMsg && <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl text-center">{loginMsg}</p>}
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#07080d] text-slate-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#0b0e17] border border-rose-500/30 rounded-3xl p-8 space-y-4 shadow-2xl text-center">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-white">Access Restricted</h2>
                    <p className="text-xs text-stone-400">This account does not have administrator privileges.</p>
                    <button onClick={logout} className="h-10 px-5 bg-stone-900 border border-white/10 rounded-xl text-xs font-bold text-stone-300 hover:text-white transition-all">
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    const allCatalogList = catalog.length ? catalog : Object.entries(TASK_TYPES).map(([k, t]) => ({ task_type: k, label: t.label, output: t.output, inputs: t.inputs }));
    const filteredTools = allCatalogList.filter(t => {
        const cat = getToolCategory(t.task_type);
        const matchesCategory = selectedCategory === 'all' || cat === selectedCategory;
        const matchesSearch = !toolSearch || (t.label || '').toLowerCase().includes(toolSearch.toLowerCase()) || (t.task_type || '').toLowerCase().includes(toolSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#07080d] text-slate-100 font-sans selection:bg-amber-400 selection:text-black">
            {/* ── Top Navigation Bar (Glassmorphism Web App Header) ── */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#090b14]/90 border-b border-white/[0.08] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
                    
                    {/* Brand Logo & API Live Status */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                            <span className="bg-gradient-to-tr from-amber-400 to-amber-200 text-stone-950 px-2 sm:px-2.5 py-1 rounded-xl font-black text-[11px] sm:text-xs tracking-wider shadow-md shadow-amber-400/20">
                                AI STUDIO
                            </span>
                            <span className="text-white font-black text-xs sm:text-sm tracking-tight hidden md:inline">
                                PRO
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full" title="Connected to .NET Core 9 API on MonsterASP">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-[10px] sm:text-[11px] font-mono font-semibold">Live</span>
                        </div>
                    </div>

                    {/* Nav Tabs */}
                    <nav className="flex items-center gap-1 bg-[#0e111c] border border-white/10 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl shadow-inner">
                        {[
                            { id: 'task', label: 'Studio', icon: '🎨' },
                            { id: 'builder', label: 'Tool Builder', icon: '🛠️' },
                            { id: 'tools', label: 'Tools', icon: '⚡' },
                            { id: 'workers', label: 'Workers', icon: '⚙️' },
                            { id: 'features', label: 'Catalog', icon: '📋' }
                        ].map(tab => {
                            const active = screen === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setScreen(tab.id)}
                                    className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all ${
                                        active 
                                            ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20 font-extrabold' 
                                            : 'text-stone-400 hover:text-white'
                                    }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Right User Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-stone-400 text-[11px] font-mono hidden lg:inline max-w-[140px] truncate" title={email}>
                            {email}
                        </span>
                        <button
                            type="button"
                            onClick={logout}
                            className="h-7 sm:h-8 px-2.5 sm:px-3 bg-stone-900 hover:bg-rose-500/20 text-stone-300 hover:text-rose-400 border border-white/10 rounded-lg sm:rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                            title="Sign out"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>

                </div>
            </header>

            {/* Notification message toast */}
            {msg && (
                <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-3">
                    <div className="bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs rounded-xl px-4 py-2.5 flex items-center justify-between shadow-lg">
                        <span>{msg}</span>
                        <button type="button" onClick={() => setMsg('')} className="text-amber-400 hover:text-white font-bold ml-2">✕</button>
                    </div>
                </div>
            )}

            {/* ── Main Container ── */}
            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">

                {/* ══════════════════════════════════════════════════════════════════
                    SCREEN 1: STUDIO (TASK CREATION & REALTIME RESULTS CHAT STREAM)
                   ══════════════════════════════════════════════════════════════════ */}
                {screen === 'task' && (
                    <div className="space-y-4 sm:space-y-6">

                        {/* ── 1. Unified Studio Toolbar & Tool Switcher ── */}
                        <section className="bg-[#0e1320] border border-slate-800/80 rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                
                                {/* Active Tool Spotlight Banner */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-500/5 border border-amber-400/30 flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-inner">
                                        {(TOOL_CATEGORIES.find(c => c.id === getToolCategory(form.task_type)) || TOOL_CATEGORIES[0]).icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
                                                {type.label || form.task_type}
                                            </h2>
                                            <InfoTip text={catalog.find(c => c.task_type === form.task_type)?.hint || 'Select references, model settings and prompt to generate high-resolution commercial images.'} />
                                            <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold shrink-0">
                                                {form.task_type}
                                            </span>
                                            <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50 shrink-0">
                                                {type.output === 'image' ? 'Photo' : 'Text'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xl hidden sm:block">
                                            {catalog.find(c => c.task_type === form.task_type)?.hint || 'Generate commercial photos with exact styling and pose control.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Search Bar & Expand Catalog Trigger */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="relative flex-1 sm:w-60">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={toolSearch} 
                                            onChange={e => {
                                                setToolSearch(e.target.value);
                                                if (e.target.value && !showCatalog) setShowCatalog(true);
                                            }} 
                                            placeholder="Search tools..." 
                                            className="w-full h-8 sm:h-9 pl-8 sm:pl-9 pr-7 bg-[#080b12] border border-slate-700/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                                        />
                                        {toolSearch && (
                                            <button 
                                                type="button" 
                                                onClick={() => setToolSearch('')} 
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowCatalog(!showCatalog)}
                                        className={`h-8 sm:h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                            showCatalog 
                                                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' 
                                                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                                        }`}
                                    >
                                        <SlidersHorizontal className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">{showCatalog ? 'Minimize Tools' : 'Show All Tools'}</span>
                                        <span>({filteredTools.length})</span>
                                        {showCatalog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Expandable Category Filter Pills & Visual Cards */}
                            {showCatalog && (
                                <div className="pt-3.5 border-t border-slate-800/80 space-y-3">
                                    {/* Category Filter Pills */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                        {TOOL_CATEGORIES.map(cat => {
                                            const count = cat.id === 'all' 
                                                ? allCatalogList.length
                                                : allCatalogList.filter(c => getToolCategory(c.task_type) === cat.id).length;
                                            const active = selectedCategory === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setSelectedCategory(cat.id)}
                                                    className={`whitespace-nowrap px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                        active 
                                                            ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' 
                                                            : 'bg-[#080b12] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                                                    }`}
                                                >
                                                    <span>{cat.icon}</span>
                                                    <span>{cat.label}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${active ? 'bg-black/20 text-black font-bold' : 'bg-white/5 text-slate-500'}`}>
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Visual Tool Cards Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                                        {filteredTools.map(t => {
                                            const isSelected = form.task_type === t.task_type;
                                            const category = getToolCategory(t.task_type);
                                            const catObj = TOOL_CATEGORIES.find(c => c.id === category) || TOOL_CATEGORIES[0];
                                            return (
                                                <button
                                                    key={t.task_type}
                                                    type="button"
                                                    onClick={() => changeTaskType(t.task_type)}
                                                    className={`p-2.5 sm:p-3 rounded-xl text-left border transition-all flex flex-col justify-between space-y-2 relative overflow-hidden group ${
                                                        isSelected 
                                                            ? 'bg-amber-400/15 border-amber-400 text-white shadow-md shadow-amber-400/10 ring-1 ring-amber-400/40' 
                                                            : 'bg-[#080b12] hover:bg-slate-800/80 border-slate-800/80 text-slate-300 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="text-lg sm:text-xl">{catObj.icon}</span>
                                                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                                            isSelected ? 'bg-amber-400 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-400'
                                                        }`}>
                                                            {t.output === 'image' ? 'Photo' : 'Text'}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs font-bold line-clamp-2 leading-tight ${isSelected ? 'text-amber-300' : 'text-slate-200 group-hover:text-white'}`}>
                                                        {t.label}
                                                    </p>
                                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 border-t border-white/5 w-full">
                                                        <span>{t.inputs?.length ? `${t.inputs.length} slots` : 'Prompt'}</span>
                                                        {isSelected ? (
                                                            <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                                                <Check className="w-3 h-3" /> Active
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-600 group-hover:text-slate-400">Select →</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Mobile View Switcher (lg:hidden): Switch between Creation Form and Live API JSON */}
                        <div className="flex lg:hidden items-center justify-center p-1 bg-[#0e1320] border border-slate-800 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setMobileStudioTab('studio')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                    mobileStudioTab === 'studio'
                                        ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Studio Form</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileStudioTab('json')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                    mobileStudioTab === 'json'
                                        ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Code className="w-3.5 h-3.5" />
                                <span>API & JSON</span>
                            </button>
                        </div>

                        {/* ── 2. Interactive Studio Workbench (Creation Console + Live JSON API Inspector) ── */}
                        <div className="grid gap-4 sm:gap-6 lg:grid-cols-12 items-start">
                            
                            {/* LEFT COLUMN (7 Cols): Creation Console & Inputs */}
                            <section className={`lg:col-span-7 bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xl ${
                                mobileStudioTab === 'studio' ? 'block' : 'hidden lg:block'
                            }`}>
                                
                                {/* Section Header: Model & Settings */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                                            <span>AI Engine Model</span>
                                            <InfoTip text="Select Gemini model for generation. 2.5 Flash offers high speed, preview models support advanced image editing." />
                                        </label>
                                        <span className="text-[10px] font-mono text-slate-400">{modelOptions.length} models</span>
                                    </div>
                                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
                                        {modelOptions.map(m => {
                                            const active = form.model === m;
                                            const c = capsOf(m);
                                            return (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => changeModel(m)}
                                                    className={`p-2.5 rounded-xl text-left border transition-all ${
                                                        active 
                                                            ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20 border-amber-300' 
                                                            : 'bg-[#080b12] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <p className="text-xs font-bold leading-tight">{c.label || m}</p>
                                                    <p className={`text-[10px] font-mono truncate ${active ? 'text-slate-800' : 'text-slate-500'}`}>{m}</p>
                                                    <div className="flex gap-1 mt-1 text-[9px] font-mono">
                                                        {c.sizes?.length ? <span className={active ? 'text-slate-900 font-extrabold' : 'text-amber-400'}>{c.sizes.join(', ')}</span> : null}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Aspect Ratio & Batch Settings */}
                                {caps.kind === 'image' && (
                                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 bg-[#080b12] border border-slate-800 p-3 sm:p-3.5 rounded-xl">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                                                Aspect Ratio
                                                <InfoTip text="1:1 Square, 4:5 Portrait (Instagram/E-com), 9:16 Fullscreen Reel/Story, 16:9 Banner" />
                                            </label>
                                            <div className="flex flex-wrap gap-1">
                                                {caps.aspects.map(a => (
                                                    <button
                                                        key={a}
                                                        type="button"
                                                        onClick={() => setForm({ ...form, aspect_ratio: a })}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                                                            form.aspect_ratio === a 
                                                                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm' 
                                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                                        }`}
                                                    >
                                                        {a}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                                                Resolution
                                                <InfoTip text="Output resolution: 1K (Standard) or 2K (High-Definition commercial quality)" />
                                            </label>
                                            <select 
                                                value={form.image_size} 
                                                onChange={e => setForm({ ...form, image_size: e.target.value })} 
                                                disabled={!caps.sizes.length} 
                                                className="h-8 w-full bg-slate-900 border border-slate-800 rounded-lg px-2 text-xs text-slate-200 font-mono disabled:opacity-40 focus:outline-none focus:border-amber-400"
                                            >
                                                {(caps.sizes.length ? caps.sizes : ['']).map(s => <option key={s} value={s}>{s || 'Default'}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                                                Batch Count
                                                <InfoTip text="Number of images to generate concurrently (1-4 photos)" />
                                            </label>
                                            <input 
                                                type="number" 
                                                min={1} 
                                                max={10} 
                                                value={form.batch_count} 
                                                onChange={e => setForm({ ...form, batch_count: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })} 
                                                className="h-8 w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400" 
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Dedicated Angle / Pose Chips (for Suit Studio, 5-Pose Combo, Pose Change) */}
                                {type.angles && type.angles.length > 0 && (
                                    <div className="space-y-2 bg-[#080b12] border border-amber-400/25 p-3 sm:p-3.5 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-amber-300 flex items-center gap-1">
                                                <span>📸 Preset Angles & Poses</span>
                                                <InfoTip text="Click any preset pose/angle chip to automatically insert into your prompt" />
                                            </label>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {type.angles.map(ang => (
                                                <button
                                                    key={ang}
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, prompt: f.prompt ? `${f.prompt}, ${ang}` : ang }))}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-400 hover:text-slate-950 text-slate-300 text-xs font-semibold border border-slate-800 transition-all text-left"
                                                >
                                                    + {ang.split('(')[0].trim()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Visual Reference Image Upload Dropzones */}
                                <div className="space-y-2.5">
                                    <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                                        <span className="flex items-center gap-1">
                                            Reference Photos
                                            <InfoTip text="Upload clear reference photos or paste direct public URLs (Cloudinary, ImgBB, etc.)" />
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-mono">
                                            {type.inputs.length === 0 ? 'No references needed' : `${type.inputs.length} slots`}
                                        </span>
                                    </label>

                                    <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
                                        {type.inputs.map(key => {
                                            const col = INPUT_COLUMN[key];
                                            const val = form[col];
                                            const label = labelFor(type, key);
                                            const isOpt = type.optional?.includes(key);

                                            if (type.edit && key === 'style') {
                                                return <MaskBlock key={key} label={label} photoUrl={form.face_image_url} maskUrl={form.style_image_url} onSave={saveMask} />;
                                            }

                                            return (
                                                <div key={key} className="bg-[#080b12] border border-slate-800 rounded-xl p-3 space-y-2 relative overflow-hidden group">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-slate-200 flex items-center gap-1">
                                                            {label}
                                                            <InfoTip text={`Reference photo for ${label.toLowerCase()}`} />
                                                        </span>
                                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isOpt ? 'text-slate-500 bg-slate-800' : 'text-amber-400 bg-amber-400/10 font-bold border border-amber-400/20'}`}>
                                                            {isOpt ? 'Optional' : 'Required'}
                                                        </span>
                                                    </div>

                                                    {val ? (
                                                        <div className="space-y-2">
                                                            <div className="relative rounded-lg overflow-hidden bg-black/60 border border-slate-800 h-24 sm:h-28 flex items-center justify-center">
                                                                <img src={val} alt={label} className="h-full w-full object-contain" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setForm({ ...form, [col]: '' })}
                                                                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/80 hover:bg-rose-500 text-white transition-colors"
                                                                    title="Remove photo"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <input 
                                                                value={val} 
                                                                onChange={e => setForm({ ...form, [col]: e.target.value })} 
                                                                placeholder="Photo URL" 
                                                                className="h-7 w-full bg-slate-900 border border-slate-800 rounded px-2 text-[11px] text-slate-300 font-mono truncate focus:outline-none focus:border-amber-400" 
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="border border-dashed border-slate-700/80 rounded-xl p-3 text-center space-y-1.5 hover:border-amber-400/50 transition-colors bg-slate-900/30">
                                                            <Upload className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-slate-500" />
                                                            <div className="space-y-0.5">
                                                                <label className="cursor-pointer text-xs font-bold text-amber-400 hover:text-amber-300 block">
                                                                    Upload Photo
                                                                    <input type="file" accept="image/*" className="hidden" onChange={e => pickFile(e, col)} />
                                                                </label>
                                                                <p className="text-[10px] text-slate-500 font-mono">or paste direct image URL</p>
                                                            </div>
                                                            <input 
                                                                value={form[col] || ''} 
                                                                onChange={e => setForm({ ...form, [col]: e.target.value })} 
                                                                placeholder="https://..." 
                                                                className="h-7 w-full bg-slate-900 border border-slate-800 rounded px-2 text-[11px] text-slate-300 font-mono text-center focus:outline-none focus:border-amber-400" 
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Batch Model Photos Multi-Uploader (1 to 50 Photos) */}
                                {type.extras && !type.family && (
                                    <div className="space-y-3 bg-[#080b12] border border-amber-400/25 p-3.5 sm:p-4 rounded-xl">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                                <Upload className="w-4 h-4 text-amber-400" />
                                                <span>Batch Model Photos Upload (1 se 50 Photos)</span>
                                                <InfoTip text="Har model ki photo me se unka pehna hua kapda/outfit extract hoke alag product catalog photo banegi. Ek sath 10, 20 ya 50 photos upload karein." />
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                                    form.extra_image_urls.split('\n').filter(Boolean).length > 0 
                                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                                        : 'bg-white/5 text-slate-400'
                                                }`}>
                                                    {form.extra_image_urls.split('\n').filter(Boolean).length}/50 Photos
                                                </span>
                                                {form.extra_image_urls.split('\n').filter(Boolean).length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm({ ...form, extra_image_urls: '' })}
                                                        className="text-[10px] text-rose-400 hover:text-rose-300 underline font-mono ml-1"
                                                    >
                                                        Clear All
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dropzone with multiple file input */}
                                        <div className="border border-dashed border-amber-400/30 rounded-xl p-4 sm:p-5 text-center space-y-2 hover:border-amber-400/60 transition-colors bg-amber-400/5">
                                            <Upload className="w-6 h-6 mx-auto text-amber-400" />
                                            <div className="space-y-1">
                                                <label className="cursor-pointer text-xs font-bold text-amber-300 hover:text-amber-200 block">
                                                    <span>Click to Select 10, 20 or up to 50 Photos</span>
                                                    <input 
                                                        type="file" 
                                                        multiple 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        onChange={pickExtraFiles} 
                                                    />
                                                </label>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                    Mobile ya computer se saari photos ek sath select karke upload karein
                                                </p>
                                            </div>
                                        </div>

                                        {/* Uploaded Photos Thumbnail Gallery */}
                                        {form.extra_image_urls.split('\n').filter(Boolean).length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                                                    <span>Uploaded Model Photos Queue:</span>
                                                    <span className="text-[10px] text-amber-300 font-mono">Har photo ka alag garment banega</span>
                                                </p>
                                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
                                                    {form.extra_image_urls.split('\n').filter(Boolean).map((url, idx) => (
                                                        <div key={idx} className="relative rounded-lg overflow-hidden bg-black/60 border border-slate-800 aspect-square group">
                                                            <img src={url} alt={`#${idx+1}`} className="w-full h-full object-cover" />
                                                            <span className="absolute bottom-1 left-1 bg-black/80 text-[9px] font-mono font-bold text-amber-300 px-1 rounded">
                                                                #{idx + 1}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeExtraPhoto(idx)}
                                                                className="absolute top-1 right-1 p-0.5 rounded bg-black/80 hover:bg-rose-500 text-white transition-colors opacity-90 group-hover:opacity-100"
                                                                title="Remove photo"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Textarea for direct URLs if preferred */}
                                        <details className="text-[11px] text-slate-400 pt-1">
                                            <summary className="cursor-pointer hover:text-slate-200 font-mono text-[10px]">
                                                Direct image URLs paste karna chahein to click karein (Optional)
                                            </summary>
                                            <textarea
                                                value={form.extra_image_urls}
                                                onChange={e => setForm({ ...form, extra_image_urls: e.target.value })}
                                                rows={3}
                                                placeholder="https://... (ek line me ek photo link)"
                                                className="mt-2 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-400"
                                            />
                                        </details>
                                    </div>
                                )}

                                {/* Family Photo Roles if family task */}
                                {type.family && (
                                    <div className="space-y-2.5 bg-[#080b12] border border-slate-800 p-3.5 rounded-xl">
                                        <p className="text-xs font-bold text-white flex items-center gap-1">
                                            Family Members Slots
                                            <InfoTip text="Upload reference photo for each family role (Father, Mother, Son, Daughter, etc.)" />
                                        </p>
                                        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                                            {FAMILY_ROLES.map((role, i) => (
                                                <div key={role.role_key} className="space-y-1 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                                                    <span className="text-[11px] font-bold text-slate-300">{role.label_admin}</span>
                                                    <div className="flex gap-1.5">
                                                        <input value={form.family_urls[i]} onChange={e => setFamilyUrl(i, e.target.value)} placeholder="Photo link" className="h-7 w-full bg-black/40 border border-slate-800 rounded px-2 text-xs font-mono" />
                                                        <label className="h-7 px-2 flex items-center bg-slate-800 rounded text-xs font-bold cursor-pointer hover:bg-slate-700">
                                                            <Upload className="w-3 h-3" />
                                                            <input type="file" accept="image/*" className="hidden" onChange={e => pickFamilyFile(e, i)} />
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Prompt Input Area */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <label className="font-bold text-slate-200 flex items-center gap-1">
                                            Creative Prompt {type.promptRequired ? <span className="text-amber-400 font-bold">*</span> : <span className="text-slate-500 font-mono">(Opt)</span>}
                                            <InfoTip text="Describe colors, lighting, studio background, pose specifics, and clothing details." />
                                        </label>
                                        <span className="text-[11px] text-slate-500 font-mono">{form.prompt.length} chars</span>
                                    </div>
                                    <textarea 
                                        value={form.prompt} 
                                        onChange={e => setForm({ ...form, prompt: e.target.value })} 
                                        rows={3} 
                                        placeholder={type.promptRequired ? "Describe what to generate, outfit colors, lighting, studio background..." : "Extra styling details, environment, lighting, pose specifics (optional)..."} 
                                        className="w-full bg-[#080b12] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-sans leading-relaxed" 
                                    />
                                </div>

                                {/* Validation Warnings if any */}
                                {problems.length > 0 && (
                                    <div className="bg-amber-400/10 border border-amber-400/25 rounded-xl p-3 space-y-1.5 animate-fadeIn">
                                        <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                            Task dispatch karne ke liye ye zaroori hai:
                                        </p>
                                        <div className="space-y-1 pl-5">
                                            {problems.map((p, i) => (
                                                <p key={i} className="text-xs text-amber-200 list-item list-disc">
                                                    {p}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Inline Success or Error Feedback from recent click */}
                                {btnFeedback && (
                                    <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-lg transition-all animate-fadeIn ${
                                        btnFeedback.type === 'success' 
                                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                                            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            {btnFeedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                                            <span>{btnFeedback.message}</span>
                                        </div>
                                        <button type="button" onClick={() => setBtnFeedback(null)} className="text-xs opacity-70 hover:opacity-100 font-bold ml-2">✕</button>
                                    </div>
                                )}

                                {/* Primary Action Generate Button */}
                                <button 
                                    type="button" 
                                    onClick={sendTask} 
                                    disabled={isGenerating || problems.length > 0}
                                    className={`w-full h-11 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all ${
                                        problems.length > 0 
                                            ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-70 shadow-none' 
                                            : isGenerating 
                                                ? 'bg-amber-400/60 text-slate-900 cursor-wait' 
                                                : 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-amber-400/20 active:scale-98'
                                    }`}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                                            <span>Dispatching Task to Queue...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 text-slate-950" />
                                            <span className="sm:inline hidden">Generate Task & Send to Worker Fleet</span>
                                            <span className="sm:hidden inline">Generate Task ⚡</span>
                                            <ArrowUpRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </section>

                            {/* RIGHT COLUMN (5 Cols): Live JSON Payload & API Integration Console */}
                            <section className={`lg:col-span-5 space-y-4 lg:sticky lg:top-20 ${
                                mobileStudioTab === 'json' ? 'block' : 'hidden lg:block'
                            }`}>
                                <div className="bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4 shadow-xl">
                                    
                                    {/* Header & Copy Button */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                                                <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                                                    Live API & JSON
                                                    <InfoTip text="Dynamic JSON payload that you can directly copy into your React, Node, Python or Mobile apps to call this tool via API." />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                </h2>
                                                <p className="text-[10px] text-slate-400 font-mono hidden sm:block">Updates on every tool click</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(activeInspectorText)}
                                            className="h-7 px-2.5 sm:px-3 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                                            title="Copy active payload to clipboard"
                                        >
                                            {copiedJson ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span className="text-emerald-400 font-mono">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Tab Selector Pills */}
                                    <div className="grid grid-cols-4 gap-1 p-1 bg-[#080b12] border border-slate-800 rounded-lg text-[11px] font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setJsonInspectorTab('payload')}
                                            title="Task creation request body (POST /rest/v1/ai_studio_tasks)"
                                            className={`py-1 rounded-md transition-all text-center ${
                                                jsonInspectorTab === 'payload'
                                                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            Payload
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setJsonInspectorTab('curl')}
                                            title="cURL and JavaScript fetch snippets"
                                            className={`py-1 rounded-md transition-all text-center ${
                                                jsonInspectorTab === 'curl'
                                                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            cURL
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setJsonInspectorTab('model')}
                                            title="Google Gemini direct prompt contents"
                                            className={`py-1 rounded-md transition-all text-center ${
                                                jsonInspectorTab === 'model'
                                                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            Gemini
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setJsonInspectorTab('response')}
                                            title="Sample response format with output image URLs"
                                            className={`py-1 rounded-md transition-all text-center ${
                                                jsonInspectorTab === 'response'
                                                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            Response
                                        </button>
                                    </div>

                                    {/* Endpoint & Active Tool Info */}
                                    <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 bg-[#080b12] border border-slate-800 rounded-lg font-mono text-[10px]">
                                        <span className="flex items-center gap-1.5 text-slate-400 truncate">
                                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[9px]">POST</span>
                                            <span className="text-slate-300 truncate">
                                                {jsonInspectorTab === 'model' ? `${form.model}:generateContent` : '/rest/v1/ai_studio_tasks'}
                                            </span>
                                        </span>
                                        <span className="text-amber-400/90 font-bold shrink-0">{form.task_type}</span>
                                    </div>

                                    {/* Code / JSON Box */}
                                    <div className="relative">
                                        <pre className="font-mono text-[11px] leading-relaxed text-emerald-300 bg-[#080b12] p-3 sm:p-3.5 rounded-xl border border-slate-800 max-h-[380px] sm:max-h-[440px] overflow-auto select-all whitespace-pre-wrap">
                                            {activeInspectorText}
                                        </pre>
                                    </div>

                                    {/* Quick Actions & Guidance */}
                                    <div className="space-y-1.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={sendTask}
                                            className="w-full h-8 sm:h-9 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Test This Payload</span>
                                        </button>
                                    </div>

                                </div>
                            </section>
                        </div>

                        {/* ── 3. Searchable Results History Table (Bottom) ── */}
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-2xl">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-extrabold text-white">Tasks & Results Database History</h2>
                                    <p className="text-xs text-stone-400">Search and audit all completed, processing, and failed tasks</p>
                                </div>
                                <div className="flex gap-1.5">
                                    {[['pending', 'Pending'], ['processing', 'Processing'], ['done', 'Completed'], ['failed', 'Failed']].map(([key, label]) => (
                                        <button 
                                            key={key} 
                                            type="button" 
                                            onClick={() => pickResultTab(key)} 
                                            className={`h-8 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                resultTab === key 
                                                    ? 'bg-amber-400 text-stone-950 border-amber-300 font-black' 
                                                    : 'bg-stone-950 border-white/10 text-stone-400 hover:text-white'
                                            }`}
                                        >
                                            {label}{resultCounts[key] != null ? ` (${resultCounts[key]})` : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="text-left text-stone-400 border-b border-white/10">
                                        <tr>
                                            <th className="p-2.5 font-bold"># ID</th>
                                            <th className="p-2.5 font-bold">App</th>
                                            <th className="p-2.5 font-bold">Task Type</th>
                                            <th className="p-2.5 font-bold">Model</th>
                                            <th className="p-2.5 font-bold">Worker</th>
                                            <th className="p-2.5 font-bold">Duration</th>
                                            <th className="p-2.5 font-bold">Output</th>
                                            <th className="p-2.5 font-bold">Status</th>
                                            <th className="p-2.5 font-bold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-mono">
                                        {resultRows.map(t => (
                                            <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-2.5 text-amber-300 font-bold">#{t.id}</td>
                                                <td className="p-2.5 font-sans font-bold text-sky-300">{apps.find(a => a.app_id === t.app_id)?.label || t.app_id}</td>
                                                <td className="p-2.5 font-sans text-stone-200">{typeOf(t.task_type).label || t.task_type}</td>
                                                <td className="p-2.5 text-stone-400 text-[11px]">{t.model}</td>
                                                <td className="p-2.5 text-stone-400 text-[11px]">{t.worker_id || '—'}</td>
                                                <td className="p-2.5 text-stone-300 text-[11px]">{t.duration_ms != null ? `${(t.duration_ms / 1000).toFixed(1)}s` : '—'}</td>
                                                <td className="p-2.5">
                                                    {t.output_image_url && <a href={t.output_image_url} target="_blank" rel="noreferrer" className="text-sky-300 underline mr-2 font-sans font-semibold">Cloudinary ↗</a>}
                                                    {t.imgbb_image_urls?.[0] && <a href={t.imgbb_image_urls[0]} target="_blank" rel="noreferrer" className="text-emerald-300 underline mr-2 font-sans font-semibold">ImgBB ↗</a>}
                                                    {t.output_text && <span className="text-stone-300 font-sans">{t.output_text.slice(0, 50)}...</span>}
                                                    {!t.output_image_url && !t.imgbb_image_urls?.[0] && !t.output_text && '—'}
                                                </td>
                                                <td className="p-2.5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        t.status === 'done' ? 'text-emerald-300 bg-emerald-500/10' : 
                                                        t.status === 'failed' ? 'text-rose-300 bg-rose-500/10' : 
                                                        'text-amber-300 bg-amber-500/10'
                                                    }`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="p-2.5">
                                                    <button type="button" onClick={() => setViewTask(t)} className="text-amber-400 hover:text-amber-300 font-sans font-bold underline">Inspect</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SCREEN 2: TOOLS & CATALOG MANAGER (ALL 62 COMMERCIAL TOOLS)
                   ══════════════════════════════════════════════════════════════════ */}
                {screen === 'builder' && (
                    <div className="space-y-6">

                        {/* Top Banner & Mode Switcher */}
                        <div className="bg-[#0e1320] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                                        <Wrench className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                                        AI Studio Tool Builder & Schema Manager
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Naya commercial AI photoshoot tool banayein ya puraane tools ke prompts, face check, reference slots aur negative constraints edit karein.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setBuilderForm(EMPTY_TOOL_BUILDER)}
                                    className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                        builderForm.mode === 'new'
                                            ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                    }`}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Create New Tool</span>
                                </button>

                                <div className="relative">
                                    <select
                                        value={builderForm.mode === 'edit' ? builderForm.task_type : ''}
                                        onChange={e => {
                                            if (e.target.value) selectToolToEdit(e.target.value);
                                        }}
                                        className="h-9 bg-[#080b12] border border-slate-700 hover:border-amber-400 text-white text-xs font-bold rounded-xl px-3 focus:outline-none focus:border-amber-400 cursor-pointer"
                                    >
                                        <option value="">✏️ Edit Existing Tool ({catalog.length})...</option>
                                        {catalog.map(c => (
                                            <option key={c.task_type} value={c.task_type}>
                                                {c.label} ({c.task_type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Success toast if saved */}
                        {builderSavedMsg && (
                            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl p-3.5 flex items-center gap-2 shadow-lg animate-in fade-in">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="font-bold">{builderSavedMsg}</span>
                            </div>
                        )}

                        {/* Builder 2-Column Grid */}
                        <div className="grid gap-6 lg:grid-cols-12 items-start">
                            
                            {/* LEFT COLUMN (7 Cols): The Visual Configuration Form */}
                            <div className="lg:col-span-7 bg-[#0e1320] border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
                                
                                {/* Section 1: Basic Identity & Output Format */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                            <span>1. Tool Identity & Output Kind</span>
                                        </h3>
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${builderForm.mode === 'edit' ? 'bg-amber-400/15 text-amber-300 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                                            {builderForm.mode === 'edit' ? `Editing: ${builderForm.task_type}` : 'New Tool Creation'}
                                        </span>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                                <span>Tool ID / Task Type (Slug) *</span>
                                                <InfoTip text="Unique identifier in database (alphanumeric and underscores only, e.g. custom_wedding_shoot)" />
                                            </label>
                                            <input
                                                type="text"
                                                value={builderForm.task_type}
                                                onChange={e => setBuilderForm({ ...builderForm, task_type: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                                placeholder="e.g. bridal_saree_studio"
                                                disabled={builderForm.mode === 'edit'}
                                                className="w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                                <span>Tool Display Name (Admin) *</span>
                                                <InfoTip text="Name shown in Studio tool cards and catalog (e.g. Bridal Saree & Jewelry Studio)" />
                                            </label>
                                            <input
                                                type="text"
                                                value={builderForm.label}
                                                onChange={e => setBuilderForm({ ...builderForm, label: e.target.value })}
                                                placeholder="e.g. Bridal Saree Studio"
                                                className="w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                                <span>Customer Label (App)</span>
                                                <InfoTip text="User-friendly name shown to end customers in mobile/web apps" />
                                            </label>
                                            <input
                                                type="text"
                                                value={builderForm.customer_label}
                                                onChange={e => setBuilderForm({ ...builderForm, customer_label: e.target.value })}
                                                placeholder="e.g. Bridal Photo Shoot"
                                                className="w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                                <span>Output Format *</span>
                                                <InfoTip text="Image = Commercial Photo generation; Text = Description, Tagging or Vision Analysis" />
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setBuilderForm({ ...builderForm, output: 'image' })}
                                                    className={`h-9 rounded-xl text-xs font-bold border transition-all ${
                                                        builderForm.output === 'image'
                                                            ? 'bg-amber-400 text-slate-950 font-extrabold border-amber-300 shadow-sm'
                                                            : 'bg-[#080b12] border-slate-700 text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    🖼️ Image (Photo)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setBuilderForm({ ...builderForm, output: 'text' })}
                                                    className={`h-9 rounded-xl text-xs font-bold border transition-all ${
                                                        builderForm.output === 'text'
                                                            ? 'bg-amber-400 text-slate-950 font-extrabold border-amber-300 shadow-sm'
                                                            : 'bg-[#080b12] border-slate-700 text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    💬 Text / Chat
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                            <span>Short Hint / Guidance</span>
                                            <InfoTip text="Displayed on tool banner to guide users on what this photoshoot creates" />
                                        </label>
                                        <input
                                            type="text"
                                            value={builderForm.hint}
                                            onChange={e => setBuilderForm({ ...builderForm, hint: e.target.value })}
                                            placeholder="e.g. Generates bridal photoshoot in traditional Indian attire with HD jewelry."
                                            className="w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                </div>

                                {/* Section 2: Photo Input Reference Slots */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                            <span>2. Reference Photos Configuration (Input Slots)</span>
                                        </h3>
                                        <span className="text-[10px] font-mono text-slate-400">Configure what images the tool accepts</span>
                                    </div>

                                    {/* Slot 1: Face Reference */}
                                    <div className="bg-[#080b12] border border-slate-800 rounded-xl p-3.5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                                                <input
                                                    type="checkbox"
                                                    checked={builderForm.hasFace}
                                                    onChange={e => setBuilderForm({ ...builderForm, hasFace: e.target.checked })}
                                                    className="w-4 h-4 rounded text-amber-400 bg-slate-900 border-slate-700"
                                                />
                                                <span>Enable Face Reference Slot (`face`)</span>
                                            </label>
                                            <span className="text-[10px] text-amber-400/80 font-mono">IMAGE 1</span>
                                        </div>

                                        {builderForm.hasFace && (
                                            <div className="grid gap-3 sm:grid-cols-3 pt-1">
                                                <div className="sm:col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Slot Label</label>
                                                    <input
                                                        type="text"
                                                        value={builderForm.faceLabel}
                                                        onChange={e => setBuilderForm({ ...builderForm, faceLabel: e.target.value })}
                                                        placeholder="Face reference photo"
                                                        className="w-full h-8 bg-slate-900 border border-slate-700 rounded-lg px-2.5 text-xs text-white"
                                                    />
                                                </div>
                                                <div className="space-y-1.5 pt-1">
                                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={builderForm.faceCheck}
                                                            onChange={e => setBuilderForm({ ...builderForm, faceCheck: e.target.checked })}
                                                            className="w-3.5 h-3.5 rounded text-amber-400"
                                                        />
                                                        <span>Face Match Score &gt;=70</span>
                                                    </label>
                                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={builderForm.optionalSlots.includes('face')}
                                                            onChange={e => {
                                                                const cur = builderForm.optionalSlots;
                                                                setBuilderForm({
                                                                    ...builderForm,
                                                                    optionalSlots: e.target.checked ? [...cur, 'face'] : cur.filter(x => x !== 'face')
                                                                });
                                                            }}
                                                            className="w-3.5 h-3.5 rounded text-amber-400"
                                                        />
                                                        <span>Is Optional?</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Slot 2: Style / Outfit Reference */}
                                    <div className="bg-[#080b12] border border-slate-800 rounded-xl p-3.5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                                                <input
                                                    type="checkbox"
                                                    checked={builderForm.hasStyle}
                                                    onChange={e => setBuilderForm({ ...builderForm, hasStyle: e.target.checked })}
                                                    className="w-4 h-4 rounded text-amber-400 bg-slate-900 border-slate-700"
                                                />
                                                <span>Enable Style / Outfit Reference (`style`)</span>
                                            </label>
                                            <span className="text-[10px] text-amber-400/80 font-mono">IMAGE 2</span>
                                        </div>

                                        {builderForm.hasStyle && (
                                            <div className="grid gap-3 sm:grid-cols-3 pt-1">
                                                <div className="sm:col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Slot Label</label>
                                                    <input
                                                        type="text"
                                                        value={builderForm.styleLabel}
                                                        onChange={e => setBuilderForm({ ...builderForm, styleLabel: e.target.value })}
                                                        placeholder="Style / clothing reference"
                                                        className="w-full h-8 bg-slate-900 border border-slate-700 rounded-lg px-2.5 text-xs text-white"
                                                    />
                                                </div>
                                                <div className="pt-1">
                                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={builderForm.optionalSlots.includes('style')}
                                                            onChange={e => {
                                                                const cur = builderForm.optionalSlots;
                                                                setBuilderForm({
                                                                    ...builderForm,
                                                                    optionalSlots: e.target.checked ? [...cur, 'style'] : cur.filter(x => x !== 'style')
                                                                });
                                                            }}
                                                            className="w-3.5 h-3.5 rounded text-amber-400"
                                                        />
                                                        <span>Is Optional?</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Slot 3: Input Base Photo */}
                                    <div className="bg-[#080b12] border border-slate-800 rounded-xl p-3.5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                                                <input
                                                    type="checkbox"
                                                    checked={builderForm.hasInput}
                                                    onChange={e => setBuilderForm({ ...builderForm, hasInput: e.target.checked })}
                                                    className="w-4 h-4 rounded text-amber-400 bg-slate-900 border-slate-700"
                                                />
                                                <span>Enable Input Base Photo (`input`)</span>
                                            </label>
                                            <span className="text-[10px] text-amber-400/80 font-mono">IMAGE 3</span>
                                        </div>

                                        {builderForm.hasInput && (
                                            <div className="grid gap-3 sm:grid-cols-3 pt-1">
                                                <div className="sm:col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Slot Label</label>
                                                    <input
                                                        type="text"
                                                        value={builderForm.inputLabel}
                                                        onChange={e => setBuilderForm({ ...builderForm, inputLabel: e.target.value })}
                                                        placeholder="Original photo to edit"
                                                        className="w-full h-8 bg-slate-900 border border-slate-700 rounded-lg px-2.5 text-xs text-white"
                                                    />
                                                </div>
                                                <div className="space-y-1.5 pt-1">
                                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={builderForm.hasMaskEdit}
                                                            onChange={e => setBuilderForm({ ...builderForm, hasMaskEdit: e.target.checked })}
                                                            className="w-3.5 h-3.5 rounded text-amber-400"
                                                        />
                                                        <span>Mask / Brush Editor</span>
                                                    </label>
                                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={builderForm.optionalSlots.includes('input')}
                                                            onChange={e => {
                                                                const cur = builderForm.optionalSlots;
                                                                setBuilderForm({
                                                                    ...builderForm,
                                                                    optionalSlots: e.target.checked ? [...cur, 'input'] : cur.filter(x => x !== 'input')
                                                                });
                                                            }}
                                                            className="w-3.5 h-3.5 rounded text-amber-400"
                                                        />
                                                        <span>Is Optional?</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Slot 4: Extra Batch Photos (1 to 50 Photos) */}
                                    <div className="bg-[#080b12] border border-slate-800 rounded-xl p-3.5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                                                <input
                                                    type="checkbox"
                                                    checked={builderForm.hasExtras}
                                                    onChange={e => setBuilderForm({ ...builderForm, hasExtras: e.target.checked })}
                                                    className="w-4 h-4 rounded text-amber-400 bg-slate-900 border-slate-700"
                                                />
                                                <span>Enable Batch Multi-Photo Upload (1 se 50 Photos)</span>
                                            </label>
                                            <span className="text-[10px] text-amber-400/80 font-mono">EXTRAS</span>
                                        </div>
                                        {builderForm.hasExtras && (
                                            <div className="pt-1">
                                                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={builderForm.perPhoto}
                                                        onChange={e => setBuilderForm({ ...builderForm, perPhoto: e.target.checked })}
                                                        className="w-4 h-4 rounded text-amber-400"
                                                    />
                                                    <span className="font-semibold">Batch Per-Photo Execution (One result photo per uploaded photo)</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 3: AI Prompts & Strict Negative Constraints */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                            <span>3. AI Prompts & Strict Constraints (Database Prompts)</span>
                                        </h3>
                                        <span className="text-[10px] font-mono text-slate-400">Controls AI generation behavior</span>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                            <span>System Prompt (AI Persona & High-Level Instructions) *</span>
                                            <InfoTip text="Sets the high-level role for Gemini (e.g. You are an expert commercial fashion photographer and studio retoucher.)" />
                                        </label>
                                        <textarea
                                            value={builderForm.system_text}
                                            onChange={e => setBuilderForm({ ...builderForm, system_text: e.target.value })}
                                            rows={2}
                                            placeholder="System instructions for the AI model..."
                                            className="w-full bg-[#080b12] border border-slate-700 rounded-xl p-2.5 text-xs text-white font-sans focus:outline-none focus:border-amber-400"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                            <span>Role & Execution Prompt (Detailed Generation Directives) *</span>
                                            <InfoTip text="Exact directives for IMAGE 1, IMAGE 2, output lighting, camera lens, background, preservation of fabric, etc." />
                                        </label>
                                        <textarea
                                            value={builderForm.role_text}
                                            onChange={e => setBuilderForm({ ...builderForm, role_text: e.target.value })}
                                            rows={4}
                                            placeholder="Detailed prompt directives on how to process the images and generate the desired output..."
                                            className="w-full bg-[#080b12] border border-slate-700 rounded-xl p-2.5 text-xs text-white font-sans focus:outline-none focus:border-amber-400"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-rose-300 flex items-center gap-1">
                                            <span>Strict Negative Constraints (What AI MUST NEVER Generate)</span>
                                            <InfoTip text="Constraints like: bad anatomy, distorted faces, altered colors, blurry textures, CGI, cartoon" />
                                        </label>
                                        <textarea
                                            value={builderForm.negative_text}
                                            onChange={e => setBuilderForm({ ...builderForm, negative_text: e.target.value })}
                                            rows={2}
                                            placeholder="bad anatomy, blurry, distorted face, oversaturated, low quality, artifacts, watermark"
                                            className="w-full bg-[#080b12] border border-slate-700 rounded-xl p-2.5 text-xs text-rose-200 font-sans focus:outline-none focus:border-rose-400"
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                                <span>Preset Camera Angles / Poses</span>
                                                <InfoTip text="Comma-separated pose/angle tags (e.g. Front view, Side profile, 45 degree, Close-up)" />
                                            </label>
                                            <input
                                                type="text"
                                                value={builderForm.angles}
                                                onChange={e => setBuilderForm({ ...builderForm, angles: e.target.value })}
                                                placeholder="Front view, Side profile, 45 degree angle"
                                                className="w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 pt-6">
                                            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={builderForm.prompt_required}
                                                    onChange={e => setBuilderForm({ ...builderForm, prompt_required: e.target.checked })}
                                                    className="w-4 h-4 rounded text-amber-400"
                                                />
                                                <span>User Prompt Required?</span>
                                            </label>
                                            <label className="flex items-center gap-2 text-xs font-bold text-emerald-400 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={builderForm.enabled}
                                                    onChange={e => setBuilderForm({ ...builderForm, enabled: e.target.checked })}
                                                    className="w-4 h-4 rounded text-emerald-400"
                                                />
                                                <span>Enabled / Live</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={saveToolDefinition}
                                        disabled={builderSaving}
                                        className="w-full h-12 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-98 transition-all disabled:opacity-50"
                                    >
                                        {builderSaving ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Saving Tool to Database...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>Save Tool to Database ({builderForm.mode === 'edit' ? 'Update Existing' : 'Create New'})</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                            </div>

                            {/* RIGHT COLUMN (5 Cols): Live DB Payload & Schema Inspector */}
                            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
                                <div className="bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                                    
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                                                <Code className="w-4 h-4 text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                                                    Live Database Schema Payload
                                                </h3>
                                                <p className="text-[10px] text-slate-400 font-mono">Preview exact rows saved to DB</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const payloadToCopy = builderJsonTab === 'catalog' 
                                                    ? JSON.stringify({
                                                        task_type: builderForm.task_type || '<slug>',
                                                        label: builderForm.label,
                                                        customer_label: builderForm.customer_label || builderForm.label,
                                                        hint: builderForm.hint,
                                                        output: builderForm.output,
                                                        inputs: [builderForm.hasFace && 'face', builderForm.hasStyle && 'style', builderForm.hasInput && 'input'].filter(Boolean),
                                                        labels: {
                                                            ...(builderForm.hasFace ? { face: builderForm.faceLabel } : {}),
                                                            ...(builderForm.hasStyle ? { style: builderForm.styleLabel } : {}),
                                                            ...(builderForm.hasInput ? { input: builderForm.inputLabel } : {})
                                                        },
                                                        optional: builderForm.optionalSlots,
                                                        extras: builderForm.hasExtras,
                                                        per_photo: builderForm.perPhoto,
                                                        face_check: builderForm.faceCheck,
                                                        edit: builderForm.hasMaskEdit,
                                                        angles: builderForm.angles ? builderForm.angles.split(',').map(s=>s.trim()).filter(Boolean) : null,
                                                        enabled: builderForm.enabled
                                                    }, null, 2)
                                                    : JSON.stringify({
                                                        task_type: builderForm.task_type || '<slug>',
                                                        system_text: builderForm.system_text,
                                                        role_text: builderForm.role_text,
                                                        negative_text: builderForm.negative_text,
                                                        enabled: builderForm.enabled
                                                    }, null, 2);
                                                copyToClipboard(payloadToCopy);
                                            }}
                                            className="h-7 px-2.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy</span>
                                        </button>
                                    </div>

                                    {/* Tabs */}
                                    <div className="grid grid-cols-2 gap-1 p-1 bg-[#080b12] border border-slate-800 rounded-lg text-[11px] font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setBuilderJsonTab('catalog')}
                                            className={`py-1 rounded-md transition-all text-center ${
                                                builderJsonTab === 'catalog'
                                                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            Catalog Schema
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBuilderJsonTab('prompt')}
                                            className={`py-1 rounded-md transition-all text-center ${
                                                builderJsonTab === 'prompt'
                                                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            Prompt & Strict Schema
                                        </button>
                                    </div>

                                    {/* Code Box */}
                                    <div className="relative">
                                        <pre className="font-mono text-[11px] leading-relaxed text-emerald-300 bg-[#080b12] p-3.5 rounded-xl border border-slate-800 max-h-[460px] overflow-auto select-all whitespace-pre-wrap">
                                            {builderJsonTab === 'catalog' ? (
                                                JSON.stringify({
                                                    task_type: builderForm.task_type || '<tool_slug>',
                                                    label: builderForm.label || '<Display Name>',
                                                    customer_label: builderForm.customer_label || builderForm.label || '<Customer App Name>',
                                                    hint: builderForm.hint || '<Short hint description>',
                                                    output: builderForm.output,
                                                    inputs: [
                                                        builderForm.hasFace && 'face', 
                                                        builderForm.hasStyle && 'style', 
                                                        builderForm.hasInput && 'input'
                                                    ].filter(Boolean),
                                                    labels: {
                                                        ...(builderForm.hasFace ? { face: builderForm.faceLabel } : {}),
                                                        ...(builderForm.hasStyle ? { style: builderForm.styleLabel } : {}),
                                                        ...(builderForm.hasInput ? { input: builderForm.inputLabel } : {})
                                                    },
                                                    optional: builderForm.optionalSlots,
                                                    extras: builderForm.hasExtras,
                                                    per_photo: builderForm.perPhoto,
                                                    face_check: builderForm.faceCheck,
                                                    edit: builderForm.hasMaskEdit,
                                                    angles: builderForm.angles ? builderForm.angles.split(',').map(s=>s.trim()).filter(Boolean) : null,
                                                    enabled: builderForm.enabled
                                                }, null, 2)
                                            ) : (
                                                JSON.stringify({
                                                    task_type: builderForm.task_type || '<tool_slug>',
                                                    system_text: builderForm.system_text,
                                                    role_text: builderForm.role_text,
                                                    negative_text: builderForm.negative_text,
                                                    enabled: builderForm.enabled
                                                }, null, 2)
                                            )}
                                        </pre>
                                    </div>

                                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-normal">
                                        💡 <strong className="text-slate-200">Live Auto-Sync:</strong> Jaise hi aap left form me kisi bhi slot, label ya prompt ko change karte hain, ye JSON schema real-time update hota hai. Save dabate hi ye teeno tables (<code className="text-amber-300">task_catalog</code>, <code className="text-amber-300">prompts</code>, <code className="text-amber-300">tool_types</code>) me insert ya update ho jata hai!
                                    </div>

                                </div>
                            </div>

                        </div>

                    </div>
                )}

                {screen === 'tools' && (
                    <div className="space-y-6">
                        {/* Tools Catalog Section */}
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-2xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                                <div>
                                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-amber-400" />
                                        Task Types Catalog ({catalog.length} Tools in System)
                                    </h2>
                                    <p className="text-xs text-stone-400 mt-0.5">Toggle live status, customer app exposure, and app channel assignments</p>
                                </div>
                                <div className="relative w-full sm:w-72">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input 
                                        type="text" 
                                        value={catalogFilter} 
                                        onChange={e => setCatalogFilter(e.target.value)} 
                                        placeholder="Search tool (suit, combo, saree...)" 
                                        className="w-full h-9 pl-9 pr-3 bg-stone-950 border border-white/10 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400" 
                                    />
                                </div>
                            </div>

                            {/* Category Filter Pills for Catalog */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                                {TOOL_CATEGORIES.map(cat => {
                                    const active = selectedCategory === cat.id;
                                    const count = cat.id === 'all' 
                                        ? catalog.length 
                                        : catalog.filter(c => getToolCategory(c.task_type) === cat.id).length;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                active 
                                                    ? 'bg-amber-400 text-stone-950 font-bold' 
                                                    : 'bg-[#121524] hover:bg-stone-800 text-stone-300 border border-white/5'
                                            }`}
                                        >
                                            <span>{cat.icon}</span>
                                            <span>{cat.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${active ? 'bg-black/20 text-black' : 'bg-white/10 text-stone-400'}`}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Catalog Cards Grid */}
                            <div className="grid gap-3 sm:grid-cols-2 max-h-[700px] overflow-y-auto pr-1">
                                {catalog
                                    .filter(c => (selectedCategory === 'all' || getToolCategory(c.task_type) === selectedCategory) && (!catalogFilter || c.label.toLowerCase().includes(catalogFilter.toLowerCase()) || c.task_type.toLowerCase().includes(catalogFilter.toLowerCase())))
                                    .map(c => <CatalogRow key={c.task_type} row={c} apps={apps} appTasks={appTasks} onToggleApp={toggleAppTask} onToggle={toggleCatalog} onSave={saveCatalogRow} />)}
                            </div>
                        </section>

                        {/* Worker Tool Assignments & Engine Mapping */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Worker Assignments */}
                            <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-amber-400" />
                                    Worker Task Types Assignment
                                </h2>
                                <p className="text-xs text-stone-400">Choose which workers run which task types (or 'Sab kaam' for full coverage)</p>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                    {workerTools.map(w => (
                                        <div key={w.worker_id} className="bg-stone-950 border border-white/10 rounded-2xl p-3.5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-xs font-bold text-amber-300">{w.worker_id}</span>
                                                <label className="flex items-center gap-1.5 text-xs text-stone-200 font-bold cursor-pointer">
                                                    <input type="checkbox" checked={w.task_types === null} onChange={e => toggleWorkerAll(w, e.target.checked)} className="rounded border-white/20 text-amber-400" />
                                                    <span>Sab Kaam (Run All 62)</span>
                                                </label>
                                            </div>
                                            {w.task_types !== null && (
                                                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                                                    {catalog.filter(c => c.enabled).map(c => (
                                                        <label key={c.task_type} className="flex items-center gap-1 text-[11px] text-stone-300 bg-stone-900 px-2 py-1 rounded-lg border border-white/5">
                                                            <input type="checkbox" checked={(w.task_types || []).includes(c.task_type)} onChange={e => toggleWorkerTaskType(w, c.task_type, e.target.checked)} className="rounded border-white/20 text-amber-400" />
                                                            <span>{c.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Task Type to Engine Mapping */}
                            <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <Sliders className="w-4 h-4 text-amber-400" />
                                        Task Engine Mappings ({toolTypes.length})
                                    </h2>
                                    <input value={toolTypeFilter} onChange={e => setToolTypeFilter(e.target.value)} placeholder="Filter mapping..." className="h-8 w-44 bg-stone-950 border border-white/10 rounded-xl px-2.5 text-xs text-white" />
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2 max-h-96 overflow-y-auto pr-1">
                                    {toolTypes
                                        .filter(r => !toolTypeFilter || r.task_type.toLowerCase().includes(toolTypeFilter.toLowerCase()) || r.tool.toLowerCase().includes(toolTypeFilter.toLowerCase()))
                                        .map(r => (
                                            <div key={r.task_type} className="flex items-center justify-between gap-2 bg-stone-950 border border-white/10 rounded-xl p-2.5">
                                                <span className="font-mono text-[11px] text-stone-300 truncate">{r.task_type}</span>
                                                <select value={r.tool} onChange={e => setTaskTool(r.task_type, e.target.value)} className="h-7 bg-stone-900 border border-white/10 rounded-lg px-2 text-xs text-amber-300 font-bold">
                                                    {tools.map(t => <option key={t.tool} value={t.tool}>{t.label}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SCREEN 3: WORKERS FLEET & PROMPTS STUDIO
                   ══════════════════════════════════════════════════════════════════ */}
                {screen === 'workers' && (
                    <div className="space-y-6">
                        {/* Metrics Stat Cards */}
                        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                            {[
                                ['Active Workers Fleet', liveWorkers.length, 'Online', 'text-emerald-400'],
                                ['Tasks In-Flight', workers.reduce((s, w) => s + (w.processing || 0), 0), 'Processing', 'text-sky-400'],
                                ['Total Completed Tasks', workers.reduce((s, w) => s + (w.done || 0), 0), 'Done', 'text-amber-400'],
                                ['Fair Sharing Limit', fairLimit, 'Tasks/Worker', 'text-stone-300']
                            ].map(([title, val, subtitle, col]) => (
                                <div key={title} className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-1 shadow-xl">
                                    <p className="text-xs text-stone-400 font-medium">{title}</p>
                                    <p className={`text-2xl font-black font-mono ${col}`}>{val}</p>
                                    <p className="text-[10px] text-stone-500 font-mono">{subtitle}</p>
                                </div>
                            ))}
                        </div>

                        {/* Workers Fleet Manager */}
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                                <div>
                                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <Users className="w-4 h-4 text-amber-400" />
                                        Worker Fleet Status ({workers.length} registered)
                                    </h2>
                                    <p className="text-xs text-stone-400 mt-0.5">Control live workers, view heartbeats and task load</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => togglePause('all', true)} className="h-8 px-3 rounded-xl border border-white/10 bg-stone-900 hover:bg-stone-800 text-xs font-bold text-stone-300 flex items-center gap-1.5"><Pause className="w-3.5 h-3.5" /> Pause All</button>
                                    <button onClick={() => togglePause('all', false)} className="h-8 px-3 rounded-xl border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 text-xs font-bold text-amber-300 flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Resume All</button>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {workers.map(w => {
                                    const alive = isAlive(w);
                                    return (
                                        <div key={w.worker_id} className="bg-stone-950 border border-white/10 rounded-2xl p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${alive && !w.paused ? 'bg-emerald-400 animate-pulse' : 'bg-stone-600'}`}></span>
                                                    <span className="font-mono text-xs font-bold text-white">{w.worker_id}</span>
                                                </div>
                                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                                    w.paused ? 'bg-amber-500/20 text-amber-300' : alive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-stone-800 text-stone-500'
                                                }`}>
                                                    {w.paused ? 'Paused' : alive ? 'Active' : 'Offline'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-stone-400 pt-2 border-t border-white/5">
                                                <div>Running: <span className="text-white font-bold">{w.processing || 0}</span></div>
                                                <div>Done: <span className="text-white font-bold">{w.done || 0}</span></div>
                                            </div>
                                            <div className="flex items-center justify-between pt-1 text-[11px]">
                                                <button 
                                                    type="button" 
                                                    onClick={() => togglePause(w.worker_id, !w.paused)} 
                                                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                                                        w.paused ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-stone-900 border-white/10 text-stone-300 hover:text-white'
                                                    }`}
                                                >
                                                    {w.paused ? 'Resume Worker' : 'Pause Worker'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Database Prompts Studio */}
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                                <div>
                                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-amber-400" />
                                        Task Prompts Studio (Database System Prompts)
                                    </h2>
                                    <p className="text-xs text-stone-400 mt-0.5">Workers dynamically load these instructions when generating images</p>
                                </div>
                                {promptSaved && <span className="text-xs text-emerald-400 font-bold">{promptSaved}</span>}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-300 mb-1.5">Select Tool to Edit Prompt:</label>
                                    <select 
                                        value={promptType} 
                                        onChange={e => { setPromptType(e.target.value); setPromptSaved(''); }} 
                                        className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs text-white font-semibold"
                                    >
                                        {allCatalogList.filter(c => c.output === 'image').map(c => (
                                            <option key={c.task_type} value={c.task_type}>{c.label} ({c.task_type})</option>
                                        ))}
                                    </select>
                                </div>

                                {!prompts[promptType] ? (
                                    <p className="text-xs text-rose-300 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">Is kaam ka prompt database mein nahi hai.</p>
                                ) : (
                                    <div className="space-y-4 bg-stone-950 p-4 rounded-2xl border border-white/5">
                                        <label className="flex items-center gap-2 text-xs text-stone-200 font-bold cursor-pointer">
                                            <input type="checkbox" checked={prompts[promptType].enabled} onChange={e => setPromptField('enabled', e.target.checked)} className="rounded border-white/20 text-amber-400" /> 
                                            <span>Ye task type active hai</span>
                                        </label>
                                        <div>
                                            <label className="block text-[11px] text-stone-400 mb-1 font-semibold">System Text (Main Instructions)</label>
                                            <textarea rows={3} value={prompts[promptType].system_text} onChange={e => setPromptField('system_text', e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded-xl p-3 text-xs text-white font-mono" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-stone-400 mb-1 font-semibold">Role & Slot Rules (IMAGE 1 / IMAGE 2)</label>
                                            <textarea rows={4} value={prompts[promptType].role_text} onChange={e => setPromptField('role_text', e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded-xl p-3 text-xs text-white font-mono" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-stone-400 mb-1 font-semibold">Negative Constraints</label>
                                            <textarea rows={3} value={prompts[promptType].negative_text ?? ''} onChange={e => setPromptField('negative_text', e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded-xl p-3 text-xs text-white font-mono" />
                                        </div>
                                        <button onClick={savePrompt} className="h-10 px-5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black transition-all">Save Prompt Changes</button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Worker Settings & Security */}
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                                <div>
                                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                                        Global Worker Fleet Settings & Auto-Recycle
                                    </h2>
                                    <p className="text-xs text-stone-400 mt-0.5">Controls concurrency limits, RAM purge thresholds, Cloudinary and ImgBB keys</p>
                                </div>
                                {cfgSaved && <span className="text-xs text-emerald-400 font-bold">{cfgSaved}</span>}
                            </div>

                            {cfg && (
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-3 bg-stone-950 p-4 rounded-2xl border border-white/5">
                                        <p className="text-xs font-bold text-white">Upload Storage Providers</p>
                                        <label className="flex items-center gap-2 text-xs text-stone-300"><input type="checkbox" checked={cfg.cloudinary_enabled} onChange={e => setCfg({ ...cfg, cloudinary_enabled: e.target.checked })} /> Cloudinary Upload</label>
                                        <input value={cfg.cloudinary_cloud_name} onChange={e => setCfg({ ...cfg, cloudinary_cloud_name: e.target.value })} placeholder="Cloud name" className="h-9 w-full bg-stone-900 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                        <input value={cfg.cloudinary_upload_preset} onChange={e => setCfg({ ...cfg, cloudinary_upload_preset: e.target.value })} placeholder="Upload preset" className="h-9 w-full bg-stone-900 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                        <label className="flex items-center gap-2 text-xs text-stone-300 pt-2 border-t border-white/5"><input type="checkbox" checked={cfg.imgbb_enabled} onChange={e => setCfg({ ...cfg, imgbb_enabled: e.target.checked })} /> ImgBB Upload (Lossless Full Res)</label>
                                        <input type="password" value={cfg.imgbb_api_key} onChange={e => setCfg({ ...cfg, imgbb_api_key: e.target.value })} placeholder="ImgBB API Key" className="h-9 w-full bg-stone-900 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    </div>

                                    <div className="space-y-3 bg-stone-950 p-4 rounded-2xl border border-white/5">
                                        <p className="text-xs font-bold text-white">Concurrency & Recycle Limits</p>
                                        {[
                                            ['task_concurrency', 'Worker Task Concurrency (1-50)', 1, 50],
                                            ['gemini_concurrency', 'Gemini Parallel Calls (1-16)', 1, 16],
                                            ['photos_per_task_max', 'Max Photos per Task (1-10)', 1, 10],
                                            ['worker_recycle_after_tasks', 'Worker Auto-Recycle & Purge (Tasks before reload)', 5, 500]
                                        ].map(([key, label, min, max]) => (
                                            <label key={key} className="block text-[11px] text-stone-300 space-y-1">{label}
                                                <input type="number" min={min} max={max} value={cfg[key] ?? (key === 'worker_recycle_after_tasks' ? 50 : min)} onChange={e => setCfg({ ...cfg, [key]: Math.min(max, Math.max(min, Number(e.target.value) || min)) })} className="h-9 w-full bg-stone-900 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button onClick={saveConfig} disabled={!cfg} className="h-10 px-5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black transition-all">Save System Settings</button>
                        </section>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SCREEN 4: PLATFORM SPECS & OVERVIEW
                   ══════════════════════════════════════════════════════════════════ */}
                {screen === 'features' && (
                    <div className="space-y-6">
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Platform Architecture & Features
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                {PLATFORM_FEATURES.map(f => (
                                    <div key={f.title} className="bg-stone-950 border border-white/10 rounded-2xl p-4 space-y-1.5">
                                        <p className="text-xs font-bold text-white">{f.title}</p>
                                        <p className="text-[11px] text-stone-400 leading-relaxed">{f.text}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                    <Grid className="w-4 h-4 text-amber-400" />
                                    Task Types Engine Specs ({catalog.length || Object.keys(TASK_TYPES).length})
                                </h2>
                                <input value={featureFilter} onChange={e => setFeatureFilter(e.target.value)} placeholder="Filter specs..." className="h-8 w-60 bg-stone-950 border border-white/10 rounded-xl px-2.5 text-xs text-white" />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[650px] overflow-y-auto pr-1">
                                {Object.entries(TASK_TYPES)
                                    .filter(([k, t]) => !featureFilter || k.toLowerCase().includes(featureFilter.toLowerCase()) || (t.label || '').toLowerCase().includes(featureFilter.toLowerCase()))
                                    .map(([k, t]) => {
                                        const pr = prompts[k];
                                        return (
                                            <div key={k} className="bg-stone-950 border border-white/10 rounded-2xl p-4 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold text-white">{t.label}</p>
                                                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-stone-400">{t.output}</span>
                                                </div>
                                                <p className="font-mono text-[10px] text-amber-400/80">{k}</p>
                                                <p className="text-[11px] text-stone-400">Inputs: {t.family ? 'Family 6 slots' : t.inputs.length ? t.inputs.join(' + ') : 'Prompt only'}</p>
                                                <div className="text-[10px] text-stone-500 font-mono pt-1 border-t border-white/5 flex justify-between">
                                                    <span>Face Check: {t.faceCheck ? 'Yes' : 'No'}</span>
                                                    <span>Mask: {t.edit ? 'Yes' : 'No'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </section>
                    </div>
                )}
            </main>

            {/* Inspect Task Modal Drawer */}
            {viewTask && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#0b0e17] border border-white/15 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-sm font-extrabold text-white">Task Details #{viewTask.id}</h3>
                            <button type="button" onClick={() => setViewTask(null)} className="h-8 w-8 rounded-full bg-stone-800 text-white font-bold flex items-center justify-center hover:bg-stone-700">✕</button>
                        </div>
                        <div className="space-y-3 text-xs text-stone-300">
                            <div className="grid grid-cols-2 gap-2 bg-stone-950 p-3 rounded-xl font-mono text-[11px]">
                                <div>Status: <span className="text-amber-400 font-bold uppercase">{viewTask.status}</span></div>
                                <div>Worker: <span className="text-white">{viewTask.worker_id || 'None'}</span></div>
                                <div>Task Type: <span className="text-white">{viewTask.task_type}</span></div>
                                <div>Model: <span className="text-white">{viewTask.model}</span></div>
                            </div>
                            {viewTask.prompt && (
                                <div>
                                    <span className="font-bold text-stone-400 block mb-1">Prompt:</span>
                                    <p className="bg-stone-950 p-2.5 rounded-xl border border-white/5 font-sans">{viewTask.prompt}</p>
                                </div>
                            )}
                            {viewTask.output_image_url && (
                                <div>
                                    <span className="font-bold text-sky-400 block mb-1">Output Image (Cloudinary):</span>
                                    <img src={viewTask.output_image_url} alt="" className="max-h-80 rounded-xl mx-auto border border-white/10" />
                                </div>
                            )}
                            {viewTask.imgbb_image_urls?.[0] && (
                                <div>
                                    <span className="font-bold text-emerald-400 block mb-1">Original Full Size (ImgBB):</span>
                                    <a href={viewTask.imgbb_image_urls[0]} target="_blank" rel="noreferrer" className="text-amber-400 underline font-mono text-[11px] block">{viewTask.imgbb_image_urls[0]}</a>
                                </div>
                            )}
                            {viewTask.imgbb_image_urls && viewTask.imgbb_image_urls.length > 1 && (
                                <div className="space-y-2 pt-2 border-t border-white/10">
                                    <span className="font-bold text-amber-300 block">All Extracted Garment Photos ({viewTask.imgbb_image_urls.length} Photos):</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {viewTask.imgbb_image_urls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="block relative rounded-xl overflow-hidden bg-black/60 border border-white/10 group aspect-square hover:border-amber-400 transition-all">
                                                <img src={url} alt={`Garment #${i+1}`} className="w-full h-full object-contain" />
                                                <span className="absolute bottom-1 left-1 bg-black/80 text-[10px] text-amber-300 font-mono px-1 rounded">#{i+1}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {viewTask.output_text && (
                                <div>
                                    <span className="font-bold text-emerald-400 block mb-1">AI Output:</span>
                                    <div className="bg-stone-950 p-3 rounded-xl border border-white/5"><ChatText text={viewTask.output_text} /></div>
                                </div>
                            )}
                            {viewTask.error && (
                                <p className="text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 font-mono text-[11px]">{viewTask.error}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Loads the .NET Core API client
function loadApiClient(anonKey) {
    return Promise.resolve(createClient(API_URL, anonKey));
}
