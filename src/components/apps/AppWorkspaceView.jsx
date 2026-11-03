import React, { useState, useMemo } from 'react';
import { Sparkles, Terminal, ArrowUpRight, Check, Search, ExternalLink, RefreshCw } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { GenerationSettings } from '../studio/GenerationSettings';
import { PhotoSlotGrid } from '../studio/PhotoSlotGrid';
import { BatchUploader } from '../studio/BatchUploader';
import { PromptSection } from '../studio/PromptSection';
import { ActionPanel } from '../studio/ActionPanel';
import { TaskModal } from '../history/TaskModal';
import { StatusBadge } from '../common/StatusBadge';
import { EMPTY_FORM, typeOf } from '../../constants/formDefaults';
import { MODEL_CAPS, capsOf } from '../../constants/models';
import { getToolCategory, TOOL_CATEGORIES } from '../../constants/categories';
import { rowFromForm, requestPreview, problemsFor } from '../../utils/taskHelpers';
import { API, TABLES } from '../../api/config';
import { formatDuration, timeAgo } from '../../utils/formatters';
import { createAppService } from '../../api/appService';
import { AppApiModal } from './AppApiModal';

export function AppWorkspaceView({ app }) {
    const { sb, catalog, appTasks, models, prompts, syncLiveTasks, setLiveTasks, setMsg } = useAdmin();

    const appId = app.app_id;
    const appService = useMemo(() => createAppService(sb), [sb]);
    const [apiModalOpen, setApiModalOpen] = useState(false);

    // Filter ONLY the tools assigned to this App
    const assignedTypes = useMemo(() => {
        return new Set(appTasks.filter(l => l.app_id === appId).map(l => l.task_type));
    }, [appTasks, appId]);

    const assignedTools = useMemo(() => {
        return catalog.filter(t => assignedTypes.has(t.task_type));
    }, [catalog, assignedTypes]);

    const [selectedTaskType, setSelectedTaskType] = useState(() => {
        return assignedTools[0]?.task_type || 'image_to_image_prompt';
    });

    const [form, setForm] = useState(() => ({
        ...EMPTY_FORM,
        task_type: assignedTools[0]?.task_type || 'image_to_image_prompt'
    }));

    const [toolSearch, setToolSearch] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [btnFeedback, setBtnFeedback] = useState(null);
    const [selectedHistoryTask, setSelectedHistoryTask] = useState(null);

    const type = typeOf(form.task_type);
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
        setSelectedTaskType(taskType);
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
            setMsg('Pehle ye theek karo: ' + errText);
            return;
        }

        setIsGenerating(true);
        setBtnFeedback(null);
        try {
            const { success, taskId, error } = await appService.createTask(appId, row);
            if (!success || error) {
                const errText = 'API Error: ' + (error?.message || JSON.stringify(error));
                setBtnFeedback({ type: 'error', message: errText });
                setMsg(errText);
                return;
            }

            const successMsg = `⚡ Task #${taskId} dispatch ho gaya for App "${app.label}"!`;
            setBtnFeedback({ type: 'success', message: successMsg });
            setMsg(successMsg);

            // Optimistic injection into live tasks
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

    // Filtered tool buttons in this app
    const displayedTools = assignedTools.filter(t => {
        return !toolSearch || 
            (t.label || '').toLowerCase().includes(toolSearch.toLowerCase()) || 
            (t.task_type || '').toLowerCase().includes(toolSearch.toLowerCase());
    });

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Top Workspace Identity Banner */}
            <div className="bg-gradient-to-r from-amber-400/10 via-[#0e1320] to-[#0e1320] border border-amber-400/30 rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🚀</span>
                        <h2 className="text-base sm:text-lg font-black text-white">
                            {app.label} Workspace
                        </h2>
                        <span className="text-xs font-mono font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                            app_id: {app.app_id}
                        </span>
                    </div>
                    <p className="text-xs text-slate-300">
                        Aap is waqt <span className="text-amber-300 font-bold">{app.label}</span> ke environment mein kaam kar rahe hain. Yahan sirf is app ko assign kiye gaye tools dikhenge aur generate hone wale tasks isi app ke account mein save honge.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setApiModalOpen(true)}
                        className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-400/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title="View API Endpoints and Code Integration"
                    >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>API & SDK ⚡</span>
                    </button>
                    <div className="bg-[#080b12] border border-slate-800 rounded-xl px-3 py-1.5 text-center">
                        <span className="text-[10px] text-slate-400 font-mono block">Assigned Tools</span>
                        <span className="text-sm font-extrabold text-amber-300 font-mono">{assignedTools.length} Active</span>
                    </div>
                </div>
            </div>

            {/* If no tools assigned to this app */}
            {assignedTools.length === 0 ? (
                <div className="bg-[#0e1320] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                    <p className="text-sm text-amber-300 font-bold">Is App ko abhi koi tool assign nahi kiya gaya hai.</p>
                    <p className="text-xs text-slate-400">Upar "Manage Assigned Tools" tab mein ja kar tools assign karein.</p>
                </div>
            ) : (
                /* Tools Grid & Live Execution Engine */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column (5 Cols): Assigned Tools Palette */}
                    <div className="lg:col-span-5 bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                            <span className="text-xs font-bold text-slate-200">
                                Assigned Tools ({assignedTools.length})
                            </span>
                            <span className="text-[10px] text-amber-300 font-mono">Click tool to run</span>
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

                        {/* Tool Cards List */}
                        <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                            {displayedTools.map(t => {
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
                                                ? 'bg-amber-400/15 border-amber-400 text-white shadow-md shadow-amber-400/10' 
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
                            })}
                        </div>
                    </div>

                    {/* Right Column (7 Cols): Execution Form for the Active App Tool */}
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

                        {/* Photo Slots */}
                        <PhotoSlotGrid
                            type={type}
                            form={form}
                            setForm={setForm}
                            onSetMsg={setMsg}
                        />

                        {/* Batch Uploader */}
                        <BatchUploader
                            type={type}
                            form={form}
                            setForm={setForm}
                            onSetMsg={setMsg}
                        />

                        {/* Prompt */}
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
            )}

            {/* API Integration Modal */}
            <AppApiModal
                isOpen={apiModalOpen}
                onClose={() => setApiModalOpen(false)}
                appId={appId}
                appLabel={app.label}
                selectedTool={type}
                samplePayload={row}
            />
        </div>
    );
}

export default AppWorkspaceView;
