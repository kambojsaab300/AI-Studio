import React, { useState } from 'react';
import { Code, Copy, Check, Send } from 'lucide-react';
import { copyToClipboard } from '../../utils/formatters';
import { API_URL } from '../../api/config';

export function JsonConsole({ row, preview, onSendTask }) {
    const [tab, setTab] = useState('payload'); // 'payload' | 'model' | 'curl' | 'response'
    const [copied, setCopied] = useState(false);

    const apiPayload = JSON.stringify(row, null, 2);
    const modelPayload = JSON.stringify(preview, null, 2);

    const curlSnippet = `# 1. cURL API Call (MonsterASP / .NET Core):
curl -X POST "${API_URL}/rest/v1/rpc/upload_ai_studio_task" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ p_payload: row }, null, 2)}'`;

    const sampleResponse = JSON.stringify({
        id: 38,
        status: "done",
        output_image_url: "https://res.cloudinary.com/draaqjcre/image/upload/v1730000000/generated_output.jpg",
        face_match_score: 98.4,
        duration_ms: 3420,
        worker_id: "worker_01"
    }, null, 2);

    const activeContent = tab === 'payload' ? apiPayload 
        : tab === 'model' ? modelPayload 
        : tab === 'curl' ? curlSnippet 
        : sampleResponse;

    const handleCopy = () => {
        copyToClipboard(activeContent, () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <section className="bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4 shadow-xl">
            {/* Header & Copy Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                        <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white">Live API Payload</h3>
                        <p className="text-[10px] text-slate-400 font-mono hidden sm:block">JSON & Model cURL</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleCopy}
                    className="h-7 sm:h-8 px-2.5 sm:px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg sm:rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-1 bg-[#080b12] p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                {[
                    { id: 'payload', label: '1. Task JSON' },
                    { id: 'model', label: '2. Gemini Body' },
                    { id: 'curl', label: '3. cURL' },
                    { id: 'response', label: '4. Output Schema' }
                ].map(t => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`flex-1 py-1 px-1.5 rounded-lg text-center font-bold transition-all truncate ${
                            tab === t.id ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Live Code Preview */}
            <div className="relative">
                <pre className="bg-[#080b12] border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[360px] sm:max-h-[420px] scrollbar-thin leading-relaxed selection:bg-emerald-500/30">
                    <code>{activeContent}</code>
                </pre>
            </div>

            {/* Quick Actions & Guidance */}
            <div className="space-y-1.5 pt-1">
                <button
                    type="button"
                    onClick={onSendTask}
                    className="w-full h-8 sm:h-9 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                    <Send className="w-3.5 h-3.5" />
                    <span>Test This Payload</span>
                </button>
            </div>
        </section>
    );
}

export default JsonConsole;
