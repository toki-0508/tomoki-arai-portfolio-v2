import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { editorPlugin } from '../scripts/editor/vite-plugin.mjs';
import { isTrustedRequest } from '../scripts/editor/http.mjs';

const SAMPLE = '---\nname: サンプル\nsummary: 紹介です。\n---\n\n## 概要\n\n本文。\n';
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
const H = { host: '127.0.0.1:5174', 'x-editor': '1', origin: 'http://127.0.0.1:5174' };

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-'));
  fs.mkdirSync(path.join(root, 'src/content/works'), { recursive: true });
  fs.mkdirSync(path.join(root, 'public/images/projects'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/content/works/sample.md'), SAMPLE);
  fs.writeFileSync(path.join(root, 'src/content/copy.json'), '{\n  "home.cta.title": "一緒に何か作りませんか？"\n}\n');
  for (const name of ['skill-tree.json', 'skill-icons.json']) fs.copyFileSync(`src/content/${name}`, path.join(root, 'src/content', name));

  const plugin = editorPlugin();
  plugin.configResolved({ root });
  const reloaded = [];
  let handler;
  plugin.configureServer({
    watcher: { add() {}, on() {} },
    moduleGraph: { getModulesByFile: (file) => new Set([{ file }]) },
    reloadModule: async (mod) => reloaded.push(path.relative(root, mod.file)),
    middlewares: { use: (fn) => { handler = fn; } },
  });

  const call = ({ method = 'GET', url, headers = H, body }) =>
    new Promise((resolve) => {
      const chunks = body === undefined ? [] : [Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body))];
      const req = Object.assign(Readable.from(chunks), { method, url, headers });
      const res = {
        statusCode: 200,
        setHeader() {},
        end(data) {
          resolve({ status: this.statusCode, body: data ? JSON.parse(data) : null });
        },
      };
      handler(req, res, () => resolve({ status: 'next' }));
    });
  return { root, plugin, call, reloaded };
}

test('窓口に来たリクエストの検証', () => {
  assert.equal(isTrustedRequest(H), true);
  assert.equal(isTrustedRequest({ ...H, origin: undefined }), true);
  assert.equal(isTrustedRequest({ host: 'localhost:5174', 'x-editor': '1' }), true);
  assert.equal(isTrustedRequest({ ...H, 'x-editor': undefined }), false);
  assert.equal(isTrustedRequest({ ...H, origin: 'https://evil.example' }), false);
  assert.equal(isTrustedRequest({ ...H, host: 'evil.example' }), false);
  assert.equal(isTrustedRequest({ ...H, host: '192.168.0.2:5174', origin: 'http://192.168.0.2:5174' }), false);
});

test('書き換えは下書きに保存され、読み込みは下書きが優先される', async () => {
  const { root, plugin, call, reloaded } = setup();
  const file = 'src/content/works/sample.md';
  const res = await call({ method: 'POST', url: '/__editor/patch', body: { file, target: { field: 'summary' }, value: '新しい紹介です。' } });
  assert.deepEqual(res, { status: 200, body: { ok: true } });
  assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), SAMPLE);
  assert.deepEqual(reloaded, [file]);

  const loaded = plugin.load(`${path.join(root, file)}?raw`);
  assert.match(loaded, /^export default ".*新しい紹介です。/s);
  assert.equal(plugin.load(path.join(root, 'src/content/copy.json')), null);

  await call({ method: 'POST', url: '/__editor/patch', body: { file: 'src/content/copy.json', target: { key: 'home.cta.title' }, value: '一緒に作りましょう' } });
  assert.match(plugin.load(path.join(root, 'src/content/copy.json')), /一緒に作りましょう/);

  const state = await call({ url: '/__editor/state' });
  assert.deepEqual(state.body.drafts.map((d) => d.file), ['src/content/copy.json', file]);
});

test('信用できないリクエスト・不正な値・対象外は拒否する', async () => {
  const { root, call } = setup();
  const body = { file: 'src/content/works/sample.md', target: { field: 'summary' }, value: 'x' };
  assert.equal((await call({ method: 'POST', url: '/__editor/patch', headers: { host: '127.0.0.1:5174' }, body })).status, 403);
  assert.equal((await call({ method: 'POST', url: '/__editor/patch', headers: { ...H, origin: 'https://evil.example' }, body })).status, 403);
  assert.equal(fs.existsSync(path.join(root, '.editor/drafts')), false);

  const bad = await call({ method: 'POST', url: '/__editor/patch', body: { ...body, target: { field: 'date' }, value: '昨日' } });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error, /年-月/);
  assert.equal((await call({ method: 'POST', url: '/__editor/patch', body: { ...body, file: 'vite.config.js' } })).status, 403);
  assert.equal((await call({ method: 'POST', url: '/__editor/patch', body: '{壊れたJSON' })).status, 400);
  assert.equal((await call({ url: '/__editor/none' })).status, 404);
  assert.equal((await call({ url: '/src/main.jsx' })).status, 'next');
});

test('画像の差し替え・取り消し・メモ', async () => {
  const { root, call, plugin } = setup();
  const file = 'src/content/works/sample.md';
  const image = await call({ method: 'POST', url: `/__editor/image?file=${encodeURIComponent(file)}`, body: PNG });
  assert.equal(image.status, 200);
  assert.match(image.body.image, /^\/images\/projects\/sample-\d{8}\.png$/);
  assert.match(plugin.load(`${path.join(root, file)}?raw`), /image: \/images\/projects\/sample-/);
  assert.equal((await call({ method: 'POST', url: `/__editor/image?file=${encodeURIComponent(file)}`, body: Buffer.from('not an image') })).status, 415);

  await call({ method: 'PUT', url: '/__editor/notes', body: { text: 'ここ長いかも' } });
  assert.equal((await call({ url: '/__editor/state' })).body.notes, 'ここ長いかも');

  await call({ method: 'POST', url: '/__editor/discard', body: { file } });
  assert.equal(plugin.load(`${path.join(root, file)}?raw`), null);
  assert.equal(fs.readdirSync(path.join(root, '.editor/drafts/public/images/projects')).length, 0);
});

test('スキル配置は検証・競合確認して下書きだけに保存する', async () => {
  const { root, call, plugin } = setup();
  const file = 'src/content/skill-tree.json';
  const original = fs.readFileSync(path.join(root, file), 'utf8');
  const state = await call({ url: '/__editor/skill-tree' });
  state.body.model.nodes[0].x += 20;
  const body = { model: state.body.model, revision: state.body.revision };
  const saved = await call({ method: 'POST', url: '/__editor/skill-tree', body });
  assert.equal(saved.status, 200);
  assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), original);
  assert.equal(JSON.parse(plugin.load(path.join(root, file))).nodes[0].x, state.body.model.nodes[0].x);
  assert.equal((await call({ method: 'POST', url: '/__editor/skill-tree', body })).status, 409);
  const next = await call({ url: '/__editor/skill-tree' });
  next.body.model.nodes[0].parent = next.body.model.nodes[0].id;
  assert.equal((await call({ method: 'POST', url: '/__editor/skill-tree', body: { model: next.body.model, revision: next.body.revision } })).status, 400);
  assert.equal((await call({ url: '/__editor/skill-tree', headers: { host: '127.0.0.1:5174' } })).status, 403);
  const listed = await call({ url: '/__editor/state' });
  assert.equal(listed.body.drafts[0].label, 'スキルツリーの配置・ノード');
});
