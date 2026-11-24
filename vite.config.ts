import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  optimizeDeps: {
    include: ['three', 'lil-gui']
  },
  server: {
    port: 3000,
    open: false
  },
  preview: {
    port: 3000,
    open: false
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
