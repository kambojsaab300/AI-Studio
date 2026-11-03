import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '../api/client';
import { API_URL, API_KEY, API, TABLES, REFRESH_MS } from '../api/config';
import { setTaskTypes, setFamilyRoles } from '../constants/formDefaults';
import { setModelCaps } from '../constants/models';

const AdminContext = createContext(null);

function parseJwt(token) {
    try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

function getStoredAuthState() {
    try {
        const token = localStorage.getItem('aistudio_token');
        const userStr = localStorage.getItem('aistudio_user');
        if (!token) return { session: null, isAdmin: false, user: null };

        const payload = parseJwt(token);
        // If JWT has expired, remove tokens and return logged out
        if (payload && payload.exp && Date.now() >= payload.exp * 1000) {
            localStorage.removeItem('aistudio_token');
            localStorage.removeItem('aistudio_user');
            return { session: null, isAdmin: false, user: null };
        }

        let user = null;
        if (userStr) {
            try { user = JSON.parse(userStr); } catch {}
        }
        if (!user && payload) {
            user = {
                id: payload.sub || payload.nameid,
                email: payload.email,
                role: payload.role
            };
        }

        const isAdmin = user?.role === 'admin' || user?.is_admin === true || payload?.role === 'admin' || payload?.is_admin === 'true';

        return {
            session: token ? { access_token: token, user } : null,
            isAdmin: !!isAdmin,
            user
        };
    } catch {
        return { session: null, isAdmin: false, user: null };
    }
}

export function AdminProvider({ children }) {
    const initialAuth = useRef(getStoredAuthState()).current;
    const [sb, setSb] = useState(() => createClient(API_URL, API_KEY));
    const [session, setSession] = useState(initialAuth.session);
    const [isAdmin, setIsAdmin] = useState(initialAuth.isAdmin);
    const [authLoading, setAuthLoading] = useState(false);

    // Persist and restore active screen tab on reload without resetting to studio
    const [screen, setScreenState] = useState(() => {
        try {
            const hash = window.location.hash.replace('#', '');
            const valid = ['task', 'apps', 'builder', 'tools', 'workers', 'features'];
            if (valid.includes(hash)) return hash;
            const saved = localStorage.getItem('aistudio_admin_screen');
            if (saved && valid.includes(saved)) return saved;
        } catch {}
        return 'task';
    });

    const setScreen = useCallback((newScreen) => {
        setScreenState(newScreen);
        try {
            localStorage.setItem('aistudio_admin_screen', newScreen);
            window.location.hash = newScreen;
        } catch {}
    }, []);

    const [msg, setMsg] = useState('');

    // Database state
    const [catalog, setCatalog] = useState([]);
    const [apps, setApps] = useState([]);
    const [appTasks, setAppTasks] = useState([]);
    const [models, setModels] = useState([]);
    const [prompts, setPrompts] = useState({});
    const [workers, setWorkers] = useState([]);
    const [workerLoad, setWorkerLoad] = useState([]);
    const [liveTasks, setLiveTasks] = useState([]);
    const [cfg, setCfg] = useState({});

    const screenRef = useRef(screen);
    screenRef.current = screen;

    // 1. Initialize client and listen to auth changes
    useEffect(() => {
        const client = sb || createClient(API_URL, API_KEY);
        if (!sb) setSb(client);

        const { data: sub } = client.auth.onAuthStateChange((_event, sess) => {
            if (sess) {
                const stored = getStoredAuthState();
                setSession(sess);
                setIsAdmin(stored.isAdmin);
                setAuthLoading(false);
            } else {
                setSession(null);
                setIsAdmin(false);
                setAuthLoading(false);
            }
        });

        // Background server verification of JWT token with is_admin endpoint
        if (initialAuth.session) {
            client.rpc(API.IS_ADMIN).then(({ data, error }) => {
                if (error || !data) {
                    client.auth.signOut();
                    setIsAdmin(false);
                    setSession(null);
                } else {
                    setIsAdmin(true);
                }
            }).catch(() => {});
        }

        return () => sub?.subscription?.unsubscribe();
    }, [sb]);

    // 3. Load Catalog & Task Types
    const loadCatalog = useCallback(async () => {
        if (!sb || !isAdmin) return;
        const [cat, appsData, linksData, rolesData] = await Promise.all([
            sb.from(TABLES.CATALOG).select('*').order('sort'),
            sb.from(TABLES.APPS).select('*'),
            sb.from(TABLES.APP_TASKS).select('*'),
            sb.from(TABLES.FAMILY_ROLES).select('*').order('sort_order')
        ]);

        if (cat.data) {
            setCatalog(cat.data);
            setTaskTypes(cat.data);
        }
        if (appsData.data) setApps(appsData.data);
        if (linksData.data) setAppTasks(linksData.data);
        if (rolesData.data) setFamilyRoles(rolesData.data);
    }, [sb, isAdmin]);

    // 4. Load Models, Prompts, Settings
    const loadConfig = useCallback(async () => {
        if (!sb || !isAdmin) return;
        const [s, k, m, pr] = await Promise.all([
            sb.from(TABLES.SETTINGS).select('*').eq('id', 1).single(),
            sb.from(TABLES.SECRETS).select('imgbb_api_key, brevo_api_key').eq('id', 1).single(),
            sb.from(TABLES.MODELS).select('*').order('model_id'),
            sb.from(TABLES.PROMPTS).select('*')
        ]);
        if (s.data) setCfg({ ...s.data, imgbb_api_key: k.data?.imgbb_api_key || '', brevo_api_key: k.data?.brevo_api_key || '' });
        if (m.data) {
            setModels(m.data);
            setModelCaps(m.data);
        }
        if (pr.data) {
            setPrompts(Object.fromEntries(pr.data.map(r => [r.task_type, r])));
        }
    }, [sb, isAdmin]);

    // 5. Load Workers
    const loadWorkers = useCallback(async () => {
        if (!sb || !isAdmin) return;
        const [w, l] = await Promise.all([
            sb.from(TABLES.WORKERS).select('*').order('worker_id'),
            sb.from(TABLES.WORKER_LOAD).select('*')
        ]);
        if (w.data) setWorkers(w.data);
        if (l.data) setWorkerLoad(l.data);
    }, [sb, isAdmin]);

    // 6. Live Sync Tasks (Latest 20 - Lean Column Projection, avoids fetching huge blobs)
    const syncLiveTasks = useCallback(async () => {
        if (!sb || !isAdmin) return;
        try {
            const { data } = await sb.from(TABLES.TASKS)
                .select('id,task_type,model,prompt,aspect_ratio,image_size,status,error,output_image_url,worker_id,app_id,created_at,finished_at,duration_ms,process_ms')
                .order('id', { ascending: false })
                .limit(20);
            if (data && data.length) {
                setLiveTasks(prev => {
                    const byId = new Map(data.map(d => [d.id, d]));
                    if (prev.length === 0) return data.slice().reverse();
                    const updated = prev.map(t => byId.get(t.id) || t);
                    for (const d of data.slice().reverse()) {
                        if (!updated.some(u => u.id === d.id)) updated.push(d);
                    }
                    return updated.slice(-50);
                });
            }
        } catch (err) {
            console.warn('syncLiveTasks error:', err);
        }
    }, [sb, isAdmin]);

    // Initial data fetch on login
    useEffect(() => {
        if (!isAdmin) return;
        loadCatalog();
        loadConfig();
        loadWorkers();
        syncLiveTasks();
    }, [isAdmin, loadCatalog, loadConfig, loadWorkers, syncLiveTasks]);

    // Polling timer
    useEffect(() => {
        if (!sb || !isAdmin) return;
        const timer = setInterval(() => {
            loadWorkers();
            if (screenRef.current === 'task') syncLiveTasks();
        }, REFRESH_MS);
        return () => clearInterval(timer);
    }, [sb, isAdmin, loadWorkers, syncLiveTasks]);

    const value = {
        sb,
        session,
        email: session?.user?.email || 'admin@aistudio.local',
        isAdmin,
        authLoading,
        screen,
        setScreen,
        msg,
        setMsg,
        catalog,
        apps,
        appTasks,
        models,
        prompts,
        setPrompts,
        workers,
        workerLoad,
        liveTasks,
        setLiveTasks,
        cfg,
        setCfg,
        loadCatalog,
        loadConfig,
        loadWorkers,
        syncLiveTasks
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const ctx = useContext(AdminContext);
    if (!ctx) throw new Error('useAdmin must be used within an AdminProvider');
    return ctx;
}
