import React, { useState } from 'react';
import { Grid, Search } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export function CatalogViewer() {
    const { catalog, prompts } = useAdmin();
    const [filter, setFilter] = useState('');

    const filtered = (catalog || []).filter(c => {
        if (!filter) return true;
        const q = filter.toLowerCase();
        return (c.task_type || '').toLowerCase().includes(q) ||
            (c.label || '').toLowerCase().includes(q) ||
            (c.hint || '').toLowerCase().includes(q);
    });

    return (
        <section className="bg-[#0b0e17] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl">
            {/* Header & Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                        <Grid className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-sm sm:text-base font-extrabold text-white">
                            Task Types Engine Specifications ({catalog.length} Tools)
                        </h2>
                        <p className="text-xs text-stone-400">All database registered workflows, slots, and modality parameters</p>
                    </div>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                        type="text"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Filter tools..."
                        className="w-full h-8 sm:h-9 bg-stone-950 border border-white/10 rounded-xl pl-8 pr-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-y-auto pr-1">
                {filtered.map(c => {
                    const pr = prompts[c.task_type];
                    return (
                        <div key={c.task_type} className="bg-stone-950 border border-white/10 rounded-2xl p-4 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">{c.label}</span>
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-stone-400 uppercase">
                                    {c.output}
                                </span>
                            </div>

                            <p className="font-mono text-[11px] text-amber-400/90">{c.task_type}</p>

                            {c.hint && (
                                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                                    {c.hint}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5 text-[10px] font-mono">
                                {(c.inputs || []).map(i => (
                                    <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                        slot:{i}
                                    </span>
                                ))}
                                {c.extras && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-300">
                                        1-50 batch
                                    </span>
                                )}
                                {c.face_check && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                                        face_check
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default CatalogViewer;
