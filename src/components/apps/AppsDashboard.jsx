import React, { useState } from 'react';
import { 
    Smartphone, Plus, Layers, Play, Settings, Trash2, CheckCircle2, 
    ChevronRight, ArrowLeft, RefreshCw, ExternalLink, Copy, Check 
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AppCreateModal } from './AppCreateModal';
import { AppToolMatrix } from './AppToolMatrix';
import { AppWorkspaceView } from './AppWorkspaceView';
import { TABLES } from '../../api/config';

export function AppsDashboard() {
    const { sb, apps, appTasks, catalog, loadCatalog, setMsg } = useAdmin();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    const [activeSubTab, setActiveSubTab] = useState('workspace'); // 'workspace' | 'matrix'
    const [copiedId, setCopiedId] = useState(null);

    const handleCopyUrl = (appId) => {
        const url = `${window.location.origin}/app/${appId}`;
        navigator.clipboard.writeText(url);
        setCopiedId(appId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleToggleApp = async (appId, currentEnabled) => {
        try {
            const { error } = await sb.from(TABLES.APPS)
                .update({ enabled: !currentEnabled, updated_at: new Date().toISOString() })
                .eq('app_id', appId);
            if (error) throw error;
            loadCatalog();
        } catch (err) {
            setMsg('App update error: ' + err.message);
        }
    };

    const handleDeleteApp = async (appId, label) => {
        if (['weargen', 'ppp'].includes(appId)) {
            return setMsg('Default system apps (WearGen, PPP) delete nahi ki ja sakti.');
        }
        if (!window.confirm(`Kya aap pakka App "${label}" (${appId}) ko delete karna chahte hain?`)) return;

        try {
            // Delete links first
            await sb.from(TABLES.APP_TASKS).delete().eq('app_id', appId);
            // Delete app
            const { error } = await sb.from(TABLES.APPS).delete().eq('app_id', appId);
            if (error) throw error;
            if (selectedApp?.app_id === appId) setSelectedApp(null);
            loadCatalog();
            setMsg(`App "${label}" delete ho gayi.`);
        } catch (err) {
            setMsg('App delete error: ' + err.message);
        }
    };

    // If an app is selected, render its dedicated Workspace / Matrix view
    if (selectedApp) {
        return (
            <div className="space-y-5 animate-fadeIn">
                {/* Back to Apps List & Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e1320] border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSelectedApp(null)}
                            className="h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>All Apps</span>
                        </button>
                        <div className="h-4 w-px bg-slate-800 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-white">{selectedApp.label}</span>
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                {selectedApp.app_id}
                            </span>
                        </div>
                    </div>

                    {/* Mode Switcher & Standalone Launch Links */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 bg-[#080b12] p-1 rounded-xl border border-slate-800 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setActiveSubTab('workspace')}
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                                    activeSubTab === 'workspace' 
                                        ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm' 
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Play className="w-3.5 h-3.5" />
                                <span>Preview Workspace</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSubTab('matrix')}
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                                    activeSubTab === 'matrix' 
                                        ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm' 
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Settings className="w-3.5 h-3.5" />
                                <span>Manage Assigned Tools</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleCopyUrl(selectedApp.app_id)}
                                className="h-8 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition-colors"
                                title="Copy Standalone URL"
                            >
                                {copiedId === selectedApp.app_id ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-emerald-400 font-bold">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Copy URL</span>
                                    </>
                                )}
                            </button>

                            <a
                                href={`/app/${selectedApp.app_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 px-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-400/20 transition-all"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open Standalone Tab ↗</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                {activeSubTab === 'workspace' ? (
                    <AppWorkspaceView app={selectedApp} />
                ) : (
                    <AppToolMatrix app={selectedApp} onClose={() => setActiveSubTab('workspace')} />
                )}
            </div>
        );
    }

    // Default Overview Screen: List of Apps
    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header Banner */}
            <div className="bg-[#0e1320] border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                            <span>Apps & Client Workspaces Dashboard</span>
                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                                {apps.length} Apps
                            </span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Create custom client apps (e.g. WearGen, Zara, Myntra), assign individual tools, and launch dedicated app workspaces.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="h-9 px-4 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-400/20 active:scale-98 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New App</span>
                    </button>
                </div>
            </div>

            {/* Apps Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {apps.map(app => {
                    const assignedCount = appTasks.filter(l => l.app_id === app.app_id).length;
                    const isSystem = ['weargen', 'ppp'].includes(app.app_id);

                    return (
                        <div
                            key={app.app_id}
                            className="bg-[#0e1320] border border-slate-800/90 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl group"
                        >
                            {/* Card Top */}
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center font-bold text-base text-amber-400 font-mono">
                                            {app.label.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">
                                                {app.label}
                                            </h3>
                                            <p className="font-mono text-[10px] text-slate-400">
                                                app_id: <span className="text-amber-400/90">{app.app_id}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleToggleApp(app.app_id, app.enabled)}
                                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold transition-colors ${
                                            app.enabled 
                                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                        }`}
                                    >
                                        {app.enabled ? 'Active' : 'Disabled'}
                                    </button>
                                </div>

                                {/* Stats Bar */}
                                <div className="bg-[#080b12] border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
                                    <span className="text-slate-400">Assigned AI Tools:</span>
                                    <span className="font-mono font-extrabold text-amber-300">
                                        {assignedCount} / {catalog.length} Tools
                                    </span>
                                </div>
                            </div>

                            {/* Card Actions */}
                            <div className="space-y-2 pt-2 border-t border-slate-800/80">
                                <a
                                    href={`/app/${app.app_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full h-9 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-amber-400/20 active:scale-98 transition-all group-hover:brightness-105"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Open in Separate URL ↗</span>
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />
                                </a>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedApp(app); setActiveSubTab('workspace'); }}
                                        className="flex-1 h-8 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800 transition-colors"
                                        title="Preview Workspace inside Admin"
                                    >
                                        <Play className="w-3 h-3 text-amber-400" />
                                        <span>Preview</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleCopyUrl(app.app_id)}
                                        className="h-8 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800 transition-colors"
                                        title="Copy App URL"
                                    >
                                        {copiedId === app.app_id ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setSelectedApp(app); setActiveSubTab('matrix'); }}
                                        className="h-8 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800 transition-colors"
                                        title="Manage Tools"
                                    >
                                        <Settings className="w-3 h-3 text-slate-400" />
                                        <span>Tools</span>
                                    </button>

                                    {!isSystem && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteApp(app.app_id, app.label)}
                                            className="h-8 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors border border-rose-500/20"
                                            title="Delete App"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create App Modal */}
            <AppCreateModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreated={(newId) => {
                    const found = apps.find(a => a.app_id === newId);
                    if (found) {
                        setSelectedApp(found);
                        setActiveSubTab('workspace');
                    }
                }}
            />
        </div>
    );
}

export default AppsDashboard;
