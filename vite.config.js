import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite's built-in SPA fallback rewrites unknown paths to /index.html — but that
// file is the PRODUCTION entry and pulls in the already-built /assets/aira-app.js
// bundle. Deep-linking to /paciente/:id in dev would therefore load stale code.
// This sends dev deep links to index.dev.html instead, which loads /src/main.jsx.
function devDeepLinkFallback() {
  return {
    name: 'aira-dev-deep-link-fallback',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const [path] = (req.url || '/').split('?')
        const isFile = path.includes('.')
        const isInternal = path.startsWith('/@') || path.startsWith('/src/') || path.startsWith('/node_modules/')
        if (req.method === 'GET' && !isFile && !isInternal) {
          req.url = '/index.dev.html'
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), devDeepLinkFallback()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.dev.html',
    },
  },
})
