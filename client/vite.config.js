import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development the Express API runs on port 3000. We proxy all backend
// routes to it so the React dev server (port 5173) can talk to the same
// session cookie without any CORS or auth headaches.
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:3000';

const proxyRoutes = ['/api', '/login', '/logout', '/auth', '/uploads', '/health'];

export default defineConfig({
  plugins: [react()],
  build: {
    // Express serves the compiled output from client/dist.
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: proxyRoutes.reduce((acc, route) => {
      acc[route] = { target: API_TARGET, changeOrigin: true };
      return acc;
    }, {}),
  },
});
