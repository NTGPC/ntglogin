import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Bắt buộc cho Electron
  root: '.',  // <--- QUAN TRỌNG: Bảo nó là "Gốc ở đây nè", đừng tìm đâu xa
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './packages/admin-web/src'),
      '/src': path.resolve(__dirname, './packages/admin-web/src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Chỉ đích danh file index.html nằm ngay thư mục gốc
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
