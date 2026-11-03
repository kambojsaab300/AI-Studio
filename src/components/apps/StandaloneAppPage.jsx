import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    Smartphone, Search, Sparkles, ArrowLeft, ExternalLink, RefreshCw, 
    Layers, Download, Image as ImageIcon, Terminal, Check, AlertCircle, Loader2 
} from 'lucide-react';
import { createClient } from '../../api/client';
import { API_URL, API_KEY, API, TABLES, REFRESH_MS } from '../../api/config';
import { GenerationSettings } from '../studio/GenerationSettings';
import { PhotoSlotGrid } from '../studio/PhotoSlotGrid';
import { BatchUploader } from '../studio/BatchUploader';
import { PromptSection } from '../studio/PromptSection';
import { ActionPanel } from '../studio/ActionPanel';
import { TaskModal } from '../history/TaskModal';
import { StatusBadge } from '../common/StatusBadge';
import { EMPTY_FORM, typeOf, setTaskTypes, setFamilyRoles } from '../../constants/formDefaults';
import { MODEL_CAPS, capsOf, setModelCaps } from '../../constants/models';
import { getToolCategory, TOOL_CATEGORIES } from '../../constants/categories';
import { rowFromForm, requestPreview, problemsFor } from '../../utils/taskHelpers';
import { formatDuration, timeAgo } from '../../utils/formatters';
import { createAppService } from '../../api/appService';
import { AppApiModal } from './AppApiModal';

export function StandaloneAppPage({ defaultAppId }) {
    // 1. Determine App ID from URL path or query params
    const appId = useMemo(() => {
        if (defaultAppId) return defaultAppId;
        const params = new URLSearchParams(window.location.search);
        const queryId = params.get('id') || params.get('app_id') || params.get('app');
        if (queryId) return queryId;

        // Path detection: /app/weargen -> "weargen"
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts.length >= 2 && (parts[0] === 'app' || parts[0] === 'apps')) {
            return parts[1];
        }
        return 'weargen';
    }, [defaultAppId]);

    const [sb] = useState(() => createClient(API_URL, API_KEY));
    const appService = useMemo(() => createAppService(sb), [sb]);
    const [app, setApp] = useState(null);
    const [catalog, setCatalog] = useState([]);
    const [assignedTypes, setAssignedTypes] = useState(new Set());
    const [prompts, setPrompts] = useState({});
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [apiModalOpen, setApiModalOpen] = useState(false);

    // Tasks created by this app
    const [appTasksList, setAppTasksList] = useState([]);
    const [selectedHistoryTask, setSelectedHistoryTask] = useState(null);

    // Form state
    const [form, setForm] = useState(EMPTY_FORM);
    const [toolSearch, setToolSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState('all');
    const [isGenerating, setIsGenerating] = useState(false);
    const [btnFeedback, setBtnFeedback] = useState(null);

    // 2. Load App details & Assigned tools
    const loadAppData = useCallback(async () => {
        try {
            const [appRes, catRes, linksRes, prRes, modRes] = await Promise.all([
                sb.from(TABLES.APPS).select('*').eq('app_id', appId).single(),
                sb.from(TABLES.CATALOG).select('*').order('sort'),
                sb.from(TABLES.APP_TASKS).select('*').eq('app_id', appId),
                sb.from(TABLES.PROMPTS).select('*'),
                sb.from(TABLES.MODELS).select('*').order('model_id')
            ]);

            if (appRes.data) setApp(appRes.data);
            if (catRes.data) {
                setCatalog(catRes.data);
                setTaskTypes(catRes.data);
            }
            if (linksRes.data) {
                const assigned = new Set(linksRes.data.map(l => l.task_type));
                setAssignedTypes(assigned);

                // Set initial form task_type from first assigned tool
                const first = catRes.data?.find(t => assigned.has(t.task_type));
                if (first) {
                    setForm(f => ({ ...f, task_type: first.task_type }));
                }
            }
            if (prRes.data) {
                setPrompts(Object.fromEntries(prRes.data.map(r => [r.task_type, r])));
            }
            if (modRes.data) {
                setModels(modRes.data);
                setModelCaps(modRes.data);
            }
        } catch (err) {
            console.warn('loadAppData error:', err);
        } finally {
            setLoading(false);
        }
    }, [sb, appId]);

    // 3. Load Tasks for this specific app (Lean Column Projection)
    const loadTasksForApp = useCallback(async () => {
        try {
            const { data } = await sb.from(TABLES.TASKS)
                .select('id,task_type,model,prompt,aspect_ratio,image_size,status,error,output_image_url,input_image_url,face_image_url,style_image_url,worker_id,app_id,created_at,finished_at,duration_ms,process_ms')
                .eq('app_id', appId)
                .order('id', { ascending: false })
                .limit(20);
            if (data) setAppTasksList(data);
        } catch (err) {
            console.warn('loadTasksForApp error:', err);
        }
    }, [sb, appId]);

    useEffect(() => {
        loadAppData();
        loadTasksForApp();
    }, [loadAppData, loadTasksForApp]);

    // Polling for live tasks updates
    useEffect(() => {
        const timer = setInterval(() => {
            loadTasksForApp();
        }, REFRESH_MS);
        return () => clearInterval(timer);
    }, [loadTasksForApp]);

    // Tools filtered by this App's permissions
    const assignedTools = useMemo(() => {
        return catalog.filter(t => assignedTypes.has(t.task_type));
    }, [catalog, assignedTypes]);

    const displayedTools = useMemo(() => {
        return assignedTools.filter(t => {
            const cat = getToolCategory(t.task_type);
            const matchesCat = selectedCat === 'all' || cat === selectedCat;
            const matchesSearch = !toolSearch || 
                (t.label || '').toLowerCase().includes(toolSearch.toLowerCase()) || 
                (t.task_type || '').toLowerCase().includes(toolSearch.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [assignedTools, selectedCat, toolSearch]);

    const type = typeOf(form.task_type);
    const activeTool = catalog.find(c => c.task_type === form.task_type) || { task_type: form.task_type, label: type.label || form.task_type };
    const modelOptions = useMemo(() => {
        return Object.keys(MODEL_CAPS).filter(id => capsOf(id).kind === type.kind);
    }, [type.kind, models]);

    const caps = capsOf(form.model) || capsOf(modelOptions[0]);
    const row = useMemo(() => {
        const base = rowFromForm(form);
        return {
            ...base,
            app_id: appId // STAMPED WITH THIS APP'S ID
        };
    }, [form, appId]);

    const problems = useMemo(() => problemsFor(form, row, prompts), [form, row, prompts]);
    const preview = useMemo(() => requestPreview(row, prompts), [row, prompts]);

    const handleSelectTool = (taskType) => {
        const t = typeOf(taskType);
        const validModels = Object.keys(MODEL_CAPS).filter(id => capsOf(id).kind === t.kind);
        const model = validModels[0] || 'gemini-3.1-flash-image-preview';
        const c = capsOf(model);

        setForm(prev => ({
            ...prev,
            task_type: taskType,
            model,
            aspect_ratio: c.kind === 'image' ? (c.aspects?.includes(prev.aspect_ratio) ? prev.aspect_ratio : c.aspects?.[0] || '4:5') : prev.aspect_ratio,
            image_size: c.sizes?.length ? (c.sizes?.includes(prev.image_size) ? prev.image_size : c.sizes[1] || c.sizes[0]) : ''
        }));
    };

    const handleSendTask = async () => {
        if (problems.length) {
            const errText = problems.join(', ');
            setBtnFeedback({ type: 'error', message: errText });
            return;
        }

        setIsGenerating(true);
        setBtnFeedback(null);
        try {
            const { success, taskId, error } = await appService.createTask(appId, row);
            if (!success || error) {
                const errText = 'API Error: ' + (error?.message || JSON.stringify(error));
                setBtnFeedback({ type: 'error', message: errText });
                return;
            }

            const successMsg = `⚡ Task #${taskId} queue mein successfully dispatch ho gaya! Worker ise process karega.`;
            setBtnFeedback({ type: 'success', message: successMsg });

            // Optimistic prepend
            const newTaskObj = {
                id: taskId,
                app_id: appId,
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
            setAppTasksList(list => [newTaskObj, ...list.filter(x => x.id !== taskId)].slice(0, 50));
            setForm(f => ({ ...f, prompt: '' }));

            setTimeout(loadTasksForApp, 500);
            setTimeout(loadTasksForApp, 2000);
            setTimeout(() => setBtnFeedback(null), 8000);
        } catch (err) {
            setBtnFeedback({ type: 'error', message: err.message });
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07080d] text-white flex items-center justify-center p-4">
                <div className="flex items-center gap-2.5 text-xs font-mono text-amber-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading App Workspace ({appId})...</span>
                </div>
            </div>
        );
    }

    const appLabel = app?.label || appId.toUpperCase();

    return (
        <div className="min-h-screen bg-[#07080d] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
            {/* Top Standalone Header */}
            <header className="border-b border-slate-800/80 bg-[#080b12]/90 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center shadow-lg shadow-amber-400/20 font-mono font-black text-slate-950 text-base">
                            {appLabel.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">{appLabel}</h1>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30">
                                    app_id: {appId}
                                </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-slate-400">Dedicated AI Client Workspace</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] font-mono font-semibold">Live Fleet Ready</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setApiModalOpen(true)}
                            className="h-8 px-3 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                            title="View API Endpoints, cURL and SDK Integration"
                        >
                            <Terminal className="w-3.5 h-3.5" />
                            <span>API & SDK ⚡</span>
                        </button>
                        <a
                            href="/admin"
                            className="h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-800 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Back to Master Admin</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Workspace Body */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
                {/* Hero Status Card */}
                <div className="bg-gradient-to-r from-amber-400/10 via-[#0e1320] to-[#0e1320] border border-amber-400/30 rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🚀</span>
                            <h2 className="text-base sm:text-lg font-black text-white">
                                {appLabel} Studio Workspace
                            </h2>
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                                {assignedTools.length} Active Tools
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 max-w-2xl">
                            Ye page <span className="text-amber-300 font-bold">{appLabel}</span> ka private dedicated portal hai. Yahan run hone wale saare tasks direct database mein <code className="text-amber-400 bg-black/40 px-1 py-0.5 rounded">app_id: "{appId}"</code> ke sath record honge.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setApiModalOpen(true)}
                            className="h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                            <Terminal className="w-3.5 h-3.5" />
                            <span>View API Snippets</span>
                        </button>
                        <button
                            type="button"
                            onClick={loadTasksForApp}
                            className="h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Refresh App Queue</span>
                        </button>
                    </div>
                </div>

                {/* 2-Column Tool Execution Studio */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column (5 Cols): Assigned Tools Palette */}
                    <div className="lg:col-span-5 bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                            <span className="text-xs font-bold text-slate-200">
                                Assigned Tools ({assignedTools.length})
                            </span>
                            <span className="text-[10px] text-amber-300 font-mono">Select tool to generate</span>
                        </div>

                        {/* Search in assigned tools */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={toolSearch}
                                onChange={e => setToolSearch(e.target.value)}
                                placeholder="Filter tools in this app..."
                                className="w-full h-8 bg-[#080b12] border border-slate-800 rounded-xl pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                            />
                        </div>

                        {/* Category filter pills */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                            {TOOL_CATEGORIES.map(cat => {
                                const count = cat.id === 'all' 
                                    ? assignedTools.length 
                                    : assignedTools.filter(c => getToolCategory(c.task_type) === cat.id).length;
                                if (count === 0 && cat.id !== 'all') return null;
                                const active = selectedCat === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCat(cat.id)}
                                        className={`whitespace-nowrap px-2 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                                            active 
                                                ? 'bg-amber-400 text-slate-950 font-bold' 
                                                : 'bg-[#080b12] text-slate-400 hover:text-white border border-slate-800'
                                        }`}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                        <span className={`text-[9px] px-1 rounded-full font-mono ${active ? 'bg-black/20 text-black font-bold' : 'text-slate-500'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tool Cards List */}
                        <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
                            {displayedTools.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-6 font-mono">No matching tools found.</p>
                            ) : (
                                displayedTools.map(t => {
                                    const isSelected = form.task_type === t.task_type;
                                    const cat = getToolCategory(t.task_type);
                                    const catObj = TOOL_CATEGORIES.find(c => c.id === cat) || TOOL_CATEGORIES[0];
                                    return (
                                        <button
                                            key={t.task_type}
                                            type="button"
                                            onClick={() => handleSelectTool(t.task_type)}
                                            className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                                                isSelected 
                                                    ? 'bg-amber-400/15 border-amber-400 text-white shadow-md shadow-amber-400/10 ring-1 ring-amber-400/40' 
                                                    : 'bg-[#080b12] hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <span className="text-base shrink-0">{catObj.icon}</span>
                                                <div className="truncate">
                                                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                                                        {t.label}
                                                    </p>
                                                    <p className="font-mono text-[10px] text-slate-500 truncate">
                                                        {t.task_type}
                                                    </p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-400/20 px-1.5 py-0.5 rounded shrink-0">
                                                    Active
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column (7 Cols): Form & Task Generator */}
                    <div className="lg:col-span-7 bg-[#0e1320] border border-slate-800/80 rounded-2xl p-5 space-y-5 shadow-xl">
                        {/* Tool Title */}
                        <div className="border-b border-slate-800/80 pb-3 flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-extrabold text-white">
                                        {type.label || form.task_type}
                                    </h3>
                                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                                        {type.output === 'image' ? 'Image Out' : 'Text Out'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    {catalog.find(c => c.task_type === form.task_type)?.hint || 'Configure references and run task directly under this client app.'}
                                </p>
                            </div>
                        </div>

                        {/* Generation Settings */}
                        <GenerationSettings
                            form={form}
                            setForm={setForm}
                            type={type}
                            caps={caps}
                            modelOptions={modelOptions}
                        />

                        {/* Photo Slots (Files + Direct URL) */}
                        <PhotoSlotGrid
                            type={type}
                            form={form}
                            setForm={setForm}
                            onSetMsg={setMsg}
                        />

                        {/* Batch Uploader (1 to 50 Photos) */}
                        <BatchUploader
                            type={type}
                            form={form}
                            setForm={setForm}
                            onSetMsg={setMsg}
                        />

                        {/* Prompt & Angles */}
                        <PromptSection
                            type={type}
                            form={form}
                            setForm={setForm}
                        />

                        {/* Action Panel */}
                        <ActionPanel
                            problems={problems}
                            isGenerating={isGenerating}
                            btnFeedback={btnFeedback}
                            onClearFeedback={() => setBtnFeedback(null)}
                            onSendTask={handleSendTask}
                        />
                    </div>
                </div>

                {/* Bottom App-Specific Tasks History Table */}
                <section className="bg-[#0b0e17] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                        <div>
                            <h3 className="text-sm font-extrabold text-white">
                                {appLabel} Tasks Database Queue & Results
                            </h3>
                            <p className="text-xs text-stone-400">
                                Tasks submitted under app_id: <span className="font-mono text-amber-300 font-bold">{appId}</span>
                            </p>
                        </div>
                        <span className="text-xs font-mono text-stone-400">
                            Showing latest {appTasksList.length} tasks
                        </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-stone-950/60">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-white/5 text-[11px] font-mono text-stone-400 uppercase bg-white/[0.02]">
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Tool</th>
                                    <th className="p-3">Model</th>
                                    <th className="p-3">Output Result</th>
                                    <th className="p-3">Duration</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Inspect</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {appTasksList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-stone-500 font-mono text-xs">
                                            Is app ke under abhi koi task submit nahi hua. Upar form se task generate karein.
                                        </td>
                                    </tr>
                                ) : (
                                    appTasksList.map(t => (
                                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-3 font-mono font-bold text-amber-400">#{t.id}</td>
                                            <td className="p-3 font-bold text-white">{t.task_type}</td>
                                            <td className="p-3 font-mono text-stone-400 text-[11px]">{t.model || '—'}</td>
                                            <td className="p-3">
                                                {t.output_image_url ? (
                                                    <a
                                                        href={t.output_image_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold"
                                                    >
                                                        <ImageIcon className="w-3.5 h-3.5" />
                                                        <span>View Photo</span>
                                                    </a>
                                                ) : t.output_text ? (
                                                    <span className="font-mono text-stone-300 line-clamp-1 max-w-[200px]" title={t.output_text}>
                                                        {t.output_text}
                                                    </span>
                                                ) : (
                                                    <span className="text-stone-600">—</span>
                                                )}
                                            </td>
                                            <td className="p-3 font-mono text-stone-400">{formatDuration(t.duration_ms)}</td>
                                            <td className="p-3"><StatusBadge status={t.status} /></td>
                                            <td className="p-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedHistoryTask(t)}
                                                    className="h-7 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-bold transition-colors"
                                                >
                                                    Inspect
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {/* Inspect Modal */}
            {selectedHistoryTask && (
                <TaskModal task={selectedHistoryTask} onClose={() => setSelectedHistoryTask(null)} />
            )}

            {/* API Integration Modal */}
            <AppApiModal
                isOpen={apiModalOpen}
                onClose={() => setApiModalOpen(false)}
                appId={appId}
                appLabel={appLabel}
                selectedTool={activeTool}
                samplePayload={row}
            />
        </div>
    );
}

export default StandaloneAppPage;
