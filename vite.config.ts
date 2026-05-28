import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const assetsBase = (env.VITE_ASSETS_BASE_URL ?? '').replace(/\/$/, '')

  return {
    plugins: [
      react(),
      {
        name: 'hero-preload',
        transformIndexHtml() {
          if (!assetsBase) return []
          return [
            {
              tag: 'link',
              attrs: {
                rel: 'preload',
                as: 'image',
                href: `${assetsBase}/assets/editorial/hero.png`,
                media: '(min-width: 769px)',
                fetchpriority: 'high',
              },
              injectTo: 'head',
            },
            {
              tag: 'link',
              attrs: {
                rel: 'preload',
                as: 'image',
                href: `${assetsBase}/assets/editorial/hero-mobile.png`,
                media: '(max-width: 768px)',
                fetchpriority: 'high',
              },
              injectTo: 'head',
            },
          ]
        },
      },
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'three': ['three'],
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  }
})
