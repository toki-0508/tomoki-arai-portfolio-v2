import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DraftStore, EditorError, sha256 } from '../scripts/editor/drafts.mjs';

const SAMPLE = '---\nname: サンプル\n---\n\n## 概要\n\n本文。\n';
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
const NOW = new Date(2026, 10, 9);

function makeRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'drafts-'));
  fs.mkdirSync(path.join(root, 'src/content/works'), { recursive: true });
  fs.mkdirSync(path.join(root, 'public/images/projects'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/content/works/sample.md'), SAMPLE);
  fs.writeFileSync(path.join(root, 'src/content/works/sample-model.md'), SAMPLE.replace('サンプル', 'モデル'));
  fs.writeFileSync(path.join(root, 'src/content/copy.json'), '{\n  "a": "b"\n}\n');
  return root;
}
const rejects = (fn, status) => assert.throws(fn, (err) => err instanceof EditorError && err.status === status);

test('編集できるファイルだけを受け付ける', () => {
  const store = new DraftStore(makeRoot());
  assert.equal(store.assertContentFile('src/content/works/sample.md'), 'src/content/works/sample.md');
  assert.equal(store.assertContentFile('src/content/copy.json'), 'src/content/copy.json');
  for (const bad of ['../x.md', 'src/content/works/../copy.json', 'src/App.jsx', 'src\\content\\copy.json', './src/content/copy.json', 42]) {
    rejects(() => store.assertContentFile(bad), 403);
  }
  rejects(() => store.assertContentFile('src/content/works/none.md'), 404);
});

test('下書きに書き、本物は変えない。本物と同じに戻すと下書きは消える', () => {
  const root = makeRoot();
  const store = new DraftStore(root);
  const rel = 'src/content/works/sample.md';
  store.write(rel, SAMPLE.replace('本文。', '新しい本文。'));
  assert.equal(fs.readFileSync(path.join(root, rel), 'utf8'), SAMPLE);
  assert.ok(store.hasDraft(rel));
  assert.match(store.read(rel), /新しい本文。/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, '.editor/manifest.json'), 'utf8')), { [rel]: { base: sha256(SAMPLE) } });

  store.write(rel, SAMPLE);
  assert.equal(store.hasDraft(rel), false);
  assert.deepEqual(store.list(), []);
});

test('一覧: 名前と、本物が後から更新されたかどうか', () => {
  const root = makeRoot();
  const store = new DraftStore(root);
  const rel = 'src/content/works/sample.md';
  store.write(rel, SAMPLE.replace('name: サンプル', 'name: 新しい名前'));
  store.write('src/content/copy.json', '{\n  "a": "c"\n}\n');
  assert.deepEqual(store.list(), [
    { file: 'src/content/copy.json', label: 'サイトの文言', conflict: false, images: [] },
    { file: rel, label: '作品「新しい名前」', conflict: false, images: [] },
  ]);
  fs.writeFileSync(path.join(root, rel), `${SAMPLE}追記\n`);
  assert.equal(store.list().find((d) => d.file === rel).conflict, true);
});

test('画像: 名前の付け方・形式と大きさの検査・前の下書き画像の片付け', () => {
  const root = makeRoot();
  const store = new DraftStore(root);
  const rel = 'src/content/works/sample.md';
  fs.writeFileSync(path.join(root, 'public/images/projects/sample-20261109.png'), PNG);

  assert.equal(store.saveImage(rel, PNG, { now: NOW }), '/images/projects/sample-20261109-2.png');
  assert.ok(store.draftImagePath('sample-20261109-2.png'));

  store.saveImage('src/content/works/sample-model.md', JPG, { now: NOW });
  assert.equal(store.saveImage(rel, JPG, { now: NOW }), '/images/projects/sample-20261109.jpg');
  assert.equal(store.draftImagePath('sample-20261109-2.png'), null);
  assert.ok(store.draftImagePath('sample-model-20261109.jpg'), '別の作品の画像は消さない');

  rejects(() => store.saveImage(rel, Buffer.from('GIF89a........'), { now: NOW }), 415);
  rejects(() => store.saveImage(rel, Buffer.concat([PNG, Buffer.alloc(10 * 1024 * 1024)]), { now: NOW }), 413);
  rejects(() => store.saveImage('src/content/copy.json', PNG, { now: NOW }), 403);
  assert.equal(store.draftImagePath('../manifest.json'), null);
  assert.equal(store.draftImagePath('none.png'), null);
});

test('取り消し: 1件(画像も一緒に)とすべて', () => {
  const root = makeRoot();
  const store = new DraftStore(root);
  const rel = 'src/content/works/sample.md';
  store.write(rel, `${SAMPLE}追記\n`);
  store.saveImage(rel, PNG, { now: NOW });
  store.write('src/content/copy.json', '{\n  "a": "c"\n}\n');
  assert.deepEqual(store.list().find((d) => d.file === rel).images, ['sample-20261109.png']);

  store.discard(rel);
  assert.equal(store.hasDraft(rel), false);
  assert.equal(store.draftImagePath('sample-20261109.png'), null);
  assert.equal(store.list().length, 1);

  store.discardAll();
  assert.deepEqual(store.list(), []);
});

test('メモ', () => {
  const store = new DraftStore(makeRoot());
  assert.equal(store.getNotes(), '');
  store.setNotes('ここ長いかも');
  assert.equal(store.getNotes(), 'ここ長いかも');
  rejects(() => store.setNotes('あ'.repeat(20001)), 413);
});

test('壊れた manifest は 500 で知らせる', () => {
  const root = makeRoot();
  fs.mkdirSync(path.join(root, '.editor'), { recursive: true });
  fs.writeFileSync(path.join(root, '.editor/manifest.json'), '{broken');
  const store = new DraftStore(root);
  rejects(() => store.list(), 500);
});
