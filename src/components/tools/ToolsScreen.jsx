import React, { useState } from 'react';
import { Layers, Search } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { TABLES } from '../../api/config';

export function ToolsScreen() {
    const { sb, catalog, apps, appTasks, loadCatalog, setMsg } = useAdmin();
    const [filter, setFilter] = useState('');

    const toggleToolEnabled = async (taskType, current) => {
        const { error } = await sb.from(TABLES.CATALOG).update({
            enabled: !current,
            updated_at: new Date().toISOString()
        }).eq('task_type', taskType);

        if (error) return setMsg('Update error: ' + error.message);
        loadCatalog();
    };

    const toggleAppTask = async (appId, taskType, current) => {
        const req = !current
            ? sb.from(TABLES.APP_TASKS).insert({ app_id: appId, task_type: taskType })
            : sb.from(TABLES.APP_TASKS).delete().eq('app_id', appId).eq('task_type', taskType);

        const { error } = await req;
        if (error) return setMsg('App link error: ' + error.message);
        loadCatalog();
    };

    const filtered = (catalog || []).filter(c => {
        if (!filter) return true;
        const q = filter.toLowerCase();
        return (c.task_type || '').toLowerCase().includes(q) ||
            (c.label || '').toLowerCase().includes(q);
    });

    return (
        <section className="bg-[#0b0e17] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-sm sm:text-base font-extrabold text-white">
                            Tools & Application Links Manager
                        </h2>
                        <p className="text-xs text-stone-400">Enable/disable tools and configure customer app visibility</p>
                    </div>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                        type="text"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Search tool slug or name..."
                        className="w-full h-8 sm:h-9 bg-stone-950 border border-white/10 rounded-xl pl-8 pr-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                    />
                </div>
            </div>

            {/* Tools Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-stone-950/60">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-white/5 text-[11px] font-mono text-stone-400 uppercase bg-white/[0.02]">
                            <th className="p-3">Status</th>
                            <th className="p-3">Tool Name</th>
                            <th className="p-3">Task Type Slug</th>
                            <th className="p-3">Modality</th>
                            <th className="p-3">Linked Apps</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map(c => {
                            return (
                                <tr key={c.task_type} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleToolEnabled(c.task_type, c.enabled)}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                                                c.enabled 
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                            }`}
                                        >
                                            {c.enabled ? 'Enabled' : 'Disabled'}
                                        </button>
                                    </td>
                                    <td className="p-3 font-bold text-white">
                                        {c.label}
                                    </td>
                                    <td className="p-3 font-mono text-[11px] text-amber-400">
                                        {c.task_type}
                                    </td>
                                    <td className="p-3 font-mono text-[11px] text-stone-400 uppercase">
                                        {c.output}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {apps.map(app => {
                                                const isLinked = appTasks.some(l => l.app_id === app.app_id && l.task_type === c.task_type);
                                                return (
                                                    <button
                                                        key={app.app_id}
                                                        type="button"
                                                        onClick={() => toggleAppTask(app.app_id, c.task_type, isLinked)}
                                                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                                                            isLinked 
                                                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                                                                : 'bg-stone-900 text-stone-500 border border-white/5'
                                                        }`}
                                                    >
                                                        {app.name || app.app_id}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default ToolsScreen;
