import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { extractText, routes } from '../scripts/text-snapshot.mjs';

test('タイトル・属性・本文を決まった順で取り出す', () => {
  const html = `<html><head><title>作品 | A &amp; B</title><script>var x = "<p>無視</p>"</script></head>
<body><a href="#" aria-label="X（新しいタブで開く）">X</a><p>一緒に<strong>何か</strong></p>
<img alt="画像の説明" src="a.png"><style>p{}</style><button title="">押す</button></body></html>`;
  assert.deepEqual(extractText(html), [
    '[title] 作品 | A & B',
    '[aria-label] X（新しいタブで開く）',
    '[alt] 画像の説明',
    'X',
    '一緒に',
    '何か',
    '押す',
  ]);
});

test('ページの一覧: 固定ページ + 全作品の詳細', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
  fs.mkdirSync(path.join(root, 'src/content/works'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/content/works/b.md'), '');
  fs.writeFileSync(path.join(root, 'src/content/works/a.md'), '');
  assert.deepEqual(routes(root), ['/', '/about', '/works', '/downloads', '/contact', '/works/a', '/works/b']);
});
