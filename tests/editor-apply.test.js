import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyDrafts, lineDiff, planApply } from '../scripts/editor-apply.mjs';
import { DraftStore } from '../scripts/editor/drafts.mjs';
import { applyPatch } from '../src/editor/patch.js';

const SAMPLE = '---\nname: サンプル\nimage: /images/projects/sample.png\nsummary: 紹介です。\n---\n\n## 概要\n\n本文。\n';
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
const NOW = new Date(2026, 10, 9, 15, 30, 12);
const WORK = 'src/content/works/sample.md';

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apply-'));
  fs.mkdirSync(path.join(root, 'src/content/works'), { recursive: true });
  fs.mkdirSync(path.join(root, 'public/images/projects'), { recursive: true });
  fs.writeFileSync(path.join(root, WORK), SAMPLE);
  fs.writeFileSync(path.join(root, 'public/images/projects/sample.png'), PNG);
  fs.writeFileSync(path.join(root, 'src/content/copy.json'), '{\n  "a": "b"\n}\n');

  const store = new DraftStore(root);
  store.write(WORK, applyPatch(WORK, store.read(WORK), { field: 'summary' }, '新しい紹介です。'));
  const image = store.saveImage(WORK, PNG, { now: NOW });
  store.write(WORK, applyPatch(WORK, store.read(WORK), { field: 'image' }, image, { allowImage: true }));
  store.write('src/content/copy.json', '{\n  "a": "c"\n}\n');
  store.setNotes('ここ長いかも');
  return { root, store, image };
}
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');

test('スキルツリーの下書きを確認して反映・履歴保存する', () => {
  const { root, store } = setup();
  for (const name of ['skill-tree.json', 'skill-icons.json']) fs.copyFileSync(`src/content/${name}`, path.join(root, 'src/content', name));
  const file = 'src/content/skill-tree.json';
  const model = JSON.parse(read(root, file));
  model.nodes[0].x += 20;
  store.write(file, `${JSON.stringify(model, null, 2)}\n`);
  assert.equal(planApply(root).conflicts.length, 0);
  const result = applyDrafts(root, { now: NOW });
  assert.ok(result.applied.includes(file));
  assert.equal(JSON.parse(read(root, file)).nodes[0].x, model.nodes[0].x);
  assert.ok(fs.existsSync(path.join(result.historyDir, 'drafts', file)));
});

test('不正なスキル下書きが混じる場合、ほかのファイルも反映しない', () => {
  const { root, store } = setup();
  for (const name of ['skill-tree.json', 'skill-icons.json']) fs.copyFileSync(`src/content/${name}`, path.join(root, 'src/content', name));
  const file = 'src/content/skill-tree.json';
  const model = JSON.parse(read(root, file));
  model.nodes[0].parent = model.nodes[0].id;
  store.write(file, JSON.stringify(model));
  assert.throws(() => applyDrafts(root), /循環/);
  assert.equal(read(root, WORK), SAMPLE);
});

test('lineDiff は消えた行と足された行を返す', () => {
  assert.deepEqual(lineDiff('a\nb\nc', 'a\nB\nc\nd'), ['- b', '+ B', '+ d']);
  assert.deepEqual(lineDiff('same', 'same'), []);
});

test('確認(dry-run)は何も変えない', () => {
  const { root, image } = setup();
  const plan = planApply(root);
  assert.deepEqual(plan.conflicts, []);
  assert.deepEqual(
    plan.items.map(({ rel, kind, status }) => [rel, kind, status]),
    [
      [`public${image}`, 'image', 'new'],
      ['src/content/copy.json', 'text', 'changed'],
      [WORK, 'text', 'changed'],
    ],
  );
  assert.ok(plan.items.find((item) => item.rel === WORK).diff.includes('+ summary: 新しい紹介です。'));
  assert.equal(plan.notes, 'ここ長いかも');
  assert.equal(read(root, WORK), SAMPLE);
});

test('反映: 本物を書き換え、画像を置き、下書きとメモを控えに移す', () => {
  const { root, store, image } = setup();
  const result = applyDrafts(root, { now: NOW });
  assert.deepEqual(result.applied.sort(), [`public${image}`, 'src/content/copy.json', WORK]);
  assert.match(read(root, WORK), /summary: 新しい紹介です。/);
  assert.ok(fs.existsSync(path.join(root, 'public', image)));
  assert.equal(result.historyDir, path.join(root, '.editor/history/20261109-153012'));
  assert.ok(fs.existsSync(path.join(result.historyDir, 'drafts', WORK)));
  assert.equal(fs.readFileSync(path.join(result.historyDir, 'notes.md'), 'utf8'), 'ここ長いかも');
  assert.deepEqual(store.list(), []);
  assert.equal(store.getNotes(), '');
  assert.deepEqual(result.unusedImages, ['/images/projects/sample.png']);
});

test('ほかから使われている画像は、使われなくなった候補にしない', () => {
  const { root } = setup();
  fs.writeFileSync(path.join(root, 'src/content/works/other.md'), '---\nname: 別\nimage: /images/projects/sample.png\n---\n');
  assert.deepEqual(applyDrafts(root, { now: NOW }).unusedImages, []);
});

test('衝突があれば何も反映しない', () => {
  const { root } = setup();
  fs.writeFileSync(path.join(root, WORK), `${SAMPLE}追記\n`);
  const plan = planApply(root);
  assert.deepEqual(plan.conflicts.map((item) => item.rel), [WORK]);
  assert.throws(() => applyDrafts(root, { now: NOW }), /衝突/);
  assert.equal(read(root, 'src/content/copy.json'), '{\n  "a": "b"\n}\n');
  assert.ok(new DraftStore(root).list().length > 0);
});

test('下書きがなければ何もしない', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apply-empty-'));
  assert.deepEqual(planApply(root).items, []);
  assert.deepEqual(applyDrafts(root, { now: NOW }), { applied: [], historyDir: null, unusedImages: [] });
});

test('許可リスト外のファイルは無視する', () => {
  const { root } = setup();
  fs.mkdirSync(path.join(root, '.editor/drafts/src'), { recursive: true });
  fs.writeFileSync(path.join(root, '.editor/drafts/.DS_Store'), 'x');
  fs.writeFileSync(path.join(root, '.editor/drafts/src/notes.txt'), 'x');
  const plan = planApply(root);
  assert.deepEqual(plan.conflicts, []);
  assert.ok(!plan.items.some((i) => i.rel === '.DS_Store' || i.rel === 'src/notes.txt'));
});
