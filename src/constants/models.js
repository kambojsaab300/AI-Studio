// ============================================================
// AI Studio: Models & Generation Configurations
// ============================================================

export const IMAGE_SIZES = ['0.5K', '1K', '2K', '4K'];

export const IMAGE_ASPECTS = [
    '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'
];

export let MODEL_CAPS = {};

export function safeArray(val, fallback = []) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                // fall through
            }
        }
        if (trimmed) {
            return trimmed.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        }
    }
    return fallback;
}

export const capsOf = (id) => {
    const c = MODEL_CAPS[id];
    if (!c) return { kind: 'text', label: '', aspects: [], sizes: [] };
    return {
        ...c,
        aspects: safeArray(c.aspects),
        sizes: safeArray(c.sizes)
    };
};

export function setModelCaps(rows) {
    MODEL_CAPS = {};
    (rows || []).filter(r => r && r.kind).forEach(r => {
        MODEL_CAPS[r.model_id] = {
            kind: r.kind,
            label: r.label || r.model_id,
            aspects: safeArray(r.aspects),
            sizes: safeArray(r.sizes)
        };
    });
}
