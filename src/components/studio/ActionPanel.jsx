import React from 'react';
import { Sparkles, ArrowUpRight, AlertCircle, Check, Loader2 } from 'lucide-react';

export function ActionPanel({ problems, isGenerating, btnFeedback, onClearFeedback, onSendTask }) {
    const hasProblems = problems && problems.length > 0;

    return (
        <div className="space-y-3 pt-2">
            {/* Validation Warnings if any */}
            {hasProblems && (
                <div className="bg-amber-400/10 border border-amber-400/25 rounded-xl p-3 space-y-1.5 animate-fadeIn">
                    <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        Task dispatch karne ke liye ye zaroori hai:
                    </p>
                    <div className="space-y-1 pl-5">
                        {problems.map((p, i) => (
                            <p key={i} className="text-xs text-amber-200 list-item list-disc">
                                {p}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* Inline Success or Error Feedback from recent click */}
            {btnFeedback && (
                <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-lg transition-all animate-fadeIn ${
                    btnFeedback.type === 'success' 
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}>
                    <div className="flex items-center gap-2">
                        {btnFeedback.type === 'success' 
                            ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> 
                            : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                        <span>{btnFeedback.message}</span>
                    </div>
                    {onClearFeedback && (
                        <button 
                            type="button" 
                            onClick={onClearFeedback} 
                            className="text-xs opacity-70 hover:opacity-100 font-bold ml-2"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}

            {/* Primary Action Generate Button */}
            <button
                type="button"
                onClick={onSendTask}
                disabled={isGenerating || hasProblems}
                className={`w-full h-11 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all ${
                    hasProblems 
                        ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-70 shadow-none' 
                        : isGenerating 
                            ? 'bg-amber-400/60 text-slate-900 cursor-wait' 
                            : 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-amber-400/20 active:scale-98'
                }`}
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Dispatching Task to Queue...</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span className="sm:inline hidden">Generate Task & Send to Worker Fleet</span>
                        <span className="sm:hidden inline">Generate Task ⚡</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </>
                )}
            </button>
        </div>
    );
}

export default ActionPanel;
