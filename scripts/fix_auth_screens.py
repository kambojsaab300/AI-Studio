with open(r'E:\Mohit\photo tool\AI Studio\app\AI Studio Admin.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Let's inspect around lines 1490-1515
idx = code.find("// ── Screens ──")
if idx == -1:
    print("Could not find // ── Screens ──")
    exit(1)

auth_checks = """// ── Screens ──
    if (!sb) {
        return (
            <div className="min-h-screen bg-[#07080d] text-slate-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#0b0e17] border border-white/10 rounded-3xl p-8 space-y-5 shadow-2xl text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-stone-950 font-black text-lg flex items-center justify-center mx-auto shadow-lg shadow-amber-400/20">AI</div>
                    <h1 className="text-xl font-extrabold text-white">AI Studio Suite</h1>
                    <p className="text-xs text-stone-400">Connecting to .NET Core Live Backend...</p>
                    <button onClick={connect} className="w-full h-11 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black shadow-lg shadow-amber-400/20 transition-all">Connect Now</button>
                    {msg && <p className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded-lg">{msg}</p>}
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-[#07080d] text-slate-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#0b0e17] border border-white/10 rounded-3xl p-8 space-y-5 shadow-2xl">
                    <div className="text-center space-y-1">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-stone-950 font-black text-lg flex items-center justify-center mx-auto shadow-lg shadow-amber-400/20">AI</div>
                        <h1 className="text-xl font-extrabold text-white pt-2">Admin Portal</h1>
                        <p className="text-xs text-stone-400">Enter your credentials to manage studio and workers</p>
                    </div>
                    <div className="space-y-3">
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@email.com" className="w-full h-11 bg-stone-950 border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-amber-400" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 bg-stone-950 border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-amber-400" />
                        <button onClick={login} className="w-full h-11 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all">
                            <LogIn className="w-4 h-4" /> Sign In to Admin
                        </button>
                    </div>
                    {loginMsg && <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl text-center">{loginMsg}</p>}
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#07080d] text-slate-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#0b0e17] border border-rose-500/30 rounded-3xl p-8 space-y-4 shadow-2xl text-center">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-white">Access Restricted</h2>
                    <p className="text-xs text-stone-400">This account does not have administrator privileges.</p>
                    <button onClick={logout} className="h-10 px-5 bg-stone-900 border border-white/10 rounded-xl text-xs font-bold text-stone-300 hover:text-white transition-all">
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }
"""

# Find where allCatalogList starts
cat_idx = code.find("const allCatalogList = catalog.length", idx)
if cat_idx == -1:
    print("Could not find allCatalogList")
    exit(1)

code = code[:idx] + auth_checks + "\n    " + code[cat_idx:]

with open(r'E:\Mohit\photo tool\AI Studio\app\AI Studio Admin.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Auth checks restored cleanly!")
