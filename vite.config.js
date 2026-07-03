import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@waraqah/shared': path.resolve(__dirname, 'packages/shared/src/index.js'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/jspdf') || id.includes('node_modules/pdf-lib')) {
                        return 'pdf';
                    }
                    if (id.includes('node_modules/@sentry')) {
                        return 'sentry';
                    }
                    if (id.includes('node_modules/date-fns')) {
                        return 'date-fns';
                    }
                },
            },
        },
    },
    server: {
        port: 5173,
        strictPort: false,
    },
})
