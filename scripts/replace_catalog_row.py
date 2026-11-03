import re

with open(r'E:\Mohit\photo tool\AI Studio\app\AI Studio Admin.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_catalog_row = """function CatalogRow({ row, apps, appTasks, onToggleApp, onToggle, onSave }) {
    const [f, setF] = useState(null);
    const start = () => setF({
        label: row.label || '',
        customer_label: row.customer_label || '',
        hint: row.hint || '',
        inputs: row.inputs || [],
        optional: row.optional || [],
        labels: row.labels || {}
    });
    const pick = (list, k, on) => (on ? [...list, k] : list.filter(x => x !== k));
    const cat = getToolCategory(row.task_type);
    const catObj = TOOL_CATEGORIES.find(c => c.id === cat) || TOOL_CATEGORIES[0];

    return (
        <div className="bg-[#0b0e17] border border-white/[0.08] hover:border-amber-400/40 rounded-2xl p-4 space-y-3 transition-all shadow-md group">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-base">{catObj.icon}</span>
                        <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">{row.label}</h3>
                    </div>
                    <p className="font-mono text-[10px] text-stone-400">{row.task_type} · <span className="uppercase text-amber-400 font-semibold">{row.output}</span></p>
                    {row.hint && <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">{row.hint}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${row.enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                        {row.enabled ? 'Active' : 'Disabled'}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-white/5 text-[11px] text-stone-300">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white font-medium">
                    <input type="checkbox" checked={row.enabled} onChange={e => onToggle(row.task_type, 'enabled', e.target.checked)} className="rounded border-white/20 text-amber-400 focus:ring-0 cursor-pointer" /> 
                    <span>Chalu</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white font-medium">
                    <input type="checkbox" checked={row.customer_visible} onChange={e => onToggle(row.task_type, 'customer_visible', e.target.checked)} className="rounded border-white/20 text-amber-400 focus:ring-0 cursor-pointer" /> 
                    <span>Customer App me</span>
                </label>
                {apps.map(a => (
                    <label key={a.app_id} className="flex items-center gap-1.5 cursor-pointer text-stone-400 hover:text-white font-medium">
                        <input type="checkbox" checked={appTasks.some(x => x.app_id === a.app_id && x.task_type === row.task_type)} onChange={e => onToggleApp(a.app_id, row.task_type, e.target.checked)} className="rounded border-white/20 text-amber-400 focus:ring-0 cursor-pointer" /> 
                        <span>{a.label}</span>
                    </label>
                ))}
                {!f && (
                    <button type="button" onClick={start} className="ml-auto text-amber-400 hover:text-amber-300 font-semibold underline text-[11px]">
                        Naam & Slots badlo ✎
                    </button>
                )}
            </div>

            {f && (
                <div className="space-y-3 pt-3 border-t border-white/10 bg-black/40 p-3 rounded-xl mt-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                            <label className="block text-[10px] text-stone-400 mb-1">Admin Label</label>
                            <input value={f.label} onChange={e => setF({ ...f, label: e.target.value })} placeholder="Admin naam" className="h-9 w-full bg-stone-900 border border-white/10 rounded-lg px-3 text-xs text-white" />
                        </div>
                        <div>
                            <label className="block text-[10px] text-stone-400 mb-1">Customer Label</label>
                            <input value={f.customer_label} onChange={e => setF({ ...f, customer_label: e.target.value })} placeholder="Customer naam" className="h-9 w-full bg-stone-900 border border-white/10 rounded-lg px-3 text-xs text-white" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] text-stone-400 mb-1">Customer Hint</label>
                        <textarea value={f.hint} onChange={e => setF({ ...f, hint: e.target.value })} rows={2} placeholder="Customer ke liye hint" className="w-full bg-stone-900 border border-white/10 rounded-lg p-2 text-xs text-white" />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-[10px] text-stone-400">Photo Slots Configuration</label>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {['face', 'style', 'input'].map(k => (
                                <div key={k} className="space-y-1.5 border border-white/10 rounded-xl p-2.5 bg-stone-950">
                                    <label className="flex items-center gap-1.5 text-xs text-stone-200 font-bold">
                                        <input type="checkbox" checked={f.inputs.includes(k)} onChange={e => setF({ ...f, inputs: pick(f.inputs, k, e.target.checked) })} className="rounded border-white/20 text-amber-400" /> 
                                        Slot: {k}
                                    </label>
                                    {f.inputs.includes(k) && (
                                        <>
                                            <input value={f.labels[k] || ''} onChange={e => setF({ ...f, labels: { ...f.labels, [k]: e.target.value } })} placeholder="Slot label" className="h-7 w-full bg-stone-900 border border-white/10 rounded px-2 text-[10px] text-white" />
                                            <label className="flex items-center gap-1 text-[10px] text-stone-400">
                                                <input type="checkbox" checked={f.optional.includes(k)} onChange={e => setF({ ...f, optional: pick(f.optional, k, e.target.checked) })} className="rounded border-white/20 text-amber-400" /> 
                                                Optional slot
                                            </label>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => setF(null)} className="h-8 px-3 border border-white/10 bg-stone-800 rounded-lg text-xs font-bold text-stone-300 hover:text-white">Cancel</button>
                        <button type="button" onClick={() => { onSave(row.task_type, f); setF(null); }} className="h-8 px-4 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-black">Save Changes</button>
                    </div>
                </div>
            )}
        </div>
    );
}"""

# Replace CatalogRow
pattern = r"function CatalogRow\(\{ row, apps, appTasks, onToggleApp, onToggle, onSave \}\) \{[\s\S]*?\n\}"
match = re.search(pattern, content)
if match:
    content = content[:match.start()] + new_catalog_row + content[match.end():]
    print("CatalogRow replaced successfully!")
else:
    print("CatalogRow pattern not found!")

with open(r'E:\Mohit\photo tool\AI Studio\app\AI Studio Admin.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
