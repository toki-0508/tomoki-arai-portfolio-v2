// ============================================================
// 編集モード(npm run edit)の Vite プラグイン。dev サーバーでだけ動く。
//
//   1. src/editor/index.jsx(本番用の部品)を src/editor/live/index.jsx に差し替える
//   2. src/content/ のファイルを読み込むとき、下書きがあれば下書きを返す
//   3. /images/projects/ へのリクエストは、下書きの画像があればそれを返す
//   4. 保存窓口 /__editor/* を開く(このMacから、X-Editor ヘッダー付きのときだけ)
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { applyPatch, PatchError } from '../../src/editor/patch.js';
import { DraftStore, EditorError, MAX_IMAGE_BYTES } from './drafts.mjs';
import { isTrustedRequest, readBody, readJson, sendJson } from './http.mjs';

export function editorPlugin() {
  let root;
  let store;
  let server = null;

  // 下書きが変わったら、元のファイルを読み込んでいるモジュールを読み込み直す(ページは即座に更新される)
  const reload = (rel) => {
    if (!server) return;
    for (const mod of server.moduleGraph.getModulesByFile(path.join(root, rel)) ?? []) server.reloadModule(mod);
  };

  async function handle(req, res, url) {
    const route = `${req.method} ${url.pathname}`;
    if (route === 'GET /__editor/state') {
      return sendJson(res, 200, { drafts: store.list(), notes: store.getNotes() });
    }
    if (route === 'POST /__editor/patch') {
      const { file, target, value } = await readJson(req);
      store.assertContentFile(file);
      store.write(file, applyPatch(file, store.read(file), target, value));
      reload(file);
      return sendJson(res, 200, { ok: true });
    }
    if (route === 'POST /__editor/image') {
      const file = store.assertContentFile(url.searchParams.get('file'));
      const image = store.saveImage(file, await readBody(req, MAX_IMAGE_BYTES + 1));
      store.write(file, applyPatch(file, store.read(file), { field: 'image' }, image, { allowImage: true }));
      reload(file);
      return sendJson(res, 200, { ok: true, image });
    }
    if (route === 'POST /__editor/discard') {
      const { file } = await readJson(req);
      const files = file ? [store.assertContentFile(file)] : store.list().map((draft) => draft.file);
      if (file) store.discard(file);
      else store.discardAll();
      files.forEach(reload);
      return sendJson(res, 200, { ok: true });
    }
    if (route === 'PUT /__editor/notes') {
      const { text } = await readJson(req);
      store.setNotes(String(text ?? ''));
      return sendJson(res, 200, { ok: true });
    }
    throw new EditorError(404, '窓口が見つかりません');
  }

  function serveDraftImage(pathname, res) {
    let name;
    try {
      name = decodeURIComponent(pathname.slice('/images/projects/'.length));
    } catch {
      return false;
    }
    const draft = store.draftImagePath(name);
    if (!draft) return false;
    res.setHeader('Content-Type', draft.endsWith('.png') ? 'image/png' : 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(draft).pipe(res);
    return true;
  }

  return {
    name: 'portfolio-editor',
    apply: 'serve',
    enforce: 'pre',

    configResolved(config) {
      root = config.root;
      store = new DraftStore(root);
    },

    async resolveId(source, importer, options) {
      if (!importer || !/editor\/index\.jsx$/.test(source)) return null;
      if (importer.includes(`${path.sep}src${path.sep}editor${path.sep}live${path.sep}`)) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolved?.id === path.join(root, 'src/editor/index.jsx') ? path.join(root, 'src/editor/live/index.jsx') : null;
    },

    load(id) {
      const [file, query = ''] = id.split('?');
      if (!file.startsWith(path.join(root, 'src', 'content') + path.sep)) return null;
      const rel = path.relative(root, file).split(path.sep).join('/');
      if (!store.hasDraft(rel)) return null;
      const text = store.read(rel);
      // ?raw は文字列として、.json はそのまま返す(JSON への変換は Vite がこの後に行う)
      return query.split('&').includes('raw') ? `export default ${JSON.stringify(text)}` : text;
    },

    configureServer(devServer) {
      server = devServer;
      // editor:apply などで下書きが外から変わったときも、ページに反映する
      server.watcher.add(store.draftsDir);
      const onDraftChange = (file) => {
        const rel = path.relative(store.draftsDir, file).split(path.sep).join('/');
        if (rel.startsWith('src/content/')) reload(rel);
      };
      for (const event of ['add', 'change', 'unlink']) server.watcher.on(event, onDraftChange);

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (req.method === 'GET' && url.pathname.startsWith('/images/projects/')) {
          if (!serveDraftImage(url.pathname, res)) next();
          return;
        }
        if (!url.pathname.startsWith('/__editor/')) {
          next();
          return;
        }
        try {
          if (!isTrustedRequest(req.headers)) throw new EditorError(403, 'このリクエストは受け付けられません');
          await handle(req, res, url);
        } catch (err) {
          const status = err instanceof EditorError ? err.status : err instanceof PatchError ? 400 : 500;
          sendJson(res, status, { error: err.message });
        }
      });
    },
  };
}
