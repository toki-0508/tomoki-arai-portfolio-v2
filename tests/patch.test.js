import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyPatch, PatchError } from '../src/editor/patch.js';
import { parseFrontmatter, parseSections, splitBody } from '../src/lib/markdown-parse.js';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const WORK = 'src/content/works/sample.md';
const RAW = [
  '---',
  'name: サンプル',
  'date: 2026-10',
  'tags: [React, Vite]',
  'steps:',
  '  - 開く',
  '  - 押す',
  'summary: 1行の紹介です。',
  '---',
  '',
  'リードです。',
  '',
  '## 概要',
  '',
  '本文A。',
  '',
  '## 特徴',
  '',
  '- 項目1',
  '- 項目2',
  '',
].join('\n');

// 2つの文字列で、違う行の番号だけを返す(行数が同じときに使う)
const diffLines = (a, b) => {
  const x = a.split('\n');
  const y = b.split('\n');
  assert.equal(x.length, y.length, '行数が変わっている');
  return x.flatMap((line, i) => (line === y[i] ? [] : [i]));
};
const data = (raw) => parseFrontmatter(raw).data;

test('frontmatter の1項目だけを書き換える', () => {
  const out = applyPatch(WORK, RAW, { field: 'summary' }, '新しい紹介です。');
  assert.deepEqual(diffLines(RAW, out), [7]);
  assert.equal(data(out).summary, '新しい紹介です。');
});

test('「 #」や引用符で始まる値は引用符で囲み、同じ値として読み直せる', () => {
  for (const value of ['C# と #タグ', '"引用"から始まる', '[括弧]で始まる', 'true']) {
    assert.equal(data(applyPatch(WORK, RAW, { field: 'summary' }, value)).summary, value);
  }
});

test('配列: 元の形を保ち、カンマを含むときはブロックにする', () => {
  const inline = applyPatch(WORK, RAW, { field: 'tags' }, ['React', 'Three.js']);
  assert.match(inline, /^tags: \[React, Three\.js\]$/m);
  const block = applyPatch(WORK, RAW, { field: 'tags' }, ['A, B', 'C']);
  assert.deepEqual(data(block).tags, ['A, B', 'C']);
  const steps = applyPatch(WORK, RAW, { field: 'steps' }, ['開く', '選ぶ', '押す']);
  assert.match(steps, /^steps:\n {2}- 開く\n {2}- 選ぶ\n {2}- 押す$/m);
  assert.equal(data(applyPatch(WORK, RAW, { field: 'tags' }, [])).tags, undefined);
});

test('空にすると項目ごと消え、無い項目は末尾に足す', () => {
  assert.equal(data(applyPatch(WORK, RAW, { field: 'summary' }, '')).summary, undefined);
  const added = applyPatch(WORK, RAW, { field: 'imageCaption' }, '左：一覧。右：設定。');
  assert.equal(data(added).imageCaption, '左：一覧。右：設定。');
  assert.match(added, /summary: 1行の紹介です。\nimageCaption: 左：一覧。右：設定。\n---\n/);
});

test('値の検査', () => {
  const bad = [
    [{ field: 'name' }, ''],
    [{ field: 'date' }, '2026/10'],
    [{ field: 'url' }, 'example.com'],
    [{ field: 'summary' }, '1行目\n2行目'],
    [{ field: 'featured' }, '1'],
    [{ field: 'image' }, '/images/projects/x.png'],
    [{ field: 'imageFit' }, 'cover'],
  ];
  for (const [target, value] of bad) {
    assert.throws(() => applyPatch(WORK, RAW, target, value), PatchError, JSON.stringify(target));
  }
  const image = applyPatch(WORK, RAW, { field: 'image' }, '/images/projects/sample-20261109.png', { allowImage: true });
  assert.equal(data(image).image, '/images/projects/sample-20261109.png');
  assert.throws(() => applyPatch(WORK, RAW, { field: 'image' }, '/etc/passwd', { allowImage: true }), PatchError);
});

test('本文: 見出し・セクション本文・リードだけを書き換える', () => {
  const title = applyPatch(WORK, RAW, { section: 1, part: 'title' }, 'できること');
  assert.deepEqual(diffLines(RAW, title), [16]);
  assert.equal(parseSections(title.slice(title.indexOf('\n---\n') + 5))[1].title, 'できること');

  const body = applyPatch(WORK, RAW, { section: 0, part: 'body' }, '段落1。\n\n\n\n- 箇条1\n- 箇条2  ');
  assert.equal(splitBody(parseFrontmatter(body).body).sections[0].body, '段落1。\n\n- 箇条1\n- 箇条2');
  assert.equal(splitBody(parseFrontmatter(body).body).sections[1].body, '- 項目1\n- 項目2');
  assert.ok(body.startsWith(RAW.slice(0, RAW.indexOf('## 概要'))));

  const lead = applyPatch(WORK, RAW, { part: 'lead' }, '新しいリード。');
  assert.equal(splitBody(parseFrontmatter(lead).body).lead, '新しいリード。');
  assert.equal(splitBody(parseFrontmatter(applyPatch(WORK, RAW, { part: 'lead' }, '')).body).lead, '');
});

test('本文の検査', () => {
  assert.throws(() => applyPatch(WORK, RAW, { section: 0, part: 'body' }, '## 新しい見出し\n本文'), PatchError);
  assert.throws(() => applyPatch(WORK, RAW, { section: 0, part: 'body' }, '   \n\n'), PatchError);
  assert.throws(() => applyPatch(WORK, RAW, { section: 5, part: 'body' }, 'x'), PatchError);
  assert.throws(() => applyPatch(WORK, RAW, { section: 0, part: 'title' }, ''), PatchError);
});

test('splitBody は表示用のパーサーと同じ区切りで分ける', () => {
  assert.deepEqual(splitBody('\nリード\n\n## A\n\n本文A\n\n## B\n本文B\n'), {
    lead: 'リード',
    sections: [{ title: 'A', body: '本文A' }, { title: 'B', body: '本文B' }],
  });
});

test('copy.json と site.json は既存の文字列だけを書き換える', () => {
  const copy = '{\n  "home.cta.title": "一緒に何か作りませんか？",\n  "home.cta.text": "お気軽に。"\n}\n';
  const out = applyPatch('src/content/copy.json', copy, { key: 'home.cta.title' }, '一緒に作りましょう');
  assert.equal(out, '{\n  "home.cta.title": "一緒に作りましょう",\n  "home.cta.text": "お気軽に。"\n}\n');
  assert.throws(() => applyPatch('src/content/copy.json', copy, { key: 'home.cta.none' }, 'x'), PatchError);
  assert.throws(() => applyPatch('src/content/copy.json', copy, { key: 'home.cta.title' }, ''), PatchError);

  const site = `${JSON.stringify({ MVV: [{ label: 'Mission', text: '変える' }] }, null, 2)}\n`;
  const siteOut = applyPatch('src/content/site.json', site, { path: 'MVV.0.text' }, '形にする');
  assert.equal(JSON.parse(siteOut).MVV[0].text, '形にする');
  assert.throws(() => applyPatch('src/content/site.json', site, { path: 'MVV.0' }, 'x'), PatchError);
  assert.throws(() => applyPatch('src/content/site.json', site, { path: '__proto__.x' }, 'x'), PatchError);
});

test('対象外のファイルは書き換えない', () => {
  assert.throws(() => applyPatch('src/App.jsx', 'x', { field: 'name' }, 'y'), PatchError);
  assert.throws(() => applyPatch('src/content/works/../site.json', RAW, { field: 'name' }, 'y'), PatchError);
});

test('frontmatter: 項目名は許可リストの自前のキーだけ(継承プロパティは不可)', () => {
  for (const field of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    assert.throws(() => applyPatch(WORK, RAW, { field }, 'hi'), PatchError, field);
    assert.throws(() => applyPatch('src/content/downloads/sample.md', RAW, { field }, 'hi'), PatchError, field);
  }
});

test('JSON: 整形されていない入力は書き換えず PatchError', () => {
  assert.throws(() => applyPatch('src/content/copy.json', '{"a":"b"}', { key: 'a' }, 'c'), PatchError);
});

test('JSON: 壊れた入力は PatchError(SyntaxError のまま出さない)', () => {
  assert.throws(() => applyPatch('src/content/copy.json', '{', { key: 'a' }, 'c'), PatchError);
});

test('JSON: 実ファイル(copy.json / site.json)は指定した1か所だけ変わる', () => {
  const copyFile = 'src/content/copy.json';
  const copyRaw = readFileSync(resolve(ROOT, copyFile), 'utf8');
  const key = Object.keys(JSON.parse(copyRaw))[0];
  const copyOut = applyPatch(copyFile, copyRaw, { key }, '差し替え');
  assert.equal(diffLines(copyRaw, copyOut).length, 1);
  assert.equal(JSON.parse(copyOut)[key], '差し替え');

  const siteFile = 'src/content/site.json';
  const siteRaw = readFileSync(resolve(ROOT, siteFile), 'utf8');
  const siteOut = applyPatch(siteFile, siteRaw, { path: 'MVV.0.label' }, '差し替え');
  assert.equal(diffLines(siteRaw, siteOut).length, 1);
  assert.equal(JSON.parse(siteOut).MVV[0].label, '差し替え');
});

test('frontmatter のないファイルの本文は書き換えない', () => {
  assert.throws(() => applyPatch(WORK, 'リードだけ\n', { part: 'lead' }, '---\nname: x\n---'), PatchError);
});
