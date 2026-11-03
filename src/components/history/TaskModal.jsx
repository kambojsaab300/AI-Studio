import React from 'react';
import { X, Download, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatDuration, timeAgo } from '../../utils/formatters';

export function TaskModal({ task, onClose }) {
    if (!task) return null;

    const isImage = !!task.output_image_url;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
            <div className="bg-[#0b0e17] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-sm sm:text-base font-extrabold text-amber-400">Task #{task.id}</span>
                        <StatusBadge status={task.status} />
                        <span className="text-xs font-mono text-slate-400 hidden sm:inline">{task.task_type}</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                    {/* Error Banner if Failed */}
                    {task.error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                            <span>{task.error}</span>
                        </div>
                    )}

                    {/* Output Image Display */}
                    {task.output_image_url && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                                <span>Generated Output Image</span>
                                <a
                                    href={task.output_image_url}
                                    download={`task_${task.id}_output.jpg`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1 bg-amber-400 text-slate-950 rounded-lg text-xs font-extrabold flex items-center gap-1 hover:bg-amber-300 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download Full HD</span>
                                </a>
                            </div>
                            <div className="rounded-xl overflow-hidden bg-black/60 border border-slate-800 flex items-center justify-center p-2">
                                <img
                                    src={task.output_image_url}
                                    alt={`Task #${task.id}`}
                                    className="max-h-96 object-contain rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    {/* Output Text if text task */}
                    {task.output_text && (
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-300">Output Text</span>
                            <pre className="bg-black/50 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                                {task.output_text}
                            </pre>
                        </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                            <span className="text-[10px] text-slate-400 block font-mono">Model</span>
                            <span className="font-mono font-bold text-slate-200">{task.model || '—'}</span>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                            <span className="text-[10px] text-slate-400 block font-mono">Duration</span>
                            <span className="font-mono font-bold text-slate-200">{formatDuration(task.duration_ms)}</span>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                            <span className="text-[10px] text-slate-400 block font-mono">Worker ID</span>
                            <span className="font-mono font-bold text-amber-300">{task.worker_id || 'fleet'}</span>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
                            <span className="text-[10px] text-slate-400 block font-mono">Created</span>
                            <span className="font-mono font-bold text-slate-200">{timeAgo(task.created_at)}</span>
                        </div>
                    </div>

                    {/* Raw Task JSON */}
                    <div className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-amber-400" />
                            <span>Complete Database Payload Row</span>
                        </span>
                        <pre className="bg-[#050810] border border-slate-800/80 rounded-xl p-3 text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-48 scrollbar-thin">
                            <code>{JSON.stringify(task, null, 2)}</code>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TaskModal;
