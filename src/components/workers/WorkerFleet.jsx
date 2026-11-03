import React, { useState } from 'react';
import { Users, Pause, Play, RefreshCw, Trash2, RotateCcw } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { API, TABLES } from '../../api/config';

export function WorkerFleet() {
    const { sb, workers, workerLoad, loadWorkers, setMsg } = useAdmin();
    const [view, setView] = useState('active'); // 'active' | 'offline' | 'all'

    const activeIds = new Set((workerLoad || []).map(l => l.worker_id));

    const filtered = workers.filter(w => {
        const isActive = activeIds.has(w.worker_id);
        if (view === 'active') return isActive;
        if (view === 'offline') return !isActive;
        return true;
    });

    const togglePause = async (workerId, currentPaused) => {
        const { error } = await sb.from(TABLES.WORKERS)
            .update({ paused: !currentPaused })
            .eq('worker_id', workerId);
        if (error) return setMsg('Pause error: ' + error.message);
        loadWorkers();
    };

    const cleanupTasks = async (kind, workerId = null) => {
        const who = workerId ? `Worker ${workerId}` : 'Har worker';
        const what = kind === 'release' ? 'ke phashe tasks wapas pending karna hai' : 'ke failed tasks delete karne hain';
        if (!window.confirm(`${who} ${what}. Pakka karna hai?`)) return;

        const fn = kind === 'release' ? API.RELEASE_TASKS : API.CLEAR_FAILED;
        const { data, error } = await sb.rpc(fn, { p_worker_id: workerId || null });
        if (error) return setMsg('Clean-up error: ' + error.message);
        setMsg(`${data} task ${kind === 'release' ? 'wapas pending mein gaye' : 'delete ho gaye'}`);
        loadWorkers();
    };

    return (
        <section className="bg-[#0b0e17] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl">
            {/* Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                            <span>Worker Fleet Monitor</span>
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                {activeIds.size} Online
                            </span>
                        </h2>
                        <p className="text-xs text-stone-400">Live AI background workers processing Gemini API jobs</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* View Filters */}
                    <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-white/5 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setView('active')}
                            className={`px-3 py-1 rounded-lg transition-all ${view === 'active' ? 'bg-amber-400 text-stone-950 shadow-sm' : 'text-stone-400'}`}
                        >
                            Active ({activeIds.size})
                        </button>
                        <button
                            type="button"
                            onClick={() => setView('all')}
                            className={`px-3 py-1 rounded-lg transition-all ${view === 'all' ? 'bg-amber-400 text-stone-950 shadow-sm' : 'text-stone-400'}`}
                        >
                            All ({workers.length})
                        </button>
                    </div>

                    {/* Global Cleanups */}
                    <button
                        type="button"
                        onClick={() => cleanupTasks('release')}
                        className="h-8 px-2.5 bg-stone-900 hover:bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Release Stuck</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => cleanupTasks('failed')}
                        className="h-8 px-2.5 bg-stone-900 hover:bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Failed</span>
                    </button>
                </div>
            </div>

            {/* Workers Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[500px] overflow-y-auto pr-1">
                {filtered.map(w => {
                    const isActive = activeIds.has(w.worker_id);
                    const load = workerLoad.find(l => l.worker_id === w.worker_id);
                    return (
                        <div
                            key={w.worker_id}
                            className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                isActive ? 'bg-stone-950 border-white/10' : 'bg-stone-950/40 border-white/5 opacity-60'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-stone-600'}`} />
                                    <span className="font-mono text-xs font-extrabold text-white">{w.worker_id}</span>
                                </div>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                    w.paused ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                    {w.paused ? 'Paused' : 'Active'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                                <span>In-flight Tasks:</span>
                                <span className="font-bold text-amber-300">{load?.running || 0}</span>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => togglePause(w.worker_id, w.paused)}
                                    className={`flex-1 h-8 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                        w.paused 
                                            ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30' 
                                            : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                                    }`}
                                >
                                    {w.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                    <span>{w.paused ? 'Resume Worker' : 'Pause Worker'}</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default WorkerFleet;
