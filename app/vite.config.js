import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/web-textdraw-editor/',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api-proxy': {
        target: 'https://gtaundergroundmod.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api-proxy/, ''),
      },
      '/openmp-proxy': {
        target: 'https://assets.open.mp',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/openmp-proxy/, ''),
      },
      '/wiki-proxy': {
        target: 'https://wiki.multitheftauto.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/wiki-proxy/, ''),
      },
    },
  },
})