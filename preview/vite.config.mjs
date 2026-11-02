// Local preview for the Customer and Admin apps (not part of the deploy).
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    server: {
        port: 5173,
        strictPort: true,
        fs: { allow: ['E:/Mohit/photo tool'] }
    }
});
