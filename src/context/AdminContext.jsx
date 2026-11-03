import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '../api/client';
import { API_URL, API_KEY, API, TABLES, REFRESH_MS } from '../api/config';
import { setTaskTypes, setFamilyRoles } from '../constants/formDefaults';
import { setModelCaps } from '../constants/models';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
    const [sb, setSb] = useState(null);
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [screen, setScreen] = useState('task'); // 'task' | 'builder' | 'tools' | 'workers' | 'features'
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
        const client = createClient(API_URL, API_KEY);
        setSb(client);

        client.auth.getSession().then(({ data }) => {
            setSession(data?.session || null);
        });

        const { data: sub } = client.auth.onAuthStateChange((_event, sess) => {
            setSession(sess || null);
        });

        return () => sub?.subscription?.unsubscribe();
    }, []);

    // 2. Check Admin role
    useEffect(() => {
        if (!sb || !session) {
            setIsAdmin(false);
            return;
        }
        sb.rpc(API.IS_ADMIN).then(({ data, error }) => {
            setIsAdmin(!error && !!data);
        });
    }, [sb, session]);

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
