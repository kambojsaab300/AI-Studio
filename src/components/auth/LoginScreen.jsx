import React, { useState } from 'react';
import { Shield, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export function LoginScreen() {
    const { sb } = useAdmin();
    const [email, setEmail] = useState('admin@aistudio.local');
    const [password, setPassword] = useState('Admin@123456');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        try {
            const { error } = await sb.auth.signInWithPassword({ email, password });
            if (error) setErrorMsg(error.message || 'Login fail hua. Credentials check karein.');
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const { error } = await sb.auth.signInAnonymously();
            if (error) setErrorMsg(error.message || 'Guest login fail hua.');
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#07080d] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0e1320] border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn">
                {/* Logo & Header */}
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 mx-auto flex items-center justify-center shadow-lg shadow-amber-400/20">
                        <Shield className="w-6 h-6 text-slate-950 font-black" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">AI Studio Admin Fleet</h2>
                    <p className="text-xs text-slate-400">Sign in with authorized administrator credentials</p>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-300">Admin Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full h-10 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-300">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full h-10 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-98 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <LogIn className="w-4 h-4" />}
                        <span>Sign In to Admin Fleet</span>
                    </button>
                </form>

                <div className="pt-2 border-t border-slate-800 text-center">
                    <button
                        type="button"
                        onClick={handleGuestLogin}
                        disabled={loading}
                        className="text-xs text-slate-400 hover:text-amber-300 underline font-mono transition-colors"
                    >
                        Guest Admin Demo Sign In →
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginScreen;
