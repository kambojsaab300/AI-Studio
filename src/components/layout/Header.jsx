import React from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { NavTabs } from './NavTabs';

export function Header() {
    const { sb, email, screen, setScreen } = useAdmin();

    const handleLogout = async () => {
        if (sb?.auth) await sb.auth.signOut();
    };

    return (
        <header className="border-b border-slate-800/80 bg-[#080b12]/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3">
                {/* Logo & Status Badge */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center shadow-lg shadow-amber-400/20">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 font-black" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white">AI Studio</h1>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30">Admin</span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">Production Model Fleet & API Console</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full" title="Connected to .NET Core 9 API on MonsterASP">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[10px] sm:text-[11px] font-mono font-semibold">Live</span>
                    </div>
                </div>

                {/* Nav Tabs */}
                <NavTabs activeTab={screen} onChangeTab={setScreen} />

                {/* Right User Controls */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-stone-400 text-[11px] font-mono hidden lg:inline max-w-[140px] truncate" title={email}>
                        {email}
                    </span>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="h-7 sm:h-8 px-2.5 sm:px-3 bg-stone-900 hover:bg-rose-500/20 text-stone-300 hover:text-rose-400 border border-white/10 rounded-lg sm:rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                        title="Sign out"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;
