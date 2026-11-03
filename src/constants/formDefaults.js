// ============================================================
// AI Studio: Form Defaults, Schema Definitions & Task Types
// ============================================================

export const INPUT_LABEL = { 
    face: 'Face reference', 
    style: 'Style / outfit reference', 
    input: 'Input photo' 
};

export const INPUT_COLUMN = { 
    face: 'face_image_url', 
    style: 'style_image_url', 
    input: 'input_image_url' 
};

export const EMPTY_TYPE = { 
    label: '', 
    output: 'text', 
    kind: 'text', 
    inputs: [], 
    labels: {}, 
    optional: [], 
    extras: false, 
    promptRequired: false, 
    faceCheck: false 
};

export const TASK_TYPES = {};

function safeJson(val, fallback) {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
            try {
                return JSON.parse(trimmed);
            } catch (e) {
                return fallback;
            }
        }
    }
    return fallback;
}

export const typeOf = (k) => TASK_TYPES[k] || EMPTY_TYPE;

export let CUSTOMER_KINDS = [];
export let FAMILY_ROLES = [];

export function toTaskType(r) {
    const inputs = safeJson(r.inputs, []);
    const labels = safeJson(r.labels, {});
    const optional = safeJson(r.optional, []);
    const angles = safeJson(r.angles, null);

    return {
        label: r.label || r.task_type,
        output: r.output,
        kind: r.output,
        inputs: Array.isArray(inputs) ? inputs : [],
        labels: (typeof labels === 'object' && labels !== null) ? labels : {},
        optional: Array.isArray(optional) ? optional : [],
        extras: !!r.extras,
        promptRequired: !!r.prompt_required,
        family: !!r.family,
        perPhoto: !!r.per_photo,
        faceCheck: !!r.face_check,
        angles: angles
    };
}

export function setTaskTypes(rows) {
    Object.keys(TASK_TYPES).forEach(k => delete TASK_TYPES[k]);
    (rows || []).filter(r => r.enabled).forEach(r => { 
        TASK_TYPES[r.task_type] = toTaskType(r); 
    });
    CUSTOMER_KINDS = (rows || []).filter(r => r.enabled && r.customer_visible).map(r => r.task_type);
}

export function setFamilyRoles(roles) {
    FAMILY_ROLES = roles || [];
}

export const labelFor = (type, key) => type?.labels?.[key] || INPUT_LABEL[key];

export const EMPTY_FORM = {
    task_type: 'image_to_image_prompt',
    model: 'gemini-3.1-flash-image-preview',
    prompt: '',
    aspect_ratio: '4:5',
    image_size: '2K',
    face_image_url: '',
    style_image_url: '',
    input_image_url: '',
    extra_image_urls: '',
    family_urls: ['', '', '', '', '', ''],
    conversation_id: '',
    user_id: 'weargen_user_1',
    batch_count: 1
};
