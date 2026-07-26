import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 配信ベースパス:
//   Vercel などルート配信          → '/'(既定)
//   GitHub Pages(サブパス配信)   → GITHUB_PAGES_BASE で '/リポジトリ名/' を渡す
//     (旧リポジトリ互換: GITHUB_PAGES=true のみなら '/tomoki-arai-portfolio/')
const base =
  process.env.GITHUB_PAGES_BASE ||
  (process.env.GITHUB_PAGES === 'true' ? '/tomoki-arai-portfolio/' : '/');

// NOINDEX=true のビルドは検索エンジンに載せない(サブ公開・プレビュー用)。
// 本番として公開する側だけ index を許可し、既存サイトと検索順位で競合しないようにする。
const noindex = process.env.NOINDEX === 'true';

const noindexPlugin = {
  name: 'inject-noindex',
  transformIndexHtml(html) {
    return html.replace(
      '<meta name="robots" content="index, follow" />',
      '<meta name="robots" content="noindex, nofollow" />',
    );
  },
};

export default defineConfig({
  base,
  plugins: [react(), noindex && noindexPlugin].filter(Boolean),
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
