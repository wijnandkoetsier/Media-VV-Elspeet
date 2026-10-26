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
      includeAssets: ['logo.svg', 'icons/*.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Alleen Latijnse lettertekens offline bewaren; andere schriften zijn niet nodig.
        globIgnores: ['**/*cyrillic*', '**/*greek*', '**/*vietnamese*'],
      },
      manifest: {
        name: 'Media VV Elspeet',
        short_name: 'VV Elspeet',
        description: 'Maak snel social media afbeeldingen voor VV Elspeet.',
        lang: 'nl',
        theme_color: '#0b5d2e',
        background_color: '#0f1512',
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
