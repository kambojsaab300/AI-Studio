import React, { useState, useMemo } from 'react';
import { Sparkles, Terminal, Sliders } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { ToolCatalogBar } from './ToolCatalogBar';
import { GenerationSettings } from './GenerationSettings';
import { PhotoSlotGrid } from './PhotoSlotGrid';
import { BatchUploader } from './BatchUploader';
import { PromptSection } from './PromptSection';
import { ActionPanel } from './ActionPanel';
import { JsonConsole } from './JsonConsole';
import { TaskHistory } from '../history/TaskHistory';
import { EMPTY_FORM, typeOf } from '../../constants/formDefaults';
import { MODEL_CAPS, capsOf } from '../../constants/models';
import { getToolCategory } from '../../constants/categories';
import { rowFromForm, requestPreview, problemsFor } from '../../utils/taskHelpers';
import { API } from '../../api/config';

export function StudioScreen() {
    const { sb, catalog, models, prompts, syncLiveTasks, setLiveTasks, setMsg } = useAdmin();
    const [form, setForm] = useState(EMPTY_FORM);
    const [mobileTab, setMobileTab] = useState('studio'); // 'studio' | 'json'

    const [isGenerating, setIsGenerating] = useState(false);
    const [btnFeedback, setBtnFeedback] = useState(null);

    const type = typeOf(form.task_type);
    const modelOptions = useMemo(() => {
        return Object.keys(MODEL_CAPS).filter(id => capsOf(id).kind === type.kind);
    }, [type.kind, models]);

    const caps = capsOf(form.model) || capsOf(modelOptions[0]);
    const row = useMemo(() => rowFromForm(form), [form]);
    const problems = useMemo(() => problemsFor(form, row, prompts), [form, row, prompts]);
    const preview = useMemo(() => requestPreview(row, prompts), [row, prompts]);

    const handleSelectTaskType = (taskType) => {
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

            // Immediate optimistic insertion into live list
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

    const category = getToolCategory(form.task_type);

    return (
        <div className="space-y-6">
            {/* 1. Tool Catalog Filter & Selector Bar */}
            <ToolCatalogBar
                catalog={catalog}
                selectedTaskType={form.task_type}
                onSelectTaskType={handleSelectTaskType}
            />

            {/* Mobile Tab Switcher */}
            <div className="flex lg:hidden bg-[#0e1320] p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                    type="button"
                    onClick={() => setMobileTab('studio')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        mobileTab === 'studio' ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm' : 'text-slate-400'
                    }`}
                >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Tool Inputs</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMobileTab('json')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        mobileTab === 'json' ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm' : 'text-slate-400'
                    }`}
                >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Live JSON Payload</span>
                </button>
            </div>

            {/* 2. Main Studio Grid: Left Configuration (7 Cols) + Right Live JSON Console (5 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Tool Configuration & Generation Form */}
                <div className={`lg:col-span-7 bg-[#0e1320] border border-slate-800/80 rounded-2xl p-5 space-y-5 shadow-xl ${
                    mobileTab === 'studio' ? 'block' : 'hidden lg:block'
                }`}>
                    {/* Active Tool Hero Header */}
                    <div className="border-b border-slate-800/80 pb-3.5 flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">✨</span>
                                <h3 className="text-sm sm:text-base font-extrabold text-white">
                                    {type.label || form.task_type}
                                </h3>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 capitalize font-bold">
                                    {category}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                {catalog.find(c => c.task_type === form.task_type)?.hint || 'Configure model parameters, upload references, and send task to fleet.'}
                            </p>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold shrink-0">
                            {type.output === 'image' ? 'Image Out' : 'Text Out'}
                        </span>
                    </div>

                    {/* Model & Generation Settings */}
                    <GenerationSettings
                        form={form}
                        setForm={setForm}
                        type={type}
                        caps={caps}
                        modelOptions={modelOptions}
                    />

                    {/* Dedicated Single Photo Input Slots */}
                    <PhotoSlotGrid
                        type={type}
                        form={form}
                        setForm={setForm}
                        onSetMsg={setMsg}
                    />

                    {/* 1 to 50 Photos Multi-Upload Dropzone & Queue */}
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

                    {/* Action Bar: Validation Warnings, Inline Feedback, Generate Task Button */}
                    <ActionPanel
                        problems={problems}
                        isGenerating={isGenerating}
                        btnFeedback={btnFeedback}
                        onClearFeedback={() => setBtnFeedback(null)}
                        onSendTask={handleSendTask}
                    />
                </div>

                {/* RIGHT COLUMN: Live JSON Payload & API Integration Console */}
                <div className={`lg:col-span-5 lg:sticky lg:top-20 ${
                    mobileTab === 'json' ? 'block' : 'hidden lg:block'
                }`}>
                    <JsonConsole
                        row={row}
                        preview={preview}
                        onSendTask={handleSendTask}
                    />
                </div>
            </div>

            {/* 3. Searchable Results History Table (Bottom) */}
            <TaskHistory />
        </div>
    );
}

export default StudioScreen;
