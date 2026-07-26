import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 本番は Vercel(ルート配信)、GitHub Pages はサブパス配信。
// Pages 向けビルド時のみ GITHUB_PAGES=true を渡して base を切り替えるため、
// Vercel 側の出力は従来と完全に同一のまま変わらない。
const base = process.env.GITHUB_PAGES === 'true' ? '/tomoki-arai-portfolio/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  // プレビュー環境が PORT を指定してくることがあるため、あれば従う
  server: {
    port: Number(process.env.PORT) || 5174,
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/react')) return 'react-vendor';
        },
      },
    },
  },
});
