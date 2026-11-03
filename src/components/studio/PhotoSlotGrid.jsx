import React, { useState } from 'react';
import { Upload, X, Link, Image as ImageIcon, ExternalLink, Check } from 'lucide-react';
import { INPUT_COLUMN, labelFor } from '../../constants/formDefaults';
import { uploadFile } from '../../api/uploadService';

export function PhotoSlotGrid({ type, form, setForm, onSetMsg }) {
    if (!type.inputs || type.inputs.length === 0) return null;

    const [uploadingSlot, setUploadingSlot] = useState(null);

    const handleFileUpload = async (e, col) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingSlot(col);
        if (onSetMsg) onSetMsg('Photo upload ho rahi hai...');
        try {
            const url = await uploadFile(file);
            setForm(prev => ({ ...prev, [col]: url }));
            if (onSetMsg) onSetMsg('Photo successfully upload ho gayi!');
        } catch (err) {
            if (onSetMsg) onSetMsg('Upload error: ' + err.message);
        } finally {
            setUploadingSlot(null);
        }
    };

    const handleUrlChange = (col, value) => {
        setForm(prev => ({ ...prev, [col]: value.trim() }));
    };

    const handleClear = (col) => {
        setForm(prev => ({ ...prev, [col]: '' }));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <span>Required Photo References ({type.inputs.length} Slots)</span>
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-mono">
                        Upload File ya Direct URL
                    </span>
                </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {type.inputs.map(key => {
                    const col = INPUT_COLUMN[key];
                    const val = form[col] || '';
                    const isOptional = type.optional?.includes(key);
                    const isUploading = uploadingSlot === col;

                    return (
                        <div key={key} className="bg-[#080b12] border border-slate-800 rounded-2xl p-3.5 space-y-3 transition-colors hover:border-slate-700">
                            {/* Card Header: Slot Title & Clear Button */}
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{labelFor(type, key)}</span>
                                    {!isOptional ? (
                                        <span className="text-amber-400 font-bold">*</span>
                                    ) : (
                                        <span className="text-slate-500 font-mono text-[10px]">(Opt)</span>
                                    )}
                                </span>

                                {val && (
                                    <button
                                        type="button"
                                        onClick={() => handleClear(col)}
                                        className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
                                        title="Clear photo"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Remove</span>
                                    </button>
                                )}
                            </div>

                            {/* Image Preview if URL/File exists */}
                            {val ? (
                                <div className="relative rounded-xl overflow-hidden bg-black/80 border border-slate-700/80 aspect-video flex items-center justify-center group">
                                    <img
                                        src={val}
                                        alt={key}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/80 backdrop-blur-sm text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">
                                        <Check className="w-3 h-3" />
                                        <span>Photo Active</span>
                                    </div>
                                    <a
                                        href={val}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-400 hover:text-black"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            ) : (
                                /* Upload File Drop Area */
                                <label className={`flex flex-col items-center justify-center p-4 border border-dashed rounded-xl cursor-pointer transition-all ${
                                    isUploading 
                                        ? 'border-amber-400 bg-amber-400/10' 
                                        : 'border-slate-800 hover:border-amber-400/80 bg-slate-900/30 hover:bg-slate-900/60'
                                }`}>
                                    <Upload className={`w-5 h-5 mb-1 ${isUploading ? 'text-amber-400 animate-bounce' : 'text-slate-400 group-hover:text-amber-400'}`} />
                                    <span className="text-xs font-semibold text-slate-300">
                                        {isUploading ? 'Uploading photo...' : 'Click to Upload Image File'}
                                    </span>
                                    <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WEBP from device</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={isUploading}
                                        onChange={e => handleFileUpload(e, col)}
                                        className="hidden"
                                    />
                                </label>
                            )}

                            {/* Direct URL Input Field */}
                            <div className="space-y-1 pt-0.5">
                                <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                    <Link className="w-3 h-3 text-slate-400" />
                                    <span>Direct Image URL (Paste link):</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={val}
                                        onChange={e => handleUrlChange(col, e.target.value)}
                                        placeholder="https://res.cloudinary.com/... ya direct image URL"
                                        className="w-full h-8 bg-slate-900/90 border border-slate-800 focus:border-amber-400 rounded-lg px-2.5 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default PhotoSlotGrid;
