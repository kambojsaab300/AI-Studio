import React, { useState } from 'react';
import { Search, CheckSquare, Square, Layers, Sparkles, Filter } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { TOOL_CATEGORIES, getToolCategory } from '../../constants/categories';
import { TABLES } from '../../api/config';

export function AppToolMatrix({ app, onClose }) {
    const { sb, catalog, appTasks, loadCatalog, setMsg } = useAdmin();
    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState('all');
    const [updating, setUpdating] = useState(false);

    const appId = app.app_id;
    const assignedTaskTypes = new Set(
        appTasks.filter(l => l.app_id === appId).map(l => l.task_type)
    );

    const toggleTool = async (taskType, isAssigned) => {
        try {
            if (isAssigned) {
                // Delete link
                await sb.from(TABLES.APP_TASKS)
                    .delete()
                    .eq('app_id', appId)
                    .eq('task_type', taskType);
            } else {
                // Insert link
                await sb.from(TABLES.APP_TASKS)
                    .insert({ app_id: appId, task_type: taskType });
            }
            loadCatalog();
        } catch (err) {
            setMsg('Tool toggle error: ' + err.message);
        }
    };

    const handleAssignAll = async () => {
        setUpdating(true);
        try {
            // Avoids N+1 loop: Batch insert in single network request
            const toAdd = catalog
                .filter(t => !assignedTaskTypes.has(t.task_type))
                .map(t => ({ app_id: appId, task_type: t.task_type }));

            if (toAdd.length > 0) {
                await sb.from(TABLES.APP_TASKS).insert(toAdd);
            }
            loadCatalog();
            setMsg(`Saare ${catalog.length} tools "${app.label}" ko assign kar diye gaye!`);
        } catch (err) {
            setMsg('Assign all error: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleUnassignAll = async () => {
        if (!window.confirm(`Kya aap pakka "${app.label}" se saare tools unassign karna chahte hain?`)) return;
        setUpdating(true);
        try {
            await sb.from(TABLES.APP_TASKS).delete().eq('app_id', appId);
            loadCatalog();
            setMsg(`Saare tools "${app.label}" se unassign ho gaye.`);
        } catch (err) {
            setMsg('Unassign all error: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    const filteredTools = catalog.filter(t => {
        const cat = getToolCategory(t.task_type);
        const matchesCat = selectedCat === 'all' || cat === selectedCat;
        const matchesSearch = !search ||
            (t.label || '').toLowerCase().includes(search.toLowerCase()) ||
            (t.task_type || '').toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
    });

    return (
        <section className="bg-[#0e1320] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl animate-fadeIn">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                <div>
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-amber-400" />
                        <h3 className="text-sm sm:text-base font-extrabold text-white">
                            Tool Permissions for App: <span className="text-amber-300 font-mono">{app.label}</span>
                        </h3>
                        <span className="text-[10px] font-mono font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2 py-0.5 rounded-full">
                            {assignedTaskTypes.size} / {catalog.length} Assigned
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Turn on or off specific tools this client app is allowed to use.
                    </p>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleAssignAll}
                        disabled={updating}
                        className="h-8 px-3 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-bold transition-all disabled:opacity-50"
                    >
                        Assign All ({catalog.length})
                    </button>
                    <button
                        type="button"
                        onClick={handleUnassignAll}
                        disabled={updating}
                        className="h-8 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all disabled:opacity-50"
                    >
                        Unassign All
                    </button>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors ml-2"
                        >
                            Close Matrix
                        </button>
                    )}
                </div>
            </div>

            {/* Filter and Category Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {TOOL_CATEGORIES.map(cat => {
                        const count = cat.id === 'all' 
                            ? catalog.length 
                            : catalog.filter(c => getToolCategory(c.task_type) === cat.id).length;
                        const active = selectedCat === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCat(cat.id)}
                                className={`whitespace-nowrap px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                                    active 
                                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' 
                                        : 'bg-[#080b12] text-slate-400 hover:text-white border border-slate-800'
                                }`}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                                <span className={`text-[10px] px-1 rounded-full font-mono ${active ? 'bg-black/20 text-black font-bold' : 'text-slate-500'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search tool slug..."
                        className="w-full h-8 bg-[#080b12] border border-slate-800 rounded-xl pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                </div>
            </div>

            {/* Tools Grid with Toggle Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                {filteredTools.map(t => {
                    const isAssigned = assignedTaskTypes.has(t.task_type);
                    return (
                        <div
                            key={t.task_type}
                            onClick={() => toggleTool(t.task_type, isAssigned)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                                isAssigned 
                                    ? 'bg-amber-400/10 border-amber-400/40 text-white' 
                                    : 'bg-[#080b12] border-slate-800/80 text-slate-400 hover:border-slate-700'
                            }`}
                        >
                            <div className="pt-0.5 shrink-0">
                                {isAssigned ? (
                                    <CheckSquare className="w-4 h-4 text-amber-400" />
                                ) : (
                                    <Square className="w-4 h-4 text-slate-600" />
                                )}
                            </div>
                            <div className="space-y-0.5 overflow-hidden">
                                <p className={`text-xs font-bold truncate ${isAssigned ? 'text-amber-200' : 'text-slate-300'}`}>
                                    {t.label}
                                </p>
                                <p className="font-mono text-[10px] text-slate-500 truncate">
                                    {t.task_type}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default AppToolMatrix;
