import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // Optional: for better debugging in production
  },
  define: {
    __APP_ENV__: process.env.VITE_VERCEL_ENV,
  }
});
