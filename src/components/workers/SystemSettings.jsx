import React, { useState } from 'react';
import { Sliders, Save, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { TABLES } from '../../api/config';

export function SystemSettings() {
    const { sb, cfg, setCfg, setMsg, loadConfig } = useAdmin();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error: e1 } = await sb.from(TABLES.SETTINGS).update({
                task_concurrency: Number(cfg.task_concurrency),
                gemini_concurrency: Number(cfg.gemini_concurrency),
                photos_per_task_max: Number(cfg.photos_per_task_max) || 50,
                worker_recycle_after_tasks: Number(cfg.worker_recycle_after_tasks) || 50,
                task_timeout_sec: Number(cfg.task_timeout_sec) || 300,
                maintenance_on: !!cfg.maintenance_on,
                daily_gemini_budget: Number(cfg.daily_gemini_budget) || 1000,
                cloudinary_enabled: !!cfg.cloudinary_enabled,
                imgbb_enabled: !!cfg.imgbb_enabled,
                updated_at: new Date().toISOString()
            }).eq('id', 1);

            if (e1) throw e1;

            setSaved(true);
            setMsg('Fleet Settings save ho gayi hain!');
            setTimeout(() => setSaved(false), 3000);
            loadConfig();
        } catch (err) {
            setMsg('Save error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSendTestMail = async () => {
        setMsg('Test mail bheja ja raha hai...');
        const { error } = await sb.rpc('ai_studio_send_test_mail');
        setMsg(error ? 'Test mail error: ' + error.message : 'Test mail successfully sent! Check your inbox.');
    };

    return (
        <section className="bg-[#0b0e17] border border-white/10 rounded-3xl p-5 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                        <Sliders className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-sm sm:text-base font-extrabold text-white">Worker Fleet & Cloud Settings</h2>
                        <p className="text-xs text-stone-400">Concurrency limits, Cloudinary / ImgBB keys, and daily quotas</p>
                    </div>
                </div>

                {saved && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                    </span>
                )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <div>
                        <label className="block text-xs font-bold text-stone-300 mb-1">Task Concurrency (Per Worker)</label>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={cfg.task_concurrency || 1}
                            onChange={e => setCfg({ ...cfg, task_concurrency: e.target.value })}
                            className="w-full h-9 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs text-white font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-300 mb-1">Max Photos Per Task (Batch)</label>
                        <input
                            type="number"
                            min={1}
                            max={50}
                            value={cfg.photos_per_task_max || 50}
                            onChange={e => setCfg({ ...cfg, photos_per_task_max: e.target.value })}
                            className="w-full h-9 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs text-white font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-300 mb-1">Daily Gemini API Budget</label>
                        <input
                            type="number"
                            min={10}
                            max={100000}
                            value={cfg.daily_gemini_budget || 1000}
                            onChange={e => setCfg({ ...cfg, daily_gemini_budget: e.target.value })}
                            className="w-full h-9 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs text-white font-mono"
                        />
                    </div>
                </div>

                {/* Cloud Switches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-white/5">
                    <label className="flex items-center gap-2 text-xs text-stone-200 cursor-pointer p-3 bg-stone-950 rounded-xl border border-white/5">
                        <input
                            type="checkbox"
                            checked={!!cfg.cloudinary_enabled}
                            onChange={e => setCfg({ ...cfg, cloudinary_enabled: e.target.checked })}
                            className="rounded border-white/20 text-amber-400"
                        />
                        <span>Cloudinary Storage Enabled (Primary)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-stone-200 cursor-pointer p-3 bg-stone-950 rounded-xl border border-white/5">
                        <input
                            type="checkbox"
                            checked={!!cfg.maintenance_on}
                            onChange={e => setCfg({ ...cfg, maintenance_on: e.target.checked })}
                            className="rounded border-white/20 text-rose-400"
                        />
                        <span className="text-rose-300 font-bold">Fleet Maintenance Mode (Stop Task Pickup)</span>
                    </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleSendTestMail}
                        className="h-9 px-3 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors"
                    >
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        <span>Send Brevo Test Mail</span>
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="h-9 px-5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-400/20 active:scale-98 transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Save Fleet Settings</span>
                    </button>
                </div>
            </form>
        </section>
    );
}

export default SystemSettings;
