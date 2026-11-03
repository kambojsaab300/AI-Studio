import React from 'react';
import { InfoTip } from '../common/InfoTip';

export function GenerationSettings({ form, setForm, type, caps, modelOptions }) {
    const isImage = type.output === 'image';
    const aspects = Array.isArray(caps?.aspects) && caps.aspects.length > 0 
        ? caps.aspects 
        : ['1:1', '4:5', '9:16', '16:9'];
    const sizes = Array.isArray(caps?.sizes) && caps.sizes.length > 0 
        ? caps.sizes 
        : ['1K', '2K', '4K'];

    return (
        <div className="space-y-4">
            {/* Model Selector */}
            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                    Engine / Model
                    <InfoTip text="Choose which Gemini multimodal vision or image generation model processes this task." />
                </label>
                <select
                    value={form.model}
                    onChange={e => setForm({ ...form, model: e.target.value })}
                    className="h-9 w-full bg-[#080b12] border border-slate-800 rounded-xl px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400 transition-colors"
                >
                    {(modelOptions || []).map(id => (
                        <option key={id} value={id}>
                            {id} {id === 'gemini-3.1-flash-image-preview' ? '(Recommended • 2K/4K)' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Image Specific Controls: Aspect Ratio, Size, Batch Count */}
            {isImage && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* Aspect Ratio */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            Aspect Ratio
                            <InfoTip text="Controls width-to-height proportion (1:1 Square, 4:5 Portrait, 9:16 Story)." />
                        </label>
                        <div className="flex flex-wrap gap-1">
                            {aspects.slice(0, 5).map(a => (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => setForm({ ...form, aspect_ratio: a })}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                                        form.aspect_ratio === a 
                                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm' 
                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image Resolution Size */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            Resolution Size
                            <InfoTip text="Output image resolution quality (1K Standard, 2K Crisp, 4K Ultra-HD)." />
                        </label>
                        <select
                            value={form.image_size}
                            onChange={e => setForm({ ...form, image_size: e.target.value })}
                            disabled={!sizes.length}
                            className="h-8 w-full bg-slate-900 border border-slate-800 rounded-lg px-2 text-xs text-slate-200 font-mono disabled:opacity-40 focus:outline-none focus:border-amber-400"
                        >
                            {sizes.map(s => (
                                <option key={s} value={s}>{s || 'Default'}</option>
                            ))}
                        </select>
                    </div>

                    {/* Batch Count */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            Batch Count
                            <InfoTip text="Number of parallel image variations to generate concurrently (1-4 photos)." />
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={form.batch_count}
                            onChange={e => setForm({ ...form, batch_count: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })}
                            className="h-8 w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default GenerationSettings;
