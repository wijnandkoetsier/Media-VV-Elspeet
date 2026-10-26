import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH wordt gezet door de GitHub Pages workflow (bijv. "/Media-VV-Elspeet/").
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'icons/*.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Alleen Latijnse lettertekens offline bewaren; andere schriften zijn niet nodig.
        globIgnores: ['**/*cyrillic*', '**/*greek*', '**/*vietnamese*'],
        // Het model voor achtergrond verwijderen na de eerste keer bewaren.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(cdn\.jsdelivr\.net\/npm\/@mediapipe|storage\.googleapis\.com\/mediapipe-models)\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bg-remove-model',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Media VV Elspeet',
        short_name: 'Media VV Elspeet',
        description: 'Maak snel social media afbeeldingen voor VV Elspeet.',
        lang: 'nl',
        theme_color: '#111111',
        background_color: '#0e0e0e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
