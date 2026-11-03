import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Eye, Image as ImageIcon, MessageSquare, Database, Terminal } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { StatusBadge } from '../common/StatusBadge';
import { TaskModal } from './TaskModal';
import { formatDuration, timeAgo } from '../../utils/formatters';
import { TABLES } from '../../api/config';

const PAGE_SIZE = 10;

export function TaskHistory() {
    const { sb, isAdmin, liveTasks } = useAdmin();
    const [tab, setTab] = useState('pending');
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState([]);
    const [counts, setCounts] = useState({});
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const loadTasksForTab = useCallback(async (currentTab, currentPage) => {
        if (!sb || !isAdmin) return;
        setLoading(true);
        try {
            const start = currentPage * PAGE_SIZE;
            // Full Column Projection: Fetch all columns including output_text, output_image_urls, user_id, app_id
            const res = await sb.from(TABLES.TASKS)
                .select('id,task_type,model,prompt,aspect_ratio,image_size,status,error,output_text,output_image_url,output_image_urls,input_image_url,face_image_url,style_image_url,worker_id,app_id,user_id,batch_count,conversation_id,face_match_score,created_at,finished_at,duration_ms,process_ms', { count: 'exact' })
                .eq('status', currentTab)
                .order('id', { ascending: false })
                .range(start, start + PAGE_SIZE - 1);

            if (res.data) setRows(res.data);
            if (res.count != null) {
                setCounts(prev => ({ ...prev, [currentTab]: res.count }));
            }
        } catch (err) {
            console.warn('loadTasksForTab error:', err);
        } finally {
            setLoading(false);
        }
    }, [sb, isAdmin]);

    useEffect(() => {
        loadTasksForTab(tab, page);
    }, [tab, page, loadTasksForTab]);

    const handleTabChange = (newTab) => {
        setTab(newTab);
        setPage(0);
    };

    // Filter rows by live search query
    const filteredRows = rows.filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return String(r.id).includes(q) ||
            (r.task_type || '').toLowerCase().includes(q) ||
            (r.model || '').toLowerCase().includes(q) ||
            (r.prompt || '').toLowerCase().includes(q);
    });

    const totalCount = counts[tab] || filteredRows.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

    return (
        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-white">Tasks & Results Database History</h2>
                    <p className="text-xs text-stone-400">Search and audit all completed, processing, and pending fleet tasks</p>
                </div>

                {/* Status Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        ['pending', 'Pending'],
                        ['processing', 'Processing'],
                        ['done', 'Completed'],
                        ['failed', 'Failed']
                    ].map(([key, label]) => {
                        const active = tab === key;
                        const count = counts[key];
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleTabChange(key)}
                                className={`h-8 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                    active 
                                        ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20' 
                                        : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-white/5'
                                }`}
                            >
                                <span>{label}</span>
                                {count != null && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                        active ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-stone-400'
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => loadTasksForTab(tab, page)}
                        className="h-8 w-8 rounded-xl bg-stone-900 hover:bg-stone-800 border border-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                        title="Refresh Table"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search tasks by ID, tool slug, model, or prompt..."
                    className="w-full h-8 sm:h-9 bg-stone-950 border border-white/10 rounded-xl pl-8 pr-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-stone-950/60">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-white/5 text-[11px] font-mono text-stone-400 uppercase bg-white/[0.02]">
                            <th className="p-3">ID</th>
                            <th className="p-3">Tool</th>
                            <th className="p-3">Model</th>
                            <th className="p-3">Output / Result</th>
                            <th className="p-3">Score</th>
                            <th className="p-3">Duration</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Inspect</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-stone-500 font-mono text-xs">
                                    {loading ? 'Tasks load ho rahe hain...' : 'Is tab mein koi task nahi mila.'}
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map(r => (
                                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-3 font-mono font-bold text-amber-400">#{r.id}</td>
                                    <td className="p-3 font-medium text-stone-200">
                                        <div className="font-semibold text-xs text-white">{r.task_type}</div>
                                        <div className="text-[10px] text-stone-400 font-mono truncate max-w-[160px]">{r.prompt || '—'}</div>
                                    </td>
                                    <td className="p-3 font-mono text-[11px] text-stone-400">{r.model || '—'}</td>
                                    <td className="p-3">
                                        {r.output_image_url ? (
                                            <a
                                                href={r.output_image_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold transition-colors"
                                            >
                                                <ImageIcon className="w-3.5 h-3.5" />
                                                <span>View Photo</span>
                                            </a>
                                        ) : r.output_text ? (
                                            <div className="flex items-center gap-1.5 text-stone-200">
                                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                <span className="font-mono text-[11px] text-stone-300 line-clamp-1 max-w-[200px]" title={r.output_text}>
                                                    {r.output_text}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-stone-600">—</span>
                                        )}
                                    </td>
                                    <td className="p-3 font-mono text-stone-400">
                                        {r.face_match_score != null ? `${r.face_match_score}%` : '—'}
                                    </td>
                                    <td className="p-3 font-mono text-stone-400">
                                        {formatDuration(r.duration_ms)}
                                    </td>
                                    <td className="p-3">
                                        <StatusBadge status={r.status} />
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTask(r)}
                                            className="h-7 px-2.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 hover:text-amber-200 text-xs font-bold inline-flex items-center gap-1 border border-amber-400/20 transition-colors"
                                            title="Inspect payload, table source & JSON"
                                        >
                                            <Terminal className="w-3 h-3" />
                                            <span>JSON</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs pt-1">
                    <button
                        type="button"
                        disabled={page === 0}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        className="h-8 px-3 rounded-xl border border-white/10 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="font-mono text-stone-400">
                        Page {page + 1} of {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={page + 1 >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="h-8 px-3 rounded-xl border border-white/10 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Inspect Modal */}
            {selectedTask && (
                <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
            )}
        </section>
    );
}

export default TaskHistory;
