import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@engine': resolve(__dirname, 'src/engine'),
      '@math': resolve(__dirname, 'src/math'),
      '@scene': resolve(__dirname, 'src/scene'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@ui': resolve(__dirname, 'src/ui'),
      '@core': resolve(__dirname, 'src/core'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
});
