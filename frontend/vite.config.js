import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['apple-touch-icon.png', 'favicon.png'],
      manifest: {
        name: 'SignBridge — from sign to sentence',
        short_name: 'SignBridge',
        description: 'An adaptive literacy tutor for Deaf and Hard-of-Hearing learners.',
        theme_color: '#11110f',
        background_color: '#f4f1e9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'any',
        categories: ['education', 'accessibility'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
        // Cross-origin fonts and MediaPipe assets are cached after each asset's
        // first successful request. Grammar and reading do not depend on them.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
            handler: 'CacheFirst',
            options: { cacheName: 'mediapipe-wasm', expiration: { maxEntries: 30, maxAgeSeconds: 2592000 } },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://storage.googleapis.com',
            handler: 'CacheFirst',
            options: { cacheName: 'mediapipe-model', expiration: { maxEntries: 5, maxAgeSeconds: 2592000 } },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com' || url.origin === 'https://fonts.cdnfonts.com',
            handler: 'CacheFirst',
            options: { cacheName: 'web-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } },
          },
        ],
      },
    }),
  ],
})
