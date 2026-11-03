import React from 'react';

const TABS = [
    { id: 'task', label: 'Studio', icon: '🎨' },
    { id: 'apps', label: 'Apps & Clients', icon: '📱' },
    { id: 'builder', label: 'Tool Builder', icon: '🛠️' },
    { id: 'tools', label: 'Tools', icon: '⚡' },
    { id: 'workers', label: 'Workers', icon: '⚙️' },
    { id: 'features', label: 'Catalog', icon: '📋' }
];

export function NavTabs({ activeTab, onChangeTab }) {
    return (
        <nav className="flex items-center gap-1 bg-[#0e111c] border border-white/10 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl shadow-inner">
            {TABS.map(tab => {
                const active = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChangeTab(tab.id)}
                        className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all ${
                            active 
                                ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20 font-extrabold' 
                                : 'text-stone-400 hover:text-white'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}

export default NavTabs;
