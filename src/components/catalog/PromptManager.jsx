import React, { useState } from 'react';
import { Terminal, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { TABLES } from '../../api/config';

export function PromptManager() {
    const { sb, catalog, prompts, setPrompts, loadConfig, setMsg } = useAdmin();
    const [selectedType, setSelectedType] = useState('image_to_image_prompt');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

    const currentPrompt = prompts[selectedType] || {
        task_type: selectedType,
        system_text: '',
        role_text: '',
        negative_text: '',
        enabled: true
    };

    const setField = (key, value) => {
        setPrompts(prev => ({
            ...prev,
            [selectedType]: {
                ...currentPrompt,
                [key]: value
            }
        }));
    };

    const handleSavePrompt = async () => {
        if (!currentPrompt.system_text.trim()) return setMsg('System text khali nahi ho sakta');
        setSaving(true);
        setSavedMsg('');
        try {
            const { error } = await sb.from(TABLES.PROMPTS).update({
                system_text: currentPrompt.system_text.trim(),
                role_text: currentPrompt.role_text.trim(),
                negative_text: currentPrompt.negative_text.trim(),
                enabled: currentPrompt.enabled,
                updated_at: new Date().toISOString()
            }).eq('task_type', selectedType);

            if (error) throw error;

            setSavedMsg(`Saved at ${new Date().toLocaleTimeString()}!`);
            setTimeout(() => setSavedMsg(''), 4000);
            loadConfig();
        } catch (err) {
            setMsg('Prompt save error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="bg-[#0b0e17] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                        <Terminal className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-sm sm:text-base font-extrabold text-white">System Prompts & Negative Constraints</h2>
                        <p className="text-xs text-stone-400">Production AI instructions injected into Gemini image calls</p>
                    </div>
                </div>

                {savedMsg && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {savedMsg}
                    </span>
                )}
            </div>

            {/* Select Tool */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">Choose Tool to Edit Prompt:</label>
                <select
                    value={selectedType}
                    onChange={e => { setSelectedType(e.target.value); setSavedMsg(''); }}
                    className="w-full h-9 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs text-white font-mono"
                >
                    {catalog.map(c => (
                        <option key={c.task_type} value={c.task_type}>
                            {c.label} ({c.task_type})
                        </option>
                    ))}
                </select>
            </div>

            {/* Editor Textareas */}
            <div className="space-y-3 pt-1">
                <div>
                    <label className="block text-xs font-bold text-stone-400 mb-1">System Instructions Prompt</label>
                    <textarea
                        value={currentPrompt.system_text || ''}
                        onChange={e => setField('system_text', e.target.value)}
                        rows={2}
                        className="w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs text-white font-sans leading-relaxed"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-stone-400 mb-1">Role / Persona Text Prompt</label>
                    <textarea
                        value={currentPrompt.role_text || ''}
                        onChange={e => setField('role_text', e.target.value)}
                        rows={3}
                        className="w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs text-white font-sans leading-relaxed"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-stone-400 mb-1">Negative Constraints Prompt</label>
                    <textarea
                        value={currentPrompt.negative_text || ''}
                        onChange={e => setField('negative_text', e.target.value)}
                        rows={2}
                        className="w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs text-rose-300 font-sans leading-relaxed"
                    />
                </div>

                <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 text-xs text-stone-300 font-bold cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!currentPrompt.enabled}
                            onChange={e => setField('enabled', e.target.checked)}
                            className="rounded border-white/20 text-amber-400"
                        />
                        <span>Enable this prompt for worker execution</span>
                    </label>

                    <button
                        type="button"
                        onClick={handleSavePrompt}
                        disabled={saving}
                        className="h-9 px-5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-400/20 active:scale-98 transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Save Prompt Row</span>
                    </button>
                </div>
            </div>
        </section>
    );
}

export default PromptManager;
