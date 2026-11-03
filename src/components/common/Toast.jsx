import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export function Toast({ message, type = 'info', onClose }) {
    if (!message) return null;

    const isSuccess = type === 'success';
    const isError = type === 'error';

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-3 animate-fadeIn">
            <div className={`text-xs rounded-xl px-4 py-2.5 flex items-center justify-between shadow-lg border ${
                isSuccess 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200' 
                    : isError 
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                        : 'bg-amber-400/10 border-amber-400/30 text-amber-200'
            }`}>
                <div className="flex items-center gap-2">
                    {isSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{message}</span>
                </div>
                {onClose && (
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="text-white/60 hover:text-white font-bold ml-2 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}

export default Toast;
