// ============================================================
// AI Studio: Models & Generation Configurations
// ============================================================

export const IMAGE_SIZES = ['0.5K', '1K', '2K', '4K'];

export const IMAGE_ASPECTS = [
    '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'
];

export let MODEL_CAPS = {};

export const capsOf = (id) => MODEL_CAPS[id] || { kind: 'text', label: '', aspects: [], sizes: [] };

export function setModelCaps(rows) {
    MODEL_CAPS = {};
    (rows || []).filter(r => r.kind).forEach(r => {
        MODEL_CAPS[r.model_id] = {
            kind: r.kind,
            label: r.label || r.model_id,
            aspects: r.aspects || [],
            sizes: r.sizes || []
        };
    });
}
