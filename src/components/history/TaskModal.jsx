import React, { useState } from 'react';
import { X, Download, Terminal, CheckCircle2, AlertCircle, Database, MessageSquare, Copy, Check, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatDuration, timeAgo } from '../../utils/formatters';

export function TaskModal({ task, onClose }) {
    if (!task) return null;

    const [copiedText, setCopiedText] = useState(false);
    const [copiedJson, setCopiedJson] = useState(false);
    const [jsonTab, setJsonTab] = useState('formatted'); // 'formatted' | 'raw'

    const copyToClipboard = (text, type) => {
        try {
            navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
            if (type === 'text') {
                setCopiedText(true);
                setTimeout(() => setCopiedText(false), 2000);
            } else {
                setCopiedJson(true);
                setTimeout(() => setCopiedJson(false), 2000);
            }
        } catch (e) {
            console.error('Copy failed:', e);
        }
    };

    // Parse image urls if array or JSON string
    let photoList = [];
    if (Array.isArray(task.output_image_urls)) {
        photoList = task.output_image_urls;
    } else if (typeof task.output_image_urls === 'string' && task.output_image_urls.startsWith('[')) {
        try { photoList = JSON.parse(task.output_image_urls); } catch {}
    }
    if (photoList.length === 0 && task.output_image_url) {
        photoList = [task.output_image_url];
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
            <div className="bg-[#0b0e17] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-base font-black text-amber-400">Task #{task.id}</span>
                        <StatusBadge status={task.status} />
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                            {task.task_type}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300">
                            app: {task.app_id || 'weargen'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
                    {/* 🗄️ Database Provenance & Origin Card */}
                    <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                                <Database className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">Database Source Table:</span>
                                    <code className="text-xs font-mono font-bold text-amber-200 bg-black/60 px-2 py-0.5 rounded border border-amber-500/20">
                                        ai_studio_tasks
                                    </code>
                                </div>
                                <p className="text-[11px] text-stone-400 mt-0.5">
                                    Ye record direct SQL Database table <strong className="text-slate-300 font-mono">ai_studio_tasks</strong> se fetch kiya gaya hai.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px] text-stone-300 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                            <span>Row ID: <strong className="text-amber-400">#{task.id}</strong></span>
                            <span className="text-stone-600">|</span>
                            <span>App: <strong className="text-white">{task.app_id || 'weargen'}</strong></span>
                            <span className="text-stone-600">|</span>
                            <span>User: <strong className="text-slate-300">{task.user_id || 'guest'}</strong></span>
                        </div>
                    </div>

                    {/* Error Banner if Failed */}
                    {task.error && (
                        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl p-4 text-xs flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                            <div>
                                <span className="font-bold block">Execution Error:</span>
                                <span className="font-mono">{task.error}</span>
                            </div>
                        </div>
                    )}

                    {/* 💬 Chat / Text Output Response (Proper Formatted View) */}
                    {task.output_text && (
                        <div className="bg-gradient-to-br from-emerald-500/10 via-[#0e1320] to-[#0e1320] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
                            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                                        Chat & Text Output Response
                                    </span>
                                    <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                                        {task.output_text.length} Characters
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(task.output_text, 'text')}
                                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                                >
                                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedText ? 'Copied Response!' : 'Copy Text'}</span>
                                </button>
                            </div>
                            <div className="bg-black/60 border border-emerald-500/20 rounded-xl p-4 text-xs text-stone-100 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto font-sans select-text shadow-inner">
                                {task.output_text}
                            </div>
                        </div>
                    )}

                    {/* 🖼️ Generated Photo(s) Output Display */}
                    {photoList.length > 0 && (
                        <div className="space-y-3 bg-[#0e1320] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs font-bold text-slate-300">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-amber-400" />
                                    <span>Generated Image Output ({photoList.length})</span>
                                </div>
                                {photoList.length === 1 && (
                                    <a
                                        href={photoList[0]}
                                        download={`task_${task.id}_output.jpg`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3 py-1 bg-amber-400 text-slate-950 rounded-lg text-xs font-extrabold flex items-center gap-1 hover:bg-amber-300 transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download Full HD</span>
                                    </a>
                                )}
                            </div>
                            <div className={`grid gap-3 ${photoList.length > 1 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
                                {photoList.map((url, idx) => (
                                    <div key={idx} className="group relative rounded-xl overflow-hidden bg-black/60 border border-slate-800 flex flex-col items-center">
                                        <img
                                            src={url}
                                            alt={`Task #${task.id} Photo ${idx + 1}`}
                                            className="w-full max-h-96 object-contain rounded-lg"
                                        />
                                        <div className="p-2 w-full flex items-center justify-between bg-black/40 border-t border-white/5 text-[11px]">
                                            <span className="font-mono text-stone-400">Photo #{idx + 1}</span>
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                                            >
                                                <span>Open</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Prompt & Parameters */}
                    {task.prompt && (
                        <div className="bg-[#0e1320] border border-slate-800 rounded-2xl p-4 space-y-1.5">
                            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Submitted Input Prompt</span>
                            <p className="text-xs text-stone-200 bg-black/40 border border-white/5 rounded-xl p-3 font-mono leading-relaxed select-text">
                                {task.prompt}
                            </p>
                        </div>
                    )}

                    {/* Metadata Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                            <span className="text-[10px] text-slate-400 block font-mono uppercase">AI Model</span>
                            <span className="font-mono font-bold text-slate-200 truncate block">{task.model || '—'}</span>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                            <span className="text-[10px] text-slate-400 block font-mono uppercase">Duration</span>
                            <span className="font-mono font-bold text-emerald-400">{formatDuration(task.duration_ms)}</span>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                            <span className="text-[10px] text-slate-400 block font-mono uppercase">Worker Fleet ID</span>
                            <span className="font-mono font-bold text-amber-300">{task.worker_id || 'fleet'}</span>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                            <span className="text-[10px] text-slate-400 block font-mono uppercase">Created Time</span>
                            <span className="font-mono font-bold text-slate-200">{timeAgo(task.created_at)}</span>
                        </div>
                    </div>

                    {/* 💻 Complete Database Payload Row in JSON Format */}
                    <div className="bg-[#050810] border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-black text-white">
                                    Raw JSON Inspector (<code className="text-amber-300">ai_studio_tasks</code> row)
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => copyToClipboard(task, 'json')}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/10"
                            >
                                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedJson ? 'Copied Full JSON!' : 'Copy Raw JSON'}</span>
                            </button>
                        </div>
                        <pre className="bg-black/80 border border-white/5 rounded-xl p-3.5 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 scrollbar-thin leading-relaxed select-text">
                            <code>{JSON.stringify(task, null, 2)}</code>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TaskModal;
