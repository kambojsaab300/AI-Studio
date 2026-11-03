// ============================================================
// AI Studio: .NET Core API Client (.NET Core REST Adapter)
// ============================================================

const DEFAULT_API_URL = "https://aistudio.runasp.net";

export function getEffectiveApiUrl(providedUrl) {
    if (typeof window !== 'undefined') {
        const queryApi = new URLSearchParams(window.location.search).get('api');
        if (queryApi) {
            try { localStorage.setItem('aistudio_api_url', queryApi); } catch { }
            return queryApi.replace(/\/$/, "");
        }
        try {
            const savedApi = localStorage.getItem('aistudio_api_url');
            if (savedApi) {
                if (savedApi.includes('trycloudflare.com')) {
                    try { localStorage.removeItem('aistudio_api_url'); } catch { }
                } else {
                    return (savedApi === 'http://aistudio.runasp.net' ? 'https://aistudio.runasp.net' : savedApi).replace(/\/$/, "");
                }
            }
        } catch { }
        if (providedUrl) {
            return providedUrl.replace(/\/$/, "");
        }
    }
    return (providedUrl || "https://aistudio.runasp.net").replace(/\/$/, "");
}

function createClient(apiUrl = DEFAULT_API_URL, apiKey = "") {
    const url = getEffectiveApiUrl(apiUrl);
    let token = localStorage.getItem('aistudio_token') || "";
    let currentUser = null;
    try {
        const saved = localStorage.getItem('aistudio_user');
        if (saved) currentUser = JSON.parse(saved);
    } catch { }

    const authListeners = new Set();

    return {
        apiUrl: url,
        auth: {
            async signInWithPassword({ email, password }) {
                try {
                    const res = await fetch(`${url}/api/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Bypass-Tunnel-Reminder': 'true'
                        },
                        body: JSON.stringify({ email, password })
                    });
                    const json = await res.json();
                    if (!res.ok) {
                        return { data: null, error: { message: json.error || 'Login fail hua.' } };
                    }
                    token = json.access_token;
                    currentUser = json.user;
                    localStorage.setItem('aistudio_token', token);
                    localStorage.setItem('aistudio_user', JSON.stringify(currentUser));
                    authListeners.forEach(cb => cb('SIGNED_IN', { user: currentUser, access_token: token }));
                    return { data: { user: currentUser, session: { access_token: token, user: currentUser } }, error: null };
                } catch (err) {
                    return { data: null, error: { message: err.message } };
                }
            },

            async signInAnonymously() {
                const guestEmail = `guest_${Date.now()}@aistudio.local`;
                const guestPass = "Guest@123456";
                return this.signUp({ email: guestEmail, password: guestPass });
            },

            async signUp({ email, password }) {
                try {
                    const res = await fetch(`${url}/api/auth/signup`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Bypass-Tunnel-Reminder': 'true'
                        },
                        body: JSON.stringify({ email, password })
                    });
                    const json = await res.json();
                    if (!res.ok) {
                        return { data: null, error: { message: json.error || 'Signup fail hua.' } };
                    }
                    token = json.access_token;
                    currentUser = json.user;
                    localStorage.setItem('aistudio_token', token);
                    localStorage.setItem('aistudio_user', JSON.stringify(currentUser));
                    authListeners.forEach(cb => cb('SIGNED_IN', { user: currentUser, access_token: token }));
                    return { data: { user: currentUser, session: { access_token: token, user: currentUser } }, error: null };
                } catch (err) {
                    return { data: null, error: { message: err.message } };
                }
            },

            async signOut() {
                token = "";
                currentUser = null;
                localStorage.removeItem('aistudio_token');
                localStorage.removeItem('aistudio_user');
                authListeners.forEach(cb => cb('SIGNED_OUT', null));
                return { error: null };
            },

            async getSession() {
                if (token && currentUser) {
                    return { data: { session: { access_token: token, user: currentUser } }, error: null };
                }
                return { data: { session: null }, error: null };
            },

            async getUser() {
                return { data: { user: currentUser }, error: null };
            },

            onAuthStateChange(callback) {
                authListeners.add(callback);
                return {
                    data: {
                        subscription: {
                            unsubscribe: () => authListeners.delete(callback)
                        }
                    }
                };
            }
        },

        from(table) {
            return new QueryBuilder(url, table, token);
        },

        async rpc(functionName, params = {}) {
            try {
                const res = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(params || {})
                });

                const text = await res.text();
                if (!res.ok) {
                    let errObj;
                    try { errObj = JSON.parse(text); } catch { errObj = { message: text }; }
                    return { data: null, error: errObj };
                }

                let data;
                try {
                    data = JSON.parse(text);
                } catch {
                    data = text;
                }
                return { data, error: null };
            } catch (err) {
                return { data: null, error: { message: err.message } };
            }
        },

        channel(name) {
            const ch = {
                name,
                on(event, filter, callback) {
                    return ch;
                },
                subscribe() {
                    return ch;
                }
            };
            return ch;
        },

        removeChannel(ch) { }
    };
}

if (typeof window !== 'undefined') {
        window.AIStudioApi = { createClient };
}

export default { createClient };
