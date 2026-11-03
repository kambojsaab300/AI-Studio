import React from 'react';
import { Camera } from 'lucide-react';
import { InfoTip } from '../common/InfoTip';

export function PromptSection({ type, form, setForm }) {
    const handleAngleToggle = (angle) => {
        const current = form.prompt.trim();
        const anglePattern = new RegExp(`\\b${angle}\\b`, 'i');
        if (anglePattern.test(current)) {
            const next = current.replace(anglePattern, '').replace(/\s{2,}/g, ' ').trim();
            setForm({ ...form, prompt: next });
        } else {
            const next = current ? `${current}, ${angle}` : angle;
            setForm({ ...form, prompt: next });
        }
    };

    return (
        <div className="space-y-3">
            {/* Angle & Pose Chips if applicable */}
            {type.angles && type.angles.length > 0 && (
                <div className="space-y-2 bg-[#080b12] border border-amber-400/25 p-3 sm:p-3.5 rounded-xl">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-amber-400" />
                            <span>Angles & Poses (Click to Add to Prompt)</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">Multiple select available</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {type.angles.map(angle => {
                            const isIncluded = new RegExp(`\\b${angle}\\b`, 'i').test(form.prompt);
                            return (
                                <button
                                    key={angle}
                                    type="button"
                                    onClick={() => handleAngleToggle(angle)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                        isIncluded 
                                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-sm' 
                                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                                    }`}
                                >
                                    {angle}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Creative Prompt Input */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-200 flex items-center gap-1">
                        Creative Prompt {type.promptRequired ? <span className="text-amber-400 font-bold">*</span> : <span className="text-slate-500 font-mono">(Opt)</span>}
                        <InfoTip text="Describe colors, lighting, studio background, pose specifics, and clothing details." />
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">{form.prompt.length} chars</span>
                </div>
                <textarea
                    value={form.prompt}
                    onChange={e => setForm({ ...form, prompt: e.target.value })}
                    rows={3}
                    placeholder={type.promptRequired ? "Describe what to generate, outfit colors, lighting, studio background..." : "Extra styling details, environment, lighting, pose specifics (optional)..."}
                    className="w-full bg-[#080b12] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-sans leading-relaxed"
                />
            </div>
        </div>
    );
}

export default PromptSection;
