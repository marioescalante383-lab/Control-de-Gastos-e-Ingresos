import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^core-js\/.*/, replacement: path.resolve(__dirname, 'src/empty-shim.ts') },
    ],
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'ignore-core-js-esbuild',
          setup(build) {
            build.onResolve({ filter: /^core-js\// }, () => ({
              path: path.resolve(__dirname, 'src/empty-shim.ts'),
            }));
          },
        },
      ],
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
