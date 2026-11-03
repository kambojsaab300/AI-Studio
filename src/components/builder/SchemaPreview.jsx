import React, { useState } from 'react';
import { Database, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/formatters';

export function SchemaPreview({ builderForm, inputs, labels, optional }) {
    const [tab, setTab] = useState('catalog'); // 'catalog' | 'prompt'
    const [copied, setCopied] = useState(false);

    const catalogPayload = {
        task_type: builderForm.task_type || '<tool_slug>',
        label: builderForm.label || '<Display Name>',
        customer_label: builderForm.customer_label || builderForm.label || '<Customer App Name>',
        hint: builderForm.hint || '<Short hint description>',
        output: builderForm.output,
        inputs,
        labels,
        optional,
        extras: !!builderForm.hasExtras,
        prompt_required: !!builderForm.promptRequired,
        face_check: !!builderForm.faceCheck,
        family: false,
        per_photo: !!builderForm.perPhoto,
        customer_visible: true,
        enabled: !!builderForm.enabled
    };

    const promptPayload = {
        task_type: builderForm.task_type || '<tool_slug>',
        system_text: builderForm.system_text,
        role_text: builderForm.role_text,
        negative_text: builderForm.negative_text,
        enabled: builderForm.enabled
    };

    const activeContent = tab === 'catalog' 
        ? JSON.stringify(catalogPayload, null, 2)
        : JSON.stringify(promptPayload, null, 2);

    const handleCopy = () => {
        copyToClipboard(activeContent, () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <section className="bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                        <Database className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white">Live DB Schema Preview</h3>
                        <p className="text-[10px] text-slate-400 font-mono">Row inserted into SQL Server tables</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleCopy}
                    className="h-7 px-2.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all"
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Schema'}</span>
                </button>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-1 bg-[#080b12] p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                <button
                    type="button"
                    onClick={() => setTab('catalog')}
                    className={`flex-1 py-1 px-2 rounded-lg text-center font-bold transition-all ${
                        tab === 'catalog' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    1. ai_studio_task_catalog
                </button>
                <button
                    type="button"
                    onClick={() => setTab('prompt')}
                    className={`flex-1 py-1 px-2 rounded-lg text-center font-bold transition-all ${
                        tab === 'prompt' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    2. ai_studio_prompts
                </button>
            </div>

            {/* Code Block */}
            <pre className="bg-[#080b12] border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-amber-300/90 overflow-x-auto max-h-[460px] scrollbar-thin leading-relaxed">
                <code>{activeContent}</code>
            </pre>
        </section>
    );
}

export default SchemaPreview;
