#!/usr/bin/env node
// ============================================================
// 全ページの表示テキストを1つのファイルに書き出す。
// 文言の移し替えや公開の前後で、意図しない文字の変化がないかを比べるのに使う。
//
//   npm run build
//   npm run snapshot -- output/snapshots/before.txt
//
// dist を vite preview で配信し、ヘッドレスの Chrome で各ページを開いて
// 描画後の DOM を取り出す。3D(WebGL)は無効にして、毎回同じ結果になるようにする
// (3D が読み込まれたときだけ出る文言は、この比較の対象外)。
// ============================================================
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 4179;
const ATTRS = ['aria-label', 'alt', 'placeholder', 'title'];

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ' };
const decode = (text) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi, (m, name) => {
    if (name[0] === '#' && name[1]?.toLowerCase() === 'x') return String.fromCodePoint(parseInt(name.slice(2), 16));
    if (name[0] === '#' && name !== '#39') return String.fromCodePoint(Number(name.slice(1)));
    return ENTITIES[name.toLowerCase()] ?? m;
  });

export function extractText(html) {
  const lines = [];
  const title = /<title>([\s\S]*?)<\/title>/i.exec(html);
  if (title) lines.push(`[title] ${decode(title[1]).trim()}`);

  const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
  const body = (bodyMatch ? bodyMatch[1] : html).replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');

  for (const [tag] of body.matchAll(/<[a-zA-Z][^>]*>/g)) {
    for (const attr of ATTRS) {
      const found = new RegExp(`\\s${attr}="([^"]*)"`).exec(tag);
      if (found && found[1].trim()) lines.push(`[${attr}] ${decode(found[1])}`);
    }
  }
  for (const line of decode(body.replace(/<[^>]+>/g, '\n')).split('\n')) {
    if (line.trim()) lines.push(line.trim());
  }
  return lines;
}

export function routes(root = ROOT) {
  const works = fs
    .readdirSync(path.join(root, 'src/content/works'))
    .filter((file) => file.endsWith('.md'))
    .map((file) => `/works/${file.slice(0, -3)}`)
    .sort();
  return ['/', '/about', '/works', '/downloads', '/contact', ...works];
}

async function waitForServer(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* まだ起動していない */
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`プレビューサーバーが起動しませんでした: ${url}`);
}

async function main() {
  const out = process.argv[2];
  if (!out) {
    console.error('使い方: npm run snapshot -- <出力ファイル>');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(ROOT, 'dist/index.html'))) {
    console.error('dist がありません。先に npm run build を実行してください。');
    process.exit(1);
  }

  const vite = path.join(ROOT, 'node_modules/.bin/vite');
  const preview = spawn(vite, ['preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-chrome-'));
  try {
    const base = `http://127.0.0.1:${PORT}/`;
    await waitForServer(base);
    const sections = [];
    for (const route of routes()) {
      const html = execFileSync(
        CHROME,
        ['--headless=new', '--disable-gpu', '--disable-3d-apis', '--no-first-run', '--no-default-browser-check',
          `--user-data-dir=${profile}`, '--virtual-time-budget=4000', '--dump-dom', `${base}#${route}`],
        { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
      );
      sections.push(`### ${route}`, ...extractText(html), '');
      console.log(`  ${route}`);
    }
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(out, sections.join('\n'));
    console.log(`書き出しました: ${out}`);
  } finally {
    preview.kill();
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
