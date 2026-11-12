#!/usr/bin/env node
// 本番ビルド(dist/)に編集モードの仕組みが混ざっていないかを確かめる。
// npm run build の後に自動で実行される(package.json の postbuild)。Vercel のビルドでも走る。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const MARKERS = ['/__editor/', 'data-portfolio-editable', 'portfolio-editor-bar'];

export function findMarkers(dir) {
  const hits = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(js|css|html)$/.test(entry.name)) {
        const text = fs.readFileSync(full, 'utf8');
        for (const marker of MARKERS) if (text.includes(marker)) hits.push({ file: full, marker });
      }
    }
  };
  walk(dir);
  return hits;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  const hits = findMarkers(dist);
  if (hits.length) {
    console.error('本番ビルドに編集モードの仕組みが混ざっています。公開できません。');
    for (const { file, marker } of hits) console.error(`  ${path.relative(process.cwd(), file)}: ${marker}`);
    process.exit(1);
  }
  console.log('編集モードの混入なし');
}
