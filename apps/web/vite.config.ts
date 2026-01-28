import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import pkg from './package.json';

// https://vite.dev/config/
export default defineConfig({
  // Base URL for deployment. Set VITE_BASE_URL env variable for subdirectory deployment
  // Example: VITE_BASE_URL=/archivo/ for my.domain.com/archivo
  base: process.env.VITE_BASE_URL || '/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@archivo/ui/styles/_variables.scss" as *;`,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
