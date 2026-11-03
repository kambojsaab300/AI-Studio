import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { InfoTip } from '../common/InfoTip';
import { uploadFile } from '../../api/uploadService';

export function BatchUploader({ type, form, setForm, onSetMsg }) {
    const [uploadingCount, setUploadingCount] = useState(0);

    if (!type.extras || type.family) return null;

    const urls = (Array.isArray(form.extra_image_urls)
        ? form.extra_image_urls
        : String(form.extra_image_urls || '').split('\n')
    ).map(s => String(s || '').trim()).filter(Boolean);

    const handleBatchFiles = async (e) => {
        const files = Array.from(e.target.files || []).slice(0, 50);
        if (!files.length) return;
        setUploadingCount(files.length);
        if (onSetMsg) onSetMsg(`${files.length} photos upload ho rahi hain...`);
        try {
            const uploadedUrls = [];
            for (let i = 0; i < files.length; i++) {
                if (onSetMsg) onSetMsg(`Uploading ${i + 1}/${files.length} photos...`);
                uploadedUrls.push(await uploadFile(files[i]));
            }
            const combined = [...urls, ...uploadedUrls].slice(0, 50);
            setForm(prev => ({ ...prev, extra_image_urls: combined.join('\n') }));
            if (onSetMsg) onSetMsg(`${combined.length} photos successfully upload ho gayi!`);
        } catch (err) {
            if (onSetMsg) onSetMsg('Upload error: ' + err.message);
        } finally {
            setUploadingCount(0);
        }
    };

    const removePhoto = (idx) => {
        const updated = [...urls];
        updated.splice(idx, 1);
        setForm(prev => ({ ...prev, extra_image_urls: updated.join('\n') }));
    };

    const clearAll = () => {
        setForm(prev => ({ ...prev, extra_image_urls: '' }));
    };

    return (
        <div className="space-y-2 bg-[#080b12] border border-amber-400/25 p-3 sm:p-4 rounded-xl">
            {/* Header & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Batch Model Photos Upload (1 se 50 Photos)</span>
                    <InfoTip text="Upload multiple photos in one batch. Worker will process all photos in parallel or one-by-one catalog extractions." />
                </label>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        urls.length > 0 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-white/5 text-slate-400'
                    }`}>
                        {urls.length}/50 Photos
                    </span>
                    {urls.length > 0 && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="text-[10px] text-rose-400 hover:text-rose-300 underline font-mono ml-1"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Dropzone with multiple file input */}
            <div className="border border-dashed border-amber-400/30 rounded-xl p-4 sm:p-5 text-center space-y-2 hover:border-amber-400/60 transition-colors bg-amber-400/5">
                <Upload className="w-6 h-6 mx-auto text-amber-400" />
                <div className="space-y-1">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-extrabold shadow-md shadow-amber-400/20 active:scale-98 transition-all">
                        <span>Click to Select 10, 20 or up to 50 Photos</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleBatchFiles}
                            className="hidden"
                        />
                    </label>
                    <p className="text-[11px] text-slate-400">
                        {uploadingCount > 0 
                            ? `Uploading ${uploadingCount} photos, kripya wait karein...` 
                            : 'Mobile ya computer se saari photos ek sath select karke upload karein'}
                    </p>
                </div>
            </div>

            {/* Thumbnail Gallery */}
            {urls.length > 0 && (
                <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                        <span>Uploaded Model Photos Queue:</span>
                        <span className="text-[10px] text-amber-300 font-mono">Har photo ka alag garment banega</span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
                        {urls.map((url, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden bg-black/60 border border-slate-800 aspect-square group">
                                <img src={url} alt={`#${idx+1}`} className="w-full h-full object-cover" />
                                <span className="absolute bottom-1 left-1 bg-black/80 text-[9px] font-mono font-bold text-amber-300 px-1 rounded">
                                    #{idx + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removePhoto(idx)}
                                    className="absolute top-1 right-1 w-4 h-4 bg-rose-500/90 hover:bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Photo remove karein"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Optional Raw Link Input */}
            <details className="text-[11px] text-slate-400 cursor-pointer pt-1">
                <summary className="hover:text-amber-300 transition-colors">
                    Direct image URLs paste karna chahein to click karein (Optional)
                </summary>
                <textarea
                    value={form.extra_image_urls}
                    onChange={e => setForm({ ...form, extra_image_urls: e.target.value })}
                    rows={3}
                    placeholder="https://... (ek line me ek photo link)"
                    className="mt-2 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-400"
                />
            </details>
        </div>
    );
}

export default BatchUploader;
