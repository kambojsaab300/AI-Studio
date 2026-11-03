// Local preview for the Customer and Admin apps (Clean React SPA routing).
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    server: {
        port: 5173,
        strictPort: true,
        fs: { allow: ['E:/Mohit/photo tool'] }
    },
    plugins: [
        {
            name: 'clean-urls-rewrite',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    const [path, query] = (req.url || '').split('?');
                    const search = query ? `?${query}` : '';

                    // Clean URL Rewrites (No .html needed in address bar)
                    if (path === '/' || path === '/admin') {
                        req.url = `/admin.html${search}`;
                    } else if (path === '/app' || (path.startsWith('/app/') && !path.includes('.'))) {
                        req.url = `/app.html${search}`;
                    } else if (path === '/customer') {
                        req.url = `/customer.html${search}`;
                    } else if (path === '/worker') {
                        req.url = `/worker.html${search}`;
                    } else if (path === '/portal') {
                        req.url = `/index.html${search}`;
                    }
                    next();
                });
            }
        }
    ]
});
