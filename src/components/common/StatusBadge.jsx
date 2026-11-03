import React from 'react';
import { STATUS_STYLE } from '../../utils/formatters';

export function StatusBadge({ status, className = "" }) {
    const style = STATUS_STYLE[status] || STATUS_STYLE.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold capitalize border ${style} ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
                status === 'done' ? 'bg-emerald-400' :
                status === 'processing' ? 'bg-sky-400 animate-pulse' :
                status === 'failed' ? 'bg-rose-400' : 'bg-stone-400'
            }`} />
            <span>{status || 'pending'}</span>
        </span>
    );
}

export default StatusBadge;
