import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR dapat dimatikan lewat variabel lingkungan DISABLE_HMR=true.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Pemantauan berkas ikut dimatikan saat DISABLE_HMR bernilai true.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});