import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/main/main.ts'),
        },
      },
      externalizeDeps: true,
    },
  },
  preload: {
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: {
          preload: resolve(__dirname, 'src/main/preload.ts'),
        },
      },
      externalizeDeps: true,
    },
  },
  renderer: {
    // Use the Electron renderer folder which loads the shared web app
    root: resolve(__dirname, 'src/renderer'),
    publicDir: resolve(__dirname, 'src/renderer/public'),
    build: {
      outDir: resolve(__dirname, 'dist/renderer'),
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [react()],
    resolve: {
      alias: {
        // Alias to resolve web app modules
        '@': resolve(__dirname, '../web/src'),
        '@archivo/shared': resolve(__dirname, '../../packages/shared/src'),
        '@archivo/ui': resolve(__dirname, '../../packages/ui/src'),
        '@archivo/file-operations': resolve(__dirname, '../../packages/file-operations/src'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@archivo/ui/styles/_variables.scss" as *;`,
        },
      },
    },
  },
});
