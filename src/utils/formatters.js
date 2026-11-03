// ============================================================
// AI Studio: Formatting & UI Utility Functions
// ============================================================

export const STATUS_STYLE = {
    pending: 'text-stone-300 bg-stone-800 border-white/10',
    processing: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
    done: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    failed: 'text-rose-300 bg-rose-500/10 border-rose-500/30'
};

export function copyToClipboard(text, onSuccess) {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess));
    } else {
        fallbackCopy(text, onSuccess);
    }
}

function fallbackCopy(text, onSuccess) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    try {
        document.execCommand('copy');
        if (onSuccess) onSuccess();
    } catch { }
    document.body.removeChild(el);
}

export function formatDuration(ms) {
    if (!ms || ms < 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

export function timeAgo(isoString) {
    if (!isoString) return '—';
    try {
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
        return isoString;
    }
}
