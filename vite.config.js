// vite.config.js - Configuration optimisée avec debug et gestion d'erreurs
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Permet l'accès depuis d'autres appareils
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        timeout: 60000, // 60 secondes de timeout
        configure: (proxy, options) => {
          // Gestion des erreurs de proxy
          proxy.on('error', (err, req, res) => {
            console.log('🔴 Proxy Error:', err.message);
            console.log('   Target:', options.target);
            console.log('   Request:', req.method, req.url);
            
            // Réponse d'erreur personnalisée
            if (!res.headersSent) {
              res.writeHead(503, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
              });
              res.end(JSON.stringify({
                error: 'Backend server unavailable',
                message: 'Make sure your API server is running on port 3000',
                timestamp: new Date().toISOString()
              }));
            }
          });

          // Log des requêtes sortantes
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxying:', req.method, req.url, '→', options.target + req.url);
            
            // Ajouter des headers pour éviter les problèmes CORS
            proxyReq.setHeader('Origin', options.target);
            proxyReq.setHeader('Referer', options.target);
          });

          // Log des réponses
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const status = proxyRes.statusCode;
            const statusIcon = status >= 200 && status < 300 ? '✅' : 
                              status >= 400 && status < 500 ? '⚠️' : '❌';
            
            console.log(`${statusIcon} Proxy Response: ${status} ${req.method} ${req.url}`);
            
            // Log des erreurs d'authentification
            if (status === 401 || status === 403) {
              console.log('🔐 Authentication issue detected');
              console.log('   Check your token in localStorage');
            }
          });
        },
        rewrite: (path) => {
          // Log du rewrite avec plus de détails
          const newPath = path;
          console.log('🔀 Path rewrite:', path, '→', newPath);
          return newPath;
        }
      }
    },
    // Configuration CORS pour le serveur de dev
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    }
  },
  // Définir des variables globales pour éviter les erreurs
  define: {
    global: 'globalThis',
  },
  // Optimisations de build
  build: {
    sourcemap: true, // Utile pour le debug
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  },
  // Configuration ESBuild pour de meilleures performances
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})