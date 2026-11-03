import re

with open(r'E:\Mohit\photo tool\AI Studio\app\AI Studio Admin.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find where the main JSX return of AiStudioAdmin begins
# It starts around: return (\n        <div className="min-h-screen
pattern_return = r"return \(\s*<div className=\"min-h-screen bg-stone-950 text-stone-100[\s\S]*?\n    \);\s*\n\}"
match = re.search(pattern_return, content)

if not match:
    print("Could not find main return block!")
    exit(1)

print(f"Found main return block from char {match.start()} to {match.end()} (length {match.end() - match.start()})")

new_return = """    const allCatalogList = catalog.length ? catalog : Object.entries(TASK_TYPES).map(([k, t]) => ({ task_type: k, label: t.label, output: t.output, inputs: t.inputs }));
    const filteredTools = allCatalogList.filter(t => {
        const cat = getToolCategory(t.task_type);
        const matchesCategory = selectedCategory === 'all' || cat === selectedCategory;
        const matchesSearch = !toolSearch || (t.label || '').toLowerCase().includes(toolSearch.toLowerCase()) || (t.task_type || '').toLowerCase().includes(toolSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#07080d] text-slate-100 font-sans selection:bg-amber-400 selection:text-black">
            {/* ── Top Navigation Bar (Glassmorphism Web App Header) ── */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#090b14]/85 border-b border-white/[0.08] px-4 lg:px-8 py-3.5 transition-all">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5">
                            <span className="bg-gradient-to-tr from-amber-400 to-amber-200 text-stone-950 px-2.5 py-1 rounded-xl font-black text-xs tracking-wider shadow-md shadow-amber-400/20">
                                AI STUDIO
                            </span>
                            <span className="text-white font-black text-sm tracking-tight hidden sm:inline">
                                PRO SUITE
                            </span>
                        </div>
                        <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-[11px] font-mono font-semibold">.NET API Live</span>
                        </div>
                    </div>

                    {/* Nav Tabs */}
                    <nav className="flex items-center gap-1.5 bg-[#0e111c] border border-white/10 p-1 rounded-2xl shadow-inner">
                        {[
                            { id: 'task', label: 'Studio', icon: '🚀' },
                            { id: 'tools', label: 'Tools (62)', icon: '🛠️' },
                            { id: 'workers', label: 'Workers', icon: '⚡' },
                            { id: 'features', label: 'Overview', icon: '📑' }
                        ].map(tab => {
                            const active = screen === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setScreen(tab.id)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                        active 
                                            ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20 font-extrabold' 
                                            : 'text-stone-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Actions & User */}
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={refreshAll}
                            title="Force Refresh Data"
                            className="h-8 px-3 rounded-xl border border-white/10 bg-[#0e111c] hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Refresh</span>
                        </button>
                        <div className="h-8 px-3 rounded-xl border border-white/10 bg-[#0e111c] text-stone-300 text-xs font-mono flex items-center gap-2 hidden lg:flex">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <span>{session.user.email}</span>
                        </div>
                        <button
                            type="button"
                            onClick={logout}
                            title="Logout"
                            className="h-8 px-3 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Notification message toast */}
            {msg && (
                <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-3">
                    <div className="bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs rounded-xl px-4 py-2.5 flex items-center justify-between shadow-lg">
                        <span>{msg}</span>
                        <button type="button" onClick={() => setMsg('')} className="text-amber-400 hover:text-white font-bold ml-2">✕</button>
                    </div>
                </div>
            )}

            {/* ── Main Container ── */}
            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">

                {/* ══════════════════════════════════════════════════════════════════
                    SCREEN 1: STUDIO (TASK CREATION & REALTIME RESULTS CHAT STREAM)
                   ══════════════════════════════════════════════════════════════════ */}
                {screen === 'task' && (
                    <div className="space-y-6">
                        {/* ── 1. Studio Tools Visual Library (Website Style Tool Browser) ── */}
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        Commercial AI Studio Catalog
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold ml-1.5">
                                            {filteredTools.length} Tools Live
                                        </span>
                                    </h2>
                                    <p className="text-xs text-stone-400 mt-0.5">Click any tool to activate its dedicated photoshoot studio and controls</p>
                                </div>
                                <div className="relative w-full sm:w-80">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input 
                                        type="text" 
                                        value={toolSearch} 
                                        onChange={e => setToolSearch(e.target.value)} 
                                        placeholder="Search tool (suit, combo, saree, footwear...)" 
                                        className="w-full h-9 pl-9 pr-3 bg-stone-950 border border-white/10 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                                {TOOL_CATEGORIES.map(cat => {
                                    const count = cat.id === 'all' 
                                        ? allCatalogList.length
                                        : allCatalogList.filter(c => getToolCategory(c.task_type) === cat.id).length;
                                    const active = selectedCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                active 
                                                    ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20 font-extrabold scale-102' 
                                                    : 'bg-[#121524] hover:bg-stone-800 text-stone-300 border border-white/5'
                                            }`}
                                        >
                                            <span>{cat.icon}</span>
                                            <span>{cat.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${active ? 'bg-black/20 text-black' : 'bg-white/10 text-stone-400'}`}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Visual Tool Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-60 overflow-y-auto pr-1">
                                {filteredTools.map(t => {
                                    const isSelected = form.task_type === t.task_type;
                                    const category = getToolCategory(t.task_type);
                                    const catObj = TOOL_CATEGORIES.find(c => c.id === category) || TOOL_CATEGORIES[0];
                                    return (
                                        <button
                                            key={t.task_type}
                                            type="button"
                                            onClick={() => changeTaskType(t.task_type)}
                                            className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between space-y-2 relative overflow-hidden group ${
                                                isSelected 
                                                    ? 'bg-gradient-to-b from-amber-400/20 to-amber-500/5 border-amber-400 text-white shadow-lg shadow-amber-400/10' 
                                                    : 'bg-stone-950/70 hover:bg-stone-900 border-white/10 text-stone-300 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-xl">{catObj.icon}</span>
                                                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                                                    isSelected ? 'bg-amber-400 text-stone-950 font-bold border-amber-300' : 'bg-white/5 text-stone-400 border-white/5'
                                                }`}>
                                                    {t.output === 'image' ? 'Photo' : 'Text'}
                                                </span>
                                            </div>
                                            <p className={`text-xs font-bold line-clamp-2 leading-tight ${isSelected ? 'text-amber-300' : 'text-stone-200 group-hover:text-white'}`}>
                                                {t.label}
                                            </p>
                                            <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono pt-1.5 border-t border-white/5 w-full">
                                                <span>{t.inputs?.length ? `${t.inputs.length} slot` : 'Prompt'}</span>
                                                {isSelected && <span className="text-amber-400 font-bold">Selected ✓</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* ── 2. Interactive Studio Workbench (2-Column Studio Grid) ── */}
                        <div className="grid gap-6 lg:grid-cols-12 items-start">
                            
                            {/* LEFT COLUMN (7 Cols): Creation Console & Inputs */}
                            <section className="lg:col-span-7 bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-5 shadow-2xl">
                                
                                {/* Active Tool Banner */}
                                <div className="bg-gradient-to-r from-amber-400/10 via-amber-400/5 to-transparent border border-amber-400/30 rounded-2xl p-4 flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">
                                                {(TOOL_CATEGORIES.find(c => c.id === getToolCategory(form.task_type)) || TOOL_CATEGORIES[0]).icon}
                                            </span>
                                            <h3 className="text-sm font-extrabold text-white">{type.label || form.task_type}</h3>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-stone-300">{form.task_type}</span>
                                        </div>
                                        <p className="text-xs text-stone-300 leading-relaxed">
                                            {catalog.find(c => c.task_type === form.task_type)?.hint || 'Select references, model settings and prompt to generate high-resolution commercial images.'}
                                        </p>
                                    </div>
                                    <select 
                                        value={form.task_type} 
                                        onChange={e => changeTaskType(e.target.value)} 
                                        className="h-9 bg-stone-950 border border-white/20 rounded-xl px-2.5 text-xs text-stone-200 font-semibold focus:outline-none focus:border-amber-400"
                                    >
                                        {allCatalogList.map(c => <option key={c.task_type} value={c.task_type}>{c.label}</option>)}
                                    </select>
                                </div>

                                {/* Model & Quality Pills */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                                        <span>AI Engine Model</span>
                                    </label>
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        {modelOptions.map(m => {
                                            const active = form.model === m;
                                            const c = capsOf(m);
                                            return (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => changeModel(m)}
                                                    className={`p-2.5 rounded-xl text-left border transition-all ${
                                                        active 
                                                            ? 'bg-amber-400/15 border-amber-400 text-white font-bold shadow-md shadow-amber-400/10' 
                                                            : 'bg-stone-950 border-white/10 text-stone-400 hover:text-stone-200 hover:border-white/20'
                                                    }`}
                                                >
                                                    <p className="text-xs font-bold">{c.label || m}</p>
                                                    <p className="text-[10px] font-mono text-stone-500 truncate">{m}</p>
                                                    <div className="flex gap-1 mt-1 text-[9px] font-mono">
                                                        {c.sizes?.length ? <span className="text-amber-300">{c.sizes.join(', ')}</span> : null}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Aspect Ratio & Batch Settings */}
                                {caps.kind === 'image' && (
                                    <div className="grid gap-3 sm:grid-cols-3 bg-stone-950/60 border border-white/5 p-3 rounded-2xl">
                                        <div>
                                            <label className="block text-[11px] font-bold text-stone-400 mb-1">Aspect Ratio</label>
                                            <div className="flex flex-wrap gap-1">
                                                {caps.aspects.map(a => (
                                                    <button
                                                        key={a}
                                                        type="button"
                                                        onClick={() => setForm({ ...form, aspect_ratio: a })}
                                                        className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                                                            form.aspect_ratio === a 
                                                                ? 'bg-amber-400 text-stone-950 border-amber-400' 
                                                                : 'bg-stone-900 border-white/10 text-stone-400 hover:text-white'
                                                        }`}
                                                    >
                                                        {a}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-stone-400 mb-1">Image Resolution</label>
                                            <select 
                                                value={form.image_size} 
                                                onChange={e => setForm({ ...form, image_size: e.target.value })} 
                                                disabled={!caps.sizes.length} 
                                                className="h-8 w-full bg-stone-900 border border-white/10 rounded-xl px-2 text-xs text-stone-200 font-mono disabled:opacity-40"
                                            >
                                                {(caps.sizes.length ? caps.sizes : ['']).map(s => <option key={s} value={s}>{s || 'Default Size'}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-stone-400 mb-1">Batch Count (1-4)</label>
                                            <input 
                                                type="number" 
                                                min={1} 
                                                max={10} 
                                                value={form.batch_count} 
                                                onChange={e => setForm({ ...form, batch_count: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })} 
                                                className="h-8 w-full bg-stone-900 border border-white/10 rounded-xl px-2 text-xs text-stone-200 font-mono" 
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Dedicated Angle / Pose Chips (for Suit Studio, 5-Pose Combo, Pose Change) */}
                                {type.angles && type.angles.length > 0 && (
                                    <div className="space-y-2 bg-[#121524] border border-amber-400/20 p-3.5 rounded-2xl">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                                                <span>📸 Photoshoot Poses & Angles Presets</span>
                                            </label>
                                            <span className="text-[10px] text-stone-400 font-mono">Click to insert into prompt</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {type.angles.map(ang => (
                                                <button
                                                    key={ang}
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, prompt: f.prompt ? `${f.prompt}, ${ang}` : ang }))}
                                                    className="px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-amber-400 hover:text-stone-950 text-stone-300 text-xs font-semibold border border-white/10 transition-all text-left"
                                                >
                                                    + {ang.split('(')[0].trim()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Visual Reference Image Upload Dropzones */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
                                        <span>Reference Photos</span>
                                        <span className="text-[11px] text-stone-500 font-mono">
                                            {type.inputs.length === 0 ? 'No reference photos required' : `${type.inputs.length} slots`}
                                        </span>
                                    </label>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {type.inputs.map(key => {
                                            const col = INPUT_COLUMN[key];
                                            const val = form[col];
                                            const label = labelFor(type, key);
                                            const isOpt = type.optional?.includes(key);

                                            if (type.edit && key === 'style') {
                                                return <MaskBlock key={key} label={label} photoUrl={form.face_image_url} maskUrl={form.style_image_url} onSave={saveMask} />;
                                            }

                                            return (
                                                <div key={key} className="bg-stone-950 border border-white/10 rounded-2xl p-3 space-y-2 relative overflow-hidden group">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-stone-200">{label}</span>
                                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isOpt ? 'text-stone-500 bg-white/5' : 'text-amber-400 bg-amber-400/10 font-bold'}`}>
                                                            {isOpt ? 'Optional' : 'Required *'}
                                                        </span>
                                                    </div>

                                                    {val ? (
                                                        <div className="space-y-2">
                                                            <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/10 h-32 flex items-center justify-center">
                                                                <img src={val} alt={label} className="h-full w-full object-contain" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setForm({ ...form, [col]: '' })}
                                                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-500 text-white transition-colors"
                                                                    title="Remove photo"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <input 
                                                                value={val} 
                                                                onChange={e => setForm({ ...form, [col]: e.target.value })} 
                                                                placeholder="Photo URL" 
                                                                className="h-8 w-full bg-stone-900 border border-white/10 rounded-lg px-2 text-[11px] text-stone-300 font-mono" 
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="border border-dashed border-white/15 rounded-xl p-4 text-center space-y-2 hover:border-amber-400/50 transition-colors bg-stone-900/30">
                                                            <Upload className="w-6 h-6 mx-auto text-stone-500" />
                                                            <div className="space-y-1">
                                                                <label className="cursor-pointer text-xs font-bold text-amber-400 hover:text-amber-300 block">
                                                                    Upload from device
                                                                    <input type="file" accept="image/*" className="hidden" onChange={e => pickFile(e, col)} />
                                                                </label>
                                                                <p className="text-[10px] text-stone-500 font-mono">or paste URL below</p>
                                                            </div>
                                                            <input 
                                                                value={form[col]} 
                                                                onChange={e => setForm({ ...form, [col]: e.target.value })} 
                                                                placeholder="https://..." 
                                                                className="h-7 w-full bg-stone-900 border border-white/10 rounded px-2 text-[11px] text-stone-300 font-mono text-center" 
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Family Photo Roles if family task */}
                                {type.family && (
                                    <div className="space-y-2.5 bg-[#121524] border border-white/10 p-4 rounded-2xl">
                                        <p className="text-xs font-bold text-white">Family Members Slots (minimum 2 members)</p>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {FAMILY_ROLES.map((role, i) => (
                                                <div key={role.role_key} className="space-y-1 bg-stone-950 p-2.5 rounded-xl border border-white/5">
                                                    <span className="text-[11px] font-bold text-stone-300">{role.label_admin}</span>
                                                    <div className="flex gap-2">
                                                        <input value={form.family_urls[i]} onChange={e => setFamilyUrl(i, e.target.value)} placeholder="Photo link" className="h-8 w-full bg-stone-900 border border-white/10 rounded-lg px-2 text-xs font-mono" />
                                                        <label className="h-8 px-2.5 flex items-center bg-stone-800 rounded-lg text-xs font-bold cursor-pointer hover:bg-stone-700">
                                                            <Upload className="w-3 h-3" />
                                                            <input type="file" accept="image/*" className="hidden" onChange={e => pickFamilyFile(e, i)} />
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Prompt Input Area */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <label className="font-bold text-stone-200">
                                            Creative Prompt {type.promptRequired ? <span className="text-amber-400 font-bold">* Required</span> : <span className="text-stone-500 font-mono">(Optional)</span>}
                                        </label>
                                        <span className="text-[11px] text-stone-500 font-mono">{form.prompt.length} chars</span>
                                    </div>
                                    <textarea 
                                        value={form.prompt} 
                                        onChange={e => setForm({ ...form, prompt: e.target.value })} 
                                        rows={3} 
                                        placeholder={type.promptRequired ? "Describe what to generate, outfit colors, lighting, studio background..." : "Extra styling details, environment, lighting, pose specifics (optional)..."} 
                                        className="w-full bg-stone-950 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors font-sans leading-relaxed" 
                                    />
                                </div>

                                {form.task_type === 'chat' && (
                                    <input value={form.conversation_id} onChange={e => setForm({ ...form, conversation_id: e.target.value })} placeholder="Conversation ID (optional for multi-turn chat)" className="h-9 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                )}

                                {/* Action Button */}
                                <div className="pt-2">
                                    <button 
                                        type="button" 
                                        onClick={sendTask} 
                                        className="w-full h-12 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-stone-950 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-amber-400/20 active:scale-98 transition-all"
                                    >
                                        <Sparkles className="w-4 h-4 text-stone-950" />
                                        <span>Generate Task & Send to Worker Fleet</span>
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </section>

                            {/* RIGHT COLUMN (5 Cols): Live Activity & Realtime Chat Stream */}
                            <section className="lg:col-span-5 space-y-5">
                                <div className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-2xl">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                                        <h2 className="text-sm font-extrabold flex items-center gap-2 text-white">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                            Live Output Feed (Chat Stream)
                                        </h2>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-stone-500 font-mono">Sync 2s</span>
                                            <button 
                                                type="button" 
                                                onClick={syncLiveTasks} 
                                                className="h-7 px-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-lg text-xs font-bold border border-white/10 transition-colors"
                                            >
                                                Refresh
                                            </button>
                                        </div>
                                    </div>

                                    {liveTasks.length === 0 ? (
                                        <div className="p-8 text-center space-y-2 border border-dashed border-white/10 rounded-2xl bg-stone-950/40">
                                            <Camera className="w-8 h-8 mx-auto text-stone-600" />
                                            <p className="text-xs text-stone-400 font-semibold">Feed is ready</p>
                                            <p className="text-[11px] text-stone-500 leading-relaxed">
                                                Click Generate to dispatch a task. The live progress, worker claiming, and generated photo/text will appear right here!
                                            </p>
                                        </div>
                                    ) : (
                                        <div ref={liveRef} className="space-y-3.5 max-h-[640px] overflow-y-auto pr-1">
                                            {liveTasks.map(t => (
                                                <div key={t.id} className="bg-stone-950 border border-white/10 rounded-2xl p-3.5 space-y-2.5 shadow-md">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-white/5 pb-2">
                                                        <span>
                                                            <span className="font-mono font-bold text-amber-300 text-sm">#{t.id}</span> · 
                                                            <span className="font-bold text-sky-300 ml-1.5">{apps.find(a => a.app_id === t.app_id)?.label || t.app_id}</span> · 
                                                            <span className="text-stone-300 ml-1.5">{typeOf(t.task_type).label || t.task_type}</span>
                                                            {t.worker_id && <span className="font-mono text-stone-500 ml-2">({t.worker_id})</span>}
                                                        </span>
                                                        <span className="flex items-center gap-2">
                                                            <button type="button" onClick={() => setViewTask(t)} className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 text-[11px] font-bold">Inspect</button>
                                                            {t.duration_ms != null && (
                                                                <span className="font-mono text-stone-400 text-[11px]">
                                                                    {(t.duration_ms / 1000).toFixed(1)}s
                                                                </span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                                t.status === 'done' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 
                                                                t.status === 'failed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 
                                                                t.status === 'processing' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 animate-pulse' :
                                                                'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                            }`}>
                                                                {t.status}
                                                            </span>
                                                        </span>
                                                    </div>

                                                    {t.prompt && (
                                                        <p className="text-xs text-stone-300 bg-stone-900/60 p-2.5 rounded-xl border border-white/5 font-sans">
                                                            <span className="text-stone-500 font-bold mr-1.5">Prompt:</span>{t.prompt}
                                                        </p>
                                                    )}

                                                    {/* Generated Photo (Cloudinary) */}
                                                    {t.output_image_url && (
                                                        <div className="space-y-1.5 bg-stone-900/40 p-2.5 rounded-xl border border-white/5">
                                                            <div className="flex items-center justify-between text-[11px]">
                                                                <span className="text-sky-300 font-semibold flex items-center gap-1">🖼️ Generated Result (Cloudinary)</span>
                                                                <a href={t.output_image_url} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline font-mono text-[10px] flex items-center gap-1">
                                                                    Open Full ↗
                                                                </a>
                                                            </div>
                                                            <img src={t.output_image_url} alt="" className="max-h-72 w-full rounded-lg object-contain bg-black/40 border border-white/10" />
                                                        </div>
                                                    )}

                                                    {/* Original ImgBB image if no Cloudinary */}
                                                    {t.imgbb_image_urls?.[0] && !t.output_image_url && (
                                                        <div className="space-y-1.5 bg-stone-900/40 p-2.5 rounded-xl border border-white/5">
                                                            <div className="flex items-center justify-between text-[11px]">
                                                                <span className="text-emerald-300 font-semibold">🖼️ Generated Result (ImgBB)</span>
                                                                <a href={t.imgbb_image_urls[0]} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline font-mono text-[10px] flex items-center gap-1">
                                                                    Open Full ↗
                                                                </a>
                                                            </div>
                                                            <img src={t.imgbb_image_urls[0]} alt="" className="max-h-72 w-full rounded-lg object-contain bg-black/40 border border-white/10" />
                                                        </div>
                                                    )}

                                                    {/* Chat / text response */}
                                                    {t.output_text && (
                                                        <div className="bg-stone-900/80 p-3 rounded-xl border border-emerald-500/20 space-y-1">
                                                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">AI Response:</p>
                                                            <ChatText text={t.output_text} />
                                                        </div>
                                                    )}

                                                    {t.error && (
                                                        <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-xs text-rose-300">
                                                            <span className="font-bold">Error:</span> {t.error}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* ── 3. Searchable Results History Table (Bottom) ── */}
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-2xl">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-extrabold text-white">Tasks & Results Database History</h2>
                                    <p className="text-xs text-stone-400">Search and audit all completed, processing, and failed tasks</p>
                                </div>
                                <div className="flex gap-1.5">
                                    {[['pending', 'Pending'], ['processing', 'Processing'], ['done', 'Completed'], ['failed', 'Failed']].map(([key, label]) => (
                                        <button 
                                            key={key} 
                                            type="button" 
                                            onClick={() => pickResultTab(key)} 
                                            className={`h-8 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                resultTab === key 
                                                    ? 'bg-amber-400 text-stone-950 border-amber-300 font-black' 
                                                    : 'bg-stone-950 border-white/10 text-stone-400 hover:text-white'
                                            }`}
                                        >
                                            {label}{resultCounts[key] != null ? ` (${resultCounts[key]})` : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="text-left text-stone-400 border-b border-white/10">
                                        <tr>
                                            <th className="p-2.5 font-bold"># ID</th>
                                            <th className="p-2.5 font-bold">App</th>
                                            <th className="p-2.5 font-bold">Task Type</th>
                                            <th className="p-2.5 font-bold">Model</th>
                                            <th className="p-2.5 font-bold">Worker</th>
                                            <th className="p-2.5 font-bold">Duration</th>
                                            <th className="p-2.5 font-bold">Output</th>
                                            <th className="p-2.5 font-bold">Status</th>
                                            <th className="p-2.5 font-bold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-mono">
                                        {resultRows.map(t => (
                                            <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-2.5 text-amber-300 font-bold">#{t.id}</td>
                                                <td className="p-2.5 font-sans font-bold text-sky-300">{apps.find(a => a.app_id === t.app_id)?.label || t.app_id}</td>
                                                <td className="p-2.5 font-sans text-stone-200">{typeOf(t.task_type).label || t.task_type}</td>
                                                <td className="p-2.5 text-stone-400 text-[11px]">{t.model}</td>
                                                <td className="p-2.5 text-stone-400 text-[11px]">{t.worker_id || '—'}</td>
                                                <td className="p-2.5 text-stone-300 text-[11px]">{t.duration_ms != null ? `${(t.duration_ms / 1000).toFixed(1)}s` : '—'}</td>
                                                <td className="p-2.5">
                                                    {t.output_image_url && <a href={t.output_image_url} target="_blank" rel="noreferrer" className="text-sky-300 underline mr-2 font-sans font-semibold">Cloudinary ↗</a>}
                                                    {t.imgbb_image_urls?.[0] && <a href={t.imgbb_image_urls[0]} target="_blank" rel="noreferrer" className="text-emerald-300 underline mr-2 font-sans font-semibold">ImgBB ↗</a>}
                                                    {t.output_text && <span className="text-stone-300 font-sans">{t.output_text.slice(0, 50)}...</span>}
                                                    {!t.output_image_url && !t.imgbb_image_urls?.[0] && !t.output_text && '—'}
                                                </td>
                                                <td className="p-2.5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        t.status === 'done' ? 'text-emerald-300 bg-emerald-500/10' : 
                                                        t.status === 'failed' ? 'text-rose-300 bg-rose-500/10' : 
                                                        'text-amber-300 bg-amber-500/10'
                                                    }`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="p-2.5">
                                                    <button type="button" onClick={() => setViewTask(t)} className="text-amber-400 hover:text-amber-300 font-sans font-bold underline">Inspect</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SCREEN 2: TOOLS & CATALOG MANAGER (ALL 62 COMMERCIAL TOOLS)
                   ══════════════════════════════════════════════════════════════════ */}
                {screen === 'tools' && (
                    <div className="space-y-6">
                        {/* Tools Catalog Section */}
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-2xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                                <div>
                                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-amber-400" />
                                        Task Types Catalog ({catalog.length} Tools in System)
                                    </h2>
                                    <p className="text-xs text-stone-400 mt-0.5">Toggle live status, customer app exposure, and app channel assignments</p>
                                </div>
                                <div className="relative w-full sm:w-72">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input 
                                        type="text" 
                                        value={catalogFilter} 
                                        onChange={e => setCatalogFilter(e.target.value)} 
                                        placeholder="Search tool (suit, combo, saree...)" 
                                        className="w-full h-9 pl-9 pr-3 bg-stone-950 border border-white/10 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400" 
                                    />
                                </div>
                            </div>

                            {/* Category Filter Pills for Catalog */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                                {TOOL_CATEGORIES.map(cat => {
                                    const active = selectedCategory === cat.id;
                                    const count = cat.id === 'all' 
                                        ? catalog.length 
                                        : catalog.filter(c => getToolCategory(c.task_type) === cat.id).length;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                active 
                                                    ? 'bg-amber-400 text-stone-950 font-bold' 
                                                    : 'bg-[#121524] hover:bg-stone-800 text-stone-300 border border-white/5'
                                            }`}
                                        >
                                            <span>{cat.icon}</span>
                                            <span>{cat.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${active ? 'bg-black/20 text-black' : 'bg-white/10 text-stone-400'}`}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Catalog Cards Grid */}
                            <div className="grid gap-3 sm:grid-cols-2 max-h-[700px] overflow-y-auto pr-1">
                                {catalog
                                    .filter(c => (selectedCategory === 'all' || getToolCategory(c.task_type) === selectedCategory) && (!catalogFilter || c.label.toLowerCase().includes(catalogFilter.toLowerCase()) || c.task_type.toLowerCase().includes(catalogFilter.toLowerCase())))
                                    .map(c => <CatalogRow key={c.task_type} row={c} apps={apps} appTasks={appTasks} onToggleApp={toggleAppTask} onToggle={toggleCatalog} onSave={saveCatalogRow} />)}
                            </div>
                        </section>

                        {/* Worker Tool Assignments & Engine Mapping */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Worker Assignments */}
                            <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-amber-400" />
                                    Worker Task Types Assignment
                                </h2>
                                <p className="text-xs text-stone-400">Choose which workers run which task types (or 'Sab kaam' for full coverage)</p>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                    {workerTools.map(w => (
                                        <div key={w.worker_id} className="bg-stone-950 border border-white/10 rounded-2xl p-3.5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-xs font-bold text-amber-300">{w.worker_id}</span>
                                                <label className="flex items-center gap-1.5 text-xs text-stone-200 font-bold cursor-pointer">
                                                    <input type="checkbox" checked={w.task_types === null} onChange={e => toggleWorkerAll(w, e.target.checked)} className="rounded border-white/20 text-amber-400" />
                                                    <span>Sab Kaam (Run All 62)</span>
                                                </label>
                                            </div>
                                            {w.task_types !== null && (
                                                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                                                    {catalog.filter(c => c.enabled).map(c => (
                                                        <label key={c.task_type} className="flex items-center gap-1 text-[11px] text-stone-300 bg-stone-900 px-2 py-1 rounded-lg border border-white/5">
                                                            <input type="checkbox" checked={(w.task_types || []).includes(c.task_type)} onChange={e => toggleWorkerTaskType(w, c.task_type, e.target.checked)} className="rounded border-white/20 text-amber-400" />
                                                            <span>{c.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Task Type to Engine Mapping */}
                            <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <Sliders className="w-4 h-4 text-amber-400" />
                                        Task Engine Mappings ({toolTypes.length})
                                    </h2>
                                    <input value={toolTypeFilter} onChange={e => setToolTypeFilter(e.target.value)} placeholder="Filter mapping..." className="h-8 w-44 bg-stone-950 border border-white/10 rounded-xl px-2.5 text-xs text-white" />
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2 max-h-96 overflow-y-auto pr-1">
                                    {toolTypes
                                        .filter(r => !toolTypeFilter || r.task_type.toLowerCase().includes(toolTypeFilter.toLowerCase()) || r.tool.toLowerCase().includes(toolTypeFilter.toLowerCase()))
                                        .map(r => (
                                            <div key={r.task_type} className="flex items-center justify-between gap-2 bg-stone-950 border border-white/10 rounded-xl p-2.5">
                                                <span className="font-mono text-[11px] text-stone-300 truncate">{r.task_type}</span>
                                                <select value={r.tool} onChange={e => setTaskTool(r.task_type, e.target.value)} className="h-7 bg-stone-900 border border-white/10 rounded-lg px-2 text-xs text-amber-300 font-bold">
                                                    {tools.map(t => <option key={t.tool} value={t.tool}>{t.label}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SCREEN 3: WORKERS FLEET & PROMPTS STUDIO
                   ══════════════════════════════════════════════════════════════════ */}
                {screen === 'workers' && (
                    <div className="space-y-6">
                        {/* Metrics Stat Cards */}
                        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                            {[
                                ['Active Workers Fleet', liveWorkers.length, 'Online', 'text-emerald-400'],
                                ['Tasks In-Flight', workers.reduce((s, w) => s + (w.processing || 0), 0), 'Processing', 'text-sky-400'],
                                ['Total Completed Tasks', workers.reduce((s, w) => s + (w.done || 0), 0), 'Done', 'text-amber-400'],
                                ['Fair Sharing Limit', fairLimit, 'Tasks/Worker', 'text-stone-300']
                            ].map(([title, val, subtitle, col]) => (
                                <div key={title} className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-1 shadow-xl">
                                    <p className="text-xs text-stone-400 font-medium">{title}</p>
                                    <p className={`text-2xl font-black font-mono ${col}`}>{val}</p>
                                    <p className="text-[10px] text-stone-500 font-mono">{subtitle}</p>
                                </div>
                            ))}
                        </div>

                        {/* Workers Fleet Manager */}
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                                <div>
                                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <Users className="w-4 h-4 text-amber-400" />
                                        Worker Fleet Status ({workers.length} registered)
                                    </h2>
                                    <p className="text-xs text-stone-400 mt-0.5">Control live workers, view heartbeats and task load</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => togglePause('all', true)} className="h-8 px-3 rounded-xl border border-white/10 bg-stone-900 hover:bg-stone-800 text-xs font-bold text-stone-300 flex items-center gap-1.5"><Pause className="w-3.5 h-3.5" /> Pause All</button>
                                    <button onClick={() => togglePause('all', false)} className="h-8 px-3 rounded-xl border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 text-xs font-bold text-amber-300 flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Resume All</button>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {workers.map(w => {
                                    const alive = isAlive(w);
                                    return (
                                        <div key={w.worker_id} className="bg-stone-950 border border-white/10 rounded-2xl p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${alive && !w.paused ? 'bg-emerald-400 animate-pulse' : 'bg-stone-600'}`}></span>
                                                    <span className="font-mono text-xs font-bold text-white">{w.worker_id}</span>
                                                </div>
                                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                                    w.paused ? 'bg-amber-500/20 text-amber-300' : alive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-stone-800 text-stone-500'
                                                }`}>
                                                    {w.paused ? 'Paused' : alive ? 'Active' : 'Offline'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-stone-400 pt-2 border-t border-white/5">
                                                <div>Running: <span className="text-white font-bold">{w.processing || 0}</span></div>
                                                <div>Done: <span className="text-white font-bold">{w.done || 0}</span></div>
                                            </div>
                                            <div className="flex items-center justify-between pt-1 text-[11px]">
                                                <button 
                                                    type="button" 
                                                    onClick={() => togglePause(w.worker_id, !w.paused)} 
                                                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                                                        w.paused ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-stone-900 border-white/10 text-stone-300 hover:text-white'
                                                    }`}
                                                >
                                                    {w.paused ? 'Resume Worker' : 'Pause Worker'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Database Prompts Studio */}
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                                <div>
                                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-amber-400" />
                                        Task Prompts Studio (Database System Prompts)
                                    </h2>
                                    <p className="text-xs text-stone-400 mt-0.5">Workers dynamically load these instructions when generating images</p>
                                </div>
                                {promptSaved && <span className="text-xs text-emerald-400 font-bold">{promptSaved}</span>}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-300 mb-1.5">Select Tool to Edit Prompt:</label>
                                    <select 
                                        value={promptType} 
                                        onChange={e => { setPromptType(e.target.value); setPromptSaved(''); }} 
                                        className="h-10 w-full bg-stone-950 border border-white/10 rounded-xl px-3 text-xs text-white font-semibold"
                                    >
                                        {allCatalogList.filter(c => c.output === 'image').map(c => (
                                            <option key={c.task_type} value={c.task_type}>{c.label} ({c.task_type})</option>
                                        ))}
                                    </select>
                                </div>

                                {!prompts[promptType] ? (
                                    <p className="text-xs text-rose-300 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">Is kaam ka prompt database mein nahi hai.</p>
                                ) : (
                                    <div className="space-y-4 bg-stone-950 p-4 rounded-2xl border border-white/5">
                                        <label className="flex items-center gap-2 text-xs text-stone-200 font-bold cursor-pointer">
                                            <input type="checkbox" checked={prompts[promptType].enabled} onChange={e => setPromptField('enabled', e.target.checked)} className="rounded border-white/20 text-amber-400" /> 
                                            <span>Ye task type active hai</span>
                                        </label>
                                        <div>
                                            <label className="block text-[11px] text-stone-400 mb-1 font-semibold">System Text (Main Instructions)</label>
                                            <textarea rows={3} value={prompts[promptType].system_text} onChange={e => setPromptField('system_text', e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded-xl p-3 text-xs text-white font-mono" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-stone-400 mb-1 font-semibold">Role & Slot Rules (IMAGE 1 / IMAGE 2)</label>
                                            <textarea rows={4} value={prompts[promptType].role_text} onChange={e => setPromptField('role_text', e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded-xl p-3 text-xs text-white font-mono" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-stone-400 mb-1 font-semibold">Negative Constraints</label>
                                            <textarea rows={3} value={prompts[promptType].negative_text ?? ''} onChange={e => setPromptField('negative_text', e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded-xl p-3 text-xs text-white font-mono" />
                                        </div>
                                        <button onClick={savePrompt} className="h-10 px-5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black transition-all">Save Prompt Changes</button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Worker Settings & Security */}
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                                <div>
                                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                                        Global Worker Fleet Settings & Auto-Recycle
                                    </h2>
                                    <p className="text-xs text-stone-400 mt-0.5">Controls concurrency limits, RAM purge thresholds, Cloudinary and ImgBB keys</p>
                                </div>
                                {cfgSaved && <span className="text-xs text-emerald-400 font-bold">{cfgSaved}</span>}
                            </div>

                            {cfg && (
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-3 bg-stone-950 p-4 rounded-2xl border border-white/5">
                                        <p className="text-xs font-bold text-white">Upload Storage Providers</p>
                                        <label className="flex items-center gap-2 text-xs text-stone-300"><input type="checkbox" checked={cfg.cloudinary_enabled} onChange={e => setCfg({ ...cfg, cloudinary_enabled: e.target.checked })} /> Cloudinary Upload</label>
                                        <input value={cfg.cloudinary_cloud_name} onChange={e => setCfg({ ...cfg, cloudinary_cloud_name: e.target.value })} placeholder="Cloud name" className="h-9 w-full bg-stone-900 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                        <input value={cfg.cloudinary_upload_preset} onChange={e => setCfg({ ...cfg, cloudinary_upload_preset: e.target.value })} placeholder="Upload preset" className="h-9 w-full bg-stone-900 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                        <label className="flex items-center gap-2 text-xs text-stone-300 pt-2 border-t border-white/5"><input type="checkbox" checked={cfg.imgbb_enabled} onChange={e => setCfg({ ...cfg, imgbb_enabled: e.target.checked })} /> ImgBB Upload (Lossless Full Res)</label>
                                        <input type="password" value={cfg.imgbb_api_key} onChange={e => setCfg({ ...cfg, imgbb_api_key: e.target.value })} placeholder="ImgBB API Key" className="h-9 w-full bg-stone-900 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                    </div>

                                    <div className="space-y-3 bg-stone-950 p-4 rounded-2xl border border-white/5">
                                        <p className="text-xs font-bold text-white">Concurrency & Recycle Limits</p>
                                        {[
                                            ['task_concurrency', 'Worker Task Concurrency (1-50)', 1, 50],
                                            ['gemini_concurrency', 'Gemini Parallel Calls (1-16)', 1, 16],
                                            ['photos_per_task_max', 'Max Photos per Task (1-10)', 1, 10],
                                            ['worker_recycle_after_tasks', 'Worker Auto-Recycle & Purge (Tasks before reload)', 5, 500]
                                        ].map(([key, label, min, max]) => (
                                            <label key={key} className="block text-[11px] text-stone-300 space-y-1">{label}
                                                <input type="number" min={min} max={max} value={cfg[key] ?? (key === 'worker_recycle_after_tasks' ? 50 : min)} onChange={e => setCfg({ ...cfg, [key]: Math.min(max, Math.max(min, Number(e.target.value) || min)) })} className="h-9 w-full bg-stone-900 border border-white/10 rounded-xl px-3 text-xs font-mono" />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button onClick={saveConfig} disabled={!cfg} className="h-10 px-5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black transition-all">Save System Settings</button>
                        </section>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SCREEN 4: PLATFORM SPECS & OVERVIEW
                   ══════════════════════════════════════════════════════════════════ */}
                {screen === 'features' && (
                    <div className="space-y-6">
                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Platform Architecture & Features
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                {PLATFORM_FEATURES.map(f => (
                                    <div key={f.title} className="bg-stone-950 border border-white/10 rounded-2xl p-4 space-y-1.5">
                                        <p className="text-xs font-bold text-white">{f.title}</p>
                                        <p className="text-[11px] text-stone-400 leading-relaxed">{f.text}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                                    <Grid className="w-4 h-4 text-amber-400" />
                                    Task Types Engine Specs ({catalog.length || Object.keys(TASK_TYPES).length})
                                </h2>
                                <input value={featureFilter} onChange={e => setFeatureFilter(e.target.value)} placeholder="Filter specs..." className="h-8 w-60 bg-stone-950 border border-white/10 rounded-xl px-2.5 text-xs text-white" />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[650px] overflow-y-auto pr-1">
                                {Object.entries(TASK_TYPES)
                                    .filter(([k, t]) => !featureFilter || k.toLowerCase().includes(featureFilter.toLowerCase()) || (t.label || '').toLowerCase().includes(featureFilter.toLowerCase()))
                                    .map(([k, t]) => {
                                        const pr = prompts[k];
                                        return (
                                            <div key={k} className="bg-stone-950 border border-white/10 rounded-2xl p-4 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold text-white">{t.label}</p>
                                                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-stone-400">{t.output}</span>
                                                </div>
                                                <p className="font-mono text-[10px] text-amber-400/80">{k}</p>
                                                <p className="text-[11px] text-stone-400">Inputs: {t.family ? 'Family 6 slots' : t.inputs.length ? t.inputs.join(' + ') : 'Prompt only'}</p>
                                                <div className="text-[10px] text-stone-500 font-mono pt-1 border-t border-white/5 flex justify-between">
                                                    <span>Face Check: {t.faceCheck ? 'Yes' : 'No'}</span>
                                                    <span>Mask: {t.edit ? 'Yes' : 'No'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </section>
                    </div>
                )}
            </main>

            {/* Inspect Task Modal Drawer */}
            {viewTask && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#0b0e17] border border-white/15 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-sm font-extrabold text-white">Task Details #{viewTask.id}</h3>
                            <button type="button" onClick={() => setViewTask(null)} className="h-8 w-8 rounded-full bg-stone-800 text-white font-bold flex items-center justify-center hover:bg-stone-700">✕</button>
                        </div>
                        <div className="space-y-3 text-xs text-stone-300">
                            <div className="grid grid-cols-2 gap-2 bg-stone-950 p-3 rounded-xl font-mono text-[11px]">
                                <div>Status: <span className="text-amber-400 font-bold uppercase">{viewTask.status}</span></div>
                                <div>Worker: <span className="text-white">{viewTask.worker_id || 'None'}</span></div>
                                <div>Task Type: <span className="text-white">{viewTask.task_type}</span></div>
                                <div>Model: <span className="text-white">{viewTask.model}</span></div>
                            </div>
                            {viewTask.prompt && (
                                <div>
                                    <span className="font-bold text-stone-400 block mb-1">Prompt:</span>
                                    <p className="bg-stone-950 p-2.5 rounded-xl border border-white/5 font-sans">{viewTask.prompt}</p>
                                </div>
                            )}
                            {viewTask.output_image_url && (
                                <div>
                                    <span className="font-bold text-sky-400 block mb-1">Output Image (Cloudinary):</span>
                                    <img src={viewTask.output_image_url} alt="" className="max-h-80 rounded-xl mx-auto border border-white/10" />
                                </div>
                            )}
                            {viewTask.imgbb_image_urls?.[0] && (
                                <div>
                                    <span className="font-bold text-emerald-400 block mb-1">Original Full Size (ImgBB):</span>
                                    <a href={viewTask.imgbb_image_urls[0]} target="_blank" rel="noreferrer" className="text-amber-400 underline font-mono text-[11px] block">{viewTask.imgbb_image_urls[0]}</a>
                                </div>
                            )}
                            {viewTask.output_text && (
                                <div>
                                    <span className="font-bold text-emerald-400 block mb-1">AI Output:</span>
                                    <div className="bg-stone-950 p-3 rounded-xl border border-white/5"><ChatText text={viewTask.output_text} /></div>
                                </div>
                            )}
                            {viewTask.error && (
                                <p className="text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 font-mono text-[11px]">{viewTask.error}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}"""

content = content[:match.start()] + new_return + content[match.end():]

with open(r'E:\Mohit\photo tool\AI Studio\app\AI Studio Admin.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Main JSX return block successfully modernized!")
