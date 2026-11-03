import React, { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { TOOL_CATEGORIES, getToolCategory } from '../../constants/categories';

export function ToolCatalogBar({ catalog, selectedTaskType, onSelectTaskType }) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showCatalog, setShowCatalog] = useState(false);

    const activeList = (catalog || []).filter(c => c.enabled);

    const filteredTools = activeList.filter(t => {
        const cat = getToolCategory(t.task_type);
        const matchesCategory = selectedCategory === 'all' || cat === selectedCategory;
        const matchesSearch = !search || 
            (t.label || '').toLowerCase().includes(search.toLowerCase()) || 
            (t.task_type || '').toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <section className="bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            {/* Top Bar: Title & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                        <span>Select AI Studio Tool</span>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                            {activeList.length} Active Tools
                        </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Choose an e-commerce, try-on, portrait, or styling workflow</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search tools (e.g. suit, garment)..."
                            className="w-full h-8 sm:h-9 bg-[#080b12] border border-slate-800 rounded-xl pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowCatalog(!showCatalog)}
                        className={`h-8 sm:h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            showCatalog 
                                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' 
                                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                        }`}
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{showCatalog ? 'Minimize Tools' : 'Show All Tools'}</span>
                        <span>({filteredTools.length})</span>
                        {showCatalog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Expandable Tool Grid */}
            {showCatalog && (
                <div className="pt-3.5 border-t border-slate-800/80 space-y-3 animate-fadeIn">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {TOOL_CATEGORIES.map(cat => {
                            const count = cat.id === 'all' 
                                ? activeList.length
                                : activeList.filter(c => getToolCategory(c.task_type) === cat.id).length;
                            const active = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`whitespace-nowrap px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                        active 
                                            ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' 
                                            : 'bg-[#080b12] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                                    }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${active ? 'bg-black/20 text-black font-bold' : 'bg-white/5 text-slate-500'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tool Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                        {filteredTools.map(t => {
                            const isSelected = selectedTaskType === t.task_type;
                            const category = getToolCategory(t.task_type);
                            const catObj = TOOL_CATEGORIES.find(c => c.id === category) || TOOL_CATEGORIES[0];
                            return (
                                <button
                                    key={t.task_type}
                                    type="button"
                                    onClick={() => onSelectTaskType(t.task_type)}
                                    className={`p-2.5 sm:p-3 rounded-xl text-left border transition-all flex flex-col justify-between space-y-2 relative overflow-hidden group ${
                                        isSelected 
                                            ? 'bg-amber-400/15 border-amber-400 text-white shadow-md shadow-amber-400/10 ring-1 ring-amber-400/40' 
                                            : 'bg-[#080b12] hover:bg-slate-800/80 border-slate-800/80 text-slate-300 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-lg sm:text-xl">{catObj.icon}</span>
                                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                            isSelected ? 'bg-amber-400 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {t.output === 'image' ? 'Photo' : 'Text'}
                                        </span>
                                    </div>
                                    <p className={`text-xs font-bold line-clamp-2 leading-tight ${isSelected ? 'text-amber-300' : 'text-slate-200 group-hover:text-white'}`}>
                                        {t.label}
                                    </p>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 border-t border-white/5 w-full">
                                        <span>{t.inputs?.length ? `${t.inputs.length} slots` : 'Prompt'}</span>
                                        {isSelected ? (
                                            <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                                <Check className="w-3 h-3" /> Active
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 group-hover:text-slate-400">Select →</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}

export default ToolCatalogBar;
