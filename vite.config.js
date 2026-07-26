import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const APP_NAME = 'Waraqah'
const APP_TAGLINE = 'Quote. Invoice. Get Paid.'
const APP_DESCRIPTION =
    'Waraqah helps freelancers and businesses create quotations and invoices in seconds, email clients with estimates, invoices, and receipts, manage payments, and export professional PDFs.'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon-16.png', 'favicon-32.png', 'pwa/apple-touch-icon.png'],
            manifest: {
                name: `${APP_NAME} — ${APP_TAGLINE}`,
                short_name: APP_NAME,
                description: APP_DESCRIPTION,
                theme_color: '#16A34A',
                background_color: '#F0FDF4',
                display: 'standalone',
                orientation: 'portrait-primary',
                start_url: '/',
                scope: '/',
                categories: ['business', 'finance', 'productivity'],
                icons: [
                    {
                        src: 'pwa/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa/icon-maskable-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                    {
                        src: 'pwa/apple-touch-icon.png',
                        sizes: '180x180',
                        type: 'image/png',
                        purpose: 'any',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/api/],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                        },
                    },
                ],
            },
        }),
    ],
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
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        },
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
})
