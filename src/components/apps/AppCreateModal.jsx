import React, { useState } from 'react';
import { X, Plus, Shield, Loader2, Check } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { TABLES } from '../../api/config';

export function AppCreateModal({ isOpen, onClose, onCreated }) {
    const { sb, catalog, loadCatalog, setMsg } = useAdmin();
    const [appId, setAppId] = useState('');
    const [label, setLabel] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [assignAll, setAssignAll] = useState(true);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cleanId = appId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const cleanLabel = label.trim();

        if (!cleanId) return setMsg('App ID / Slug zaroori hai (e.g. myntra_studio)');
        if (!cleanLabel) return setMsg('App Display Label zaroori hai');

        setLoading(true);
        try {
            // 1. Insert into ai_studio_apps
            const { error: appErr } = await sb.from(TABLES.APPS).insert({
                app_id: cleanId,
                label: cleanLabel,
                enabled,
                sort: 50,
                updated_at: new Date().toISOString()
            });

            if (appErr) throw appErr;

            // 2. Optionally assign all tools (Single Batch Insert - Avoids N+1 Query)
            if (assignAll && catalog && catalog.length > 0) {
                const batchRows = catalog.map(tool => ({
                    app_id: cleanId,
                    task_type: tool.task_type
                }));
                try {
                    await sb.from(TABLES.APP_TASKS).insert(batchRows);
                } catch (batchErr) {
                    console.warn('Batch assign warning:', batchErr);
                }
            }

            await loadCatalog();
            setMsg(`✨ App "${cleanLabel}" successfully ban gayi!`);
            if (onCreated) onCreated(cleanId);
            onClose();
        } catch (err) {
            setMsg('App create error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#0e1320] border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold text-white">Create New Client App</h3>
                            <p className="text-[11px] text-slate-400">Deploy a dedicated app workspace (e.g. WearGen, Zara)</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                            App ID / Unique Slug *
                        </label>
                        <input
                            type="text"
                            required
                            value={appId}
                            onChange={e => setAppId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                            placeholder="e.g. zara_studio, myntra_app"
                            className="w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Lowercase alphanumeric and underscores only</span>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                            Display Name / Label *
                        </label>
                        <input
                            type="text"
                            required
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            placeholder="e.g. Zara E-Commerce Studio"
                            className="w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                        />
                    </div>

                    <div className="space-y-2 pt-1 border-t border-slate-800">
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={assignAll}
                                onChange={e => setAssignAll(e.target.checked)}
                                className="rounded border-slate-700 text-amber-400 focus:ring-amber-400"
                            />
                            <span>Assign all {catalog.length} AI Studio tools to this app by default</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={e => setEnabled(e.target.checked)}
                                className="rounded border-slate-700 text-amber-400 focus:ring-amber-400"
                            />
                            <span>Enable app immediately for worker fleet</span>
                        </label>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-9 px-5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-98 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>Create App</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AppCreateModal;
