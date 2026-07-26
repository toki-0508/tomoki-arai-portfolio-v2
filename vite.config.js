import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ============================================================
// 公開先ごとの設定(すべて環境変数で切り替える)
//
//   GITHUB_PAGES_BASE : 配信ベースパス。GitHub Pages は '/<リポジトリ名>/'
//   SITE_URL          : 公開URL。canonical / OG / 構造化データ / sitemap に使う
//   NOINDEX           : 'true' で検索エンジンに載せない(プレビュー用)
//
// index.html には既定URL(v1のVercel)が直書きされているので、
// ビルド時に SITE_URL へ一括置換する。公開先を移しても
// canonical と OG が実際のURLとずれない。
// ============================================================

const DEFAULT_SITE_URL = 'https://tomoki-arai.vercel.app';

const base =
  process.env.GITHUB_PAGES_BASE ||
  (process.env.GITHUB_PAGES === 'true' ? '/tomoki-arai-portfolio/' : '/');

const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
const canonicalUrl = `${siteUrl}/`;
const noindex = process.env.NOINDEX === 'true';

const seoPlugin = {
  name: 'portfolio-seo',

  transformIndexHtml(html) {
    const out = html.replaceAll(DEFAULT_SITE_URL, siteUrl);
    if (!noindex) return out;
    return out.replace(
      '<meta name="robots" content="index, follow" />',
      '<meta name="robots" content="noindex, nofollow" />',
    );
  },

  // sitemap / robots は公開URLに依存するのでビルド時に生成する。
  // ハッシュルーティングのため、検索エンジンに個別URLとして認識されるのは
  // トップページのみ。sitemap もトップだけを載せる。
  generateBundle() {
    const lastmod = new Date().toISOString().slice(0, 10);

    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        `    <loc>${canonicalUrl}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        '    <changefreq>weekly</changefreq>',
        '    <priority>1.0</priority>',
        '  </url>',
        '</urlset>',
        '',
      ].join('\n'),
    });

    // noindex ビルドでもクロール自体は許可する。
    // Disallow にするとクローラーが noindex メタを読めず、
    // かえって URL だけが検索結果に残ることがあるため。
    this.emitFile({
      type: 'asset',
      fileName: 'robots.txt',
      source: noindex
        ? 'User-agent: *\nAllow: /\n'
        : `User-agent: *\nAllow: /\n\nSitemap: ${canonicalUrl}sitemap.xml\n`,
    });
  },
};

export default defineConfig({
  base,
  plugins: [react(), seoPlugin],
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
