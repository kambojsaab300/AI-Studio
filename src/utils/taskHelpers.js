// ============================================================
// AI Studio: Task Serialization, Preview & Validation Engine
// ============================================================

import { typeOf, INPUT_COLUMN, labelFor, FAMILY_ROLES } from '../constants/formDefaults';
import { capsOf } from '../constants/models';
import { GEMINI_BASE } from '../api/config';

export function familyOrderText(task) {
    const keys = task.family_role_keys || FAMILY_ROLES.map(r => r.role_key);
    const names = Object.fromEntries(FAMILY_ROLES.map(r => [r.role_key, r.prompt_text || r.role_key]));
    const present = keys.filter((_, i) => (task.extra_image_urls || [])[i]);
    return `Photo order: ${present.map((k, i) => `IMAGE ${i + 1} = ${names[k] || k}`).join(', ')}.`;
}

export function instructionFor(task, p) {
    const userPrompt = (task.prompt || '').trim();
    if (task.task_type === 'chat') return userPrompt;
    if (task.task_type === 'photo_read') return userPrompt || 'Describe this photo in detail.';
    if (!p || !p.enabled) return '<prompt DB mein nahi ya band hai>';

    const parts = [
        task.system_text || p.system_text,
        p.role_text,
        userPrompt ? `Prompt: "${userPrompt}"` : '',
        p.negative_text ? `[NEGATIVE CONSTRAINTS]: ${p.negative_text}` : ''
    ];
    let text = parts.filter(Boolean).join('\n');
    if (task.task_type === 'family_photo') text += `\n${familyOrderText(task)}`;
    if (typeOf(task.task_type)?.output === 'image') text += `\nAspect ratio: ${task.aspect_ratio}.`;
    return text;
}

export function rowFromForm(f) {
    const type = typeOf(f.task_type);
    const isImage = type.output === 'image';
    return {
        task_type: f.task_type,
        model: f.model,
        prompt: f.prompt.trim() || null,
        aspect_ratio: isImage ? f.aspect_ratio : null,
        image_size: isImage && capsOf(f.model).sizes.length ? f.image_size : null,
        face_image_url: type.inputs.includes('face') ? f.face_image_url.trim() : null,
        style_image_url: type.inputs.includes('style') ? f.style_image_url.trim() : null,
        input_image_url: type.inputs.includes('input') ? f.input_image_url.trim() : null,
        extra_image_urls: type.family
            ? (Array.isArray(f.family_urls) ? f.family_urls : []).map(s => String(s || '').trim())
            : type.extras
                ? (Array.isArray(f.extra_image_urls) ? f.extra_image_urls : String(f.extra_image_urls || '').split('\n')).map(s => String(s || '').trim()).filter(Boolean)
                : null,
        conversation_id: f.task_type === 'chat' ? (f.conversation_id.trim() || null) : null,
        user_id: f.user_id.trim() || 'weargen_user_1',
        batch_count: isImage ? Math.min(10, Math.max(1, Number(f.batch_count) || 1)) : 1
    };
}

export function requestPreview(row, prompts) {
    const type = typeOf(row.task_type);
    const isImage = type.output === 'image';
    const img = (url) => ({ inlineData: { mimeType: 'image/jpeg', data: url ? `<base64 of ${url}>` : '<MISSING>' } });

    const parts = [{ text: instructionFor(row, prompts[row.task_type]) }];
    for (const key of ['face', 'style', 'input']) {
        if (type.inputs.includes(key)) parts.push(img(row[INPUT_COLUMN[key]]));
    }
    if (type.extras) (row.extra_image_urls || []).filter(Boolean).forEach(u => parts.push(img(u)));

    const contents = [];
    if (row.task_type === 'chat' && row.conversation_id) {
        contents.push({ role: 'user', parts: [{ text: `<finished earlier messages of conversation "${row.conversation_id}" are added here>` }] });
    }
    contents.push({ role: 'user', parts });

    const body = { contents };
    if (isImage) {
        body.generationConfig = {
            responseModalities: ['IMAGE'],
            imageConfig: { aspectRatio: row.aspect_ratio, ...(row.image_size ? { imageSize: row.image_size } : {}) }
        };
    }
    return {
        method: 'POST',
        url: `${GEMINI_BASE}/${row.model}:generateContent?key=<AI_STUDIO_KEY>`,
        body
    };
}

export function problemsFor(f, row, prompts) {
    const p = [];
    const type = typeOf(f.task_type);
    const caps = capsOf(f.model);

    // Only complain if prompt row exists in memory and is disabled
    if (!['chat', 'photo_read'].includes(f.task_type) && prompts && prompts[f.task_type] && prompts[f.task_type].enabled === false) {
        p.push('Is kaam ka prompt DB mein band hai (Prompts section dekho)');
    }
    if (caps && caps.kind && type && type.kind && caps.kind !== type.kind) {
        p.push('Is task type ke liye ye model nahi chalega');
    }
    for (const key of (type.inputs || [])) {
        if (!type.optional?.includes(key) && !row[INPUT_COLUMN[key]]) {
            p.push(`${labelFor(type, key)} chahiye`);
        }
    }
    if (type.promptRequired && !row.prompt) p.push('Creative prompt zaroori hai');
    if (type.family && (row.extra_image_urls || []).filter(Boolean).length < 2) {
        p.push('Parivar ki kam se kam 2 photos chahiye');
    }
    if (type.extras && !type.family && (!row.extra_image_urls || row.extra_image_urls.length === 0)) {
        p.push('Kam se kam 1 photo upload karein (1 se 50 photos tak)');
    }
    if (type.output === 'image' && caps && caps.kind === 'image') {
        if (caps.aspects && caps.aspects.length > 0 && row.aspect_ratio && !caps.aspects.includes(row.aspect_ratio)) {
            p.push('Aspect ratio is model mein support nahi');
        }
        if (row.image_size && caps.sizes && caps.sizes.length > 0 && !caps.sizes.includes(row.image_size)) {
            p.push('Size is model mein support nahi');
        }
        if (row.batch_count < 1 || row.batch_count > 10) {
            p.push('Batch 1 se 10 ke beech hona chahiye');
        }
    }
    return p;
}
