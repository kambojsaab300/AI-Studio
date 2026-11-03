// ============================================================
// AI Studio: Standalone .NET Core / PostgREST Client Adapter
// Translates Supabase-style query chain to standard REST APIs
// ============================================================

export class ApiQueryBuilder {
    constructor(apiUrl, table, token) {
        this.apiUrl = apiUrl;
        this.table = table;
        this.token = token;
        this.params = new URLSearchParams();
        this._isSingle = false;
        this._isCount = false;
        this._isHead = false;
    }

    select(columns = '*', options = {}) {
        this.params.set('select', columns);
        if (options && options.count) {
            this._isCount = true;
            this.params.set('count', options.count);
        }
        if (options && options.head) {
            this._isHead = true;
            this.params.set('head', 'true');
        }
        return this;
    }

    order(column, { ascending = true } = {}) {
        this.params.set('order', `${column}.${ascending ? 'asc' : 'desc'}`);
        return this;
    }

    limit(n) {
        this.params.set('limit', String(n));
        return this;
    }

    range(from, to) {
        this.params.set('offset', String(from));
        this.params.set('limit', String(to - from + 1));
        return this;
    }

    eq(column, value) {
        this.params.append(column, `eq.${value}`);
        return this;
    }

    neq(column, value) {
        this.params.append(column, `neq.${value}`);
        return this;
    }

    is(column, value) {
        this.params.append(column, `is.${value}`);
        return this;
    }

    in(column, values) {
        const list = Array.isArray(values) ? values.join(',') : values;
        this.params.append(column, `in.(${list})`);
        return this;
    }

    single() {
        this._isSingle = true;
        return this;
    }

    async _fetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true',
            ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        };
        if (this._isSingle) {
            headers['Accept'] = 'application/vnd.pgrst.object+json';
        }

        try {
            const res = await fetch(url, { ...options, headers });
            let countVal = 0;
            const contentRange = res.headers.get('content-range') || res.headers.get('Content-Range');
            if (contentRange) {
                const parts = contentRange.split('/');
                if (parts.length > 1) countVal = parseInt(parts[1], 10) || 0;
            } else {
                const totalHdr = res.headers.get('x-total-count') || res.headers.get('X-Total-Count');
                if (totalHdr) countVal = parseInt(totalHdr, 10) || 0;
            }

            if (!res.ok) {
                const text = await res.text();
                let errObj;
                try { errObj = JSON.parse(text); } catch { errObj = { message: text }; }
                return { data: null, error: errObj, count: 0 };
            }

            const data = await res.json();
            if (countVal === 0 && Array.isArray(data)) countVal = data.length;

            return {
                data: this._isSingle && Array.isArray(data) ? (data[0] || null) : data,
                error: null,
                count: countVal
            };
        } catch (err) {
            return { data: null, error: { message: err.message }, count: 0 };
        }
    }

    then(resolve, reject) {
        const url = `${this.apiUrl}/rest/v1/${this.table}?${this.params.toString()}`;
        return this._fetch(url, { method: 'GET' }).then(resolve, reject);
    }

    async insert(data) {
        const url = `${this.apiUrl}/rest/v1/${this.table}`;
        return this._fetch(url, { method: 'POST', body: JSON.stringify(data) });
    }

    async update(data) {
        const url = `${this.apiUrl}/rest/v1/${this.table}?${this.params.toString()}`;
        return this._fetch(url, { method: 'PATCH', body: JSON.stringify(data) });
    }

    async delete() {
        const url = `${this.apiUrl}/rest/v1/${this.table}?${this.params.toString()}`;
        return this._fetch(url, { method: 'DELETE' });
    }
}

export function createClient(apiUrl = "https://aistudio.runasp.net", apiKey = "") {
    let token = "";
    let currentUser = null;
    try {
        token = localStorage.getItem('aistudio_token') || "";
        const saved = localStorage.getItem('aistudio_user');
        if (saved) currentUser = JSON.parse(saved);
    } catch { }

    const authListeners = new Set();

    return {
        apiUrl,
        auth: {
            async signInWithPassword({ email, password }) {
                try {
                    const res = await fetch(`${apiUrl}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                        body: JSON.stringify({ email, password })
                    });
                    const json = await res.json();
                    if (!res.ok) return { data: null, error: { message: json.error || 'Login fail hua.' } };
                    token = json.access_token;
                    currentUser = json.user;
                    try {
                        localStorage.setItem('aistudio_token', token);
                        localStorage.setItem('aistudio_user', JSON.stringify(currentUser));
                    } catch { }
                    authListeners.forEach(cb => cb('SIGNED_IN', { user: currentUser, access_token: token }));
                    return { data: { user: currentUser, session: { access_token: token, user: currentUser } }, error: null };
                } catch (err) {
                    return { data: null, error: { message: err.message } };
                }
            },

            async signInAnonymously() {
                const guestEmail = `guest_${Date.now()}@aistudio.local`;
                return this.signUp({ email: guestEmail, password: "Guest@123456" });
            },

            async signUp({ email, password }) {
                try {
                    const res = await fetch(`${apiUrl}/api/auth/signup`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                        body: JSON.stringify({ email, password })
                    });
                    const json = await res.json();
                    if (!res.ok) return { data: null, error: { message: json.error || 'Signup fail hua.' } };
                    token = json.access_token;
                    currentUser = json.user;
                    try {
                        localStorage.setItem('aistudio_token', token);
                        localStorage.setItem('aistudio_user', JSON.stringify(currentUser));
                    } catch { }
                    authListeners.forEach(cb => cb('SIGNED_IN', { user: currentUser, access_token: token }));
                    return { data: { user: currentUser, session: { access_token: token, user: currentUser } }, error: null };
                } catch (err) {
                    return { data: null, error: { message: err.message } };
                }
            },

            async signOut() {
                token = "";
                currentUser = null;
                try {
                    localStorage.removeItem('aistudio_token');
                    localStorage.removeItem('aistudio_user');
                } catch { }
                authListeners.forEach(cb => cb('SIGNED_OUT', null));
                return { error: null };
            },

            async getSession() {
                if (token && currentUser) return { data: { session: { access_token: token, user: currentUser } }, error: null };
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
            return new ApiQueryBuilder(apiUrl, table, token);
        },

        async rpc(functionName, params = {}) {
            try {
                const res = await fetch(`${apiUrl}/rest/v1/rpc/${functionName}`, {
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
                try { data = JSON.parse(text); } catch { data = text; }
                return { data, error: null };
            } catch (err) {
                return { data: null, error: { message: err.message } };
            }
        },

        channel(name) {
            const ch = { name, on() { return ch; }, subscribe() { return ch; } };
            return ch;
        },

        removeChannel() { }
    };
}
