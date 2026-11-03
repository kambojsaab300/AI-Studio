// ============================================================
// AI Studio: Resilient 3-Tier Image Upload Service
// Tier 1: Cloudinary Raw File Upload
// Tier 2: Canvas Compressed Upload
// Tier 3: Guaranteed Instant Data URL (0ms, zero network block)
// ============================================================

import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from './config';

export function compressFile(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = reject;
        r.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Photo padh nahi paayi'));
            img.onload = () => {
                const k = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight));
                const c = document.createElement('canvas');
                c.width = Math.round(img.naturalWidth * k);
                c.height = Math.round(img.naturalHeight * k);
                const ctx = c.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, c.width, c.height);
                ctx.drawImage(img, 0, 0, c.width, c.height);
                resolve(c.toDataURL('image/jpeg', 0.85));
            };
            img.src = r.result;
        };
        r.readAsDataURL(file);
    });
}

export async function uploadFile(file) {
    if (!file) throw new Error('File missing hai');

    // Tier 1: Try Cloudinary direct raw file upload (supports JPG, PNG, WEBP, HEIC natively)
    try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || 'ml_default');
        const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: fd });
        if (res.ok) {
            const data = await res.json();
            if (data.secure_url) return data.secure_url;
        }
    } catch (e) {
        console.warn('Cloudinary raw upload error, trying compressed upload...', e);
    }

    // Tier 2: Try Cloudinary canvas compressed upload
    try {
        const dataUrl = await compressFile(file);
        const fd = new FormData();
        fd.append('file', dataUrl);
        fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || 'ml_default');
        const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: fd });
        if (res.ok) {
            const data = await res.json();
            if (data.secure_url) return data.secure_url;
        }
    } catch (e) {
        console.warn('Cloudinary compressed upload failed, generating guaranteed instant local data link...', e);
    }

    // Tier 3: Guaranteed instant Base64 Data URL (Never fails, never blocked by CORS/network)
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error('Photo read error'));
        r.readAsDataURL(file);
    });
}
