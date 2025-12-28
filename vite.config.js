import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base path for file:// protocol compatibility
  base: './',

  // Path aliases for clean imports
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },

  // Multi-page app configuration
  build: {
    rollupOptions: {
      input: {
        // Master Control Panel (Universal)
        'master-control': resolve(__dirname, 'src/modules/master-control/index.html'),

        // Game Modules
        'billiards-module': resolve(__dirname, 'src/modules/billiards/control-panel/index.html'),

        // Overlays
        'browser-source': resolve(__dirname, 'src/modules/billiards/overlay/index.html'),

        // Premium Modules
        'advertising': resolve(__dirname, 'src/modules/advertising/index.html'),
      },
    },
    // Output to dist/ with relative paths
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure file:// protocol compatibility
    target: 'es2015',
    minify: 'terser',
    sourcemap: false,
  },

  // Development server config
  server: {
    port: 3004,
    open: false,
    cors: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['dexie'],
  },
});
