import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages deployment, set base to your repo name:
  // base: '/void-finance/',
  base: '/void/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
