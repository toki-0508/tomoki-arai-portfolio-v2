// ============================================================
// 編集モードの下書き置き場(.editor/、Git 管理外)
//
//   .editor/drafts/<本物と同じ相対パス>   下書き(画像は drafts/public/images/projects/)
//   .editor/manifest.json               下書きごとに「作り始めたときの本物のハッシュ」
//   .editor/notes.md                    Claude へのメモ
//
// 本物(src/content/ など)には書き込まない。反映は scripts/editor-apply.mjs が行う。
// ============================================================
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '../../src/lib/markdown-parse.js';
import { fileKind } from '../../src/editor/patch.js';

export class EditorError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_DIR = 'public/images/projects';
const IMAGE_NAME = /^[a-z0-9][a-z0-9-]*\.(png|jpg)$/;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

// 拡張子ではなく、ファイル先頭のバイトで形式を見分ける
export function imageType(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_MAGIC)) return 'png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  return null;
}

const ymd = (date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

// <id>-<YYYYMMDD>[-n].<ext> だけを、その作品の画像とみなす(sample と sample-model を取り違えない)
const isImageOf = (id, name) => new RegExp(`^${id}-\\d{8}(-\\d+)?\\.(png|jpg)$`).test(name);

export class DraftStore {
  constructor(root) {
    this.root = root;
    this.dir = path.join(root, '.editor');
    this.draftsDir = path.join(this.dir, 'drafts');
    this.manifestPath = path.join(this.dir, 'manifest.json');
    this.notesPath = path.join(this.dir, 'notes.md');
  }

  assertContentFile(rel) {
    const valid =
      typeof rel === 'string' &&
      !rel.includes('\\') &&
      path.posix.normalize(rel) === rel &&
      !rel.split('/').includes('..') &&
      fileKind(rel) !== null;
    if (!valid) throw new EditorError(403, 'このファイルは編集できません');
    if (!fs.existsSync(path.join(this.root, rel))) throw new EditorError(404, 'ファイルが見つかりません');
    return rel;
  }

  draftPath(rel) {
    const full = path.resolve(this.draftsDir, rel);
    if (!full.startsWith(this.draftsDir + path.sep)) throw new EditorError(403, 'このファイルは編集できません');
    return full;
  }

  readManifest() {
    try {
      return JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
    } catch {
      return {};
    }
  }

  writeManifest(manifest) {
    fs.mkdirSync(this.dir, { recursive: true });
    fs.writeFileSync(this.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  original(rel) {
    return fs.readFileSync(path.join(this.root, rel), 'utf8');
  }

  hasDraft(rel) {
    try {
      return fs.existsSync(this.draftPath(rel));
    } catch {
      return false;
    }
  }

  read(rel) {
    return this.hasDraft(rel) ? fs.readFileSync(this.draftPath(rel), 'utf8') : this.original(rel);
  }

  write(rel, text) {
    this.assertContentFile(rel);
    const original = this.original(rel);
    const manifest = this.readManifest();
    const target = this.draftPath(rel);
    if (text === original) {
      fs.rmSync(target, { force: true });
      this.removeDraftImages(rel);
      delete manifest[rel];
    } else {
      manifest[rel] ??= { base: sha256(original) };
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, text);
    }
    this.writeManifest(manifest);
  }

  imagesDir() {
    return path.join(this.draftsDir, IMAGE_DIR);
  }

  itemId(rel) {
    return path.posix.basename(rel, '.md');
  }

  draftImagesOf(rel) {
    if (!fs.existsSync(this.imagesDir())) return [];
    const id = this.itemId(rel);
    return fs.readdirSync(this.imagesDir()).filter((name) => isImageOf(id, name)).sort();
  }

  removeDraftImages(rel) {
    for (const name of this.draftImagesOf(rel)) fs.rmSync(path.join(this.imagesDir(), name), { force: true });
  }

  saveImage(rel, buffer, { now = new Date() } = {}) {
    this.assertContentFile(rel);
    if (!['work', 'download'].includes(fileKind(rel))) throw new EditorError(403, '画像を差し替えられるのは作品とダウンロードだけです');
    if (buffer.length > MAX_IMAGE_BYTES) throw new EditorError(413, '画像が大きすぎます(10MBまで)');
    const ext = imageType(buffer);
    if (!ext) throw new EditorError(415, 'PNG か JPEG の画像を選んでください');

    this.removeDraftImages(rel);
    const base = `${this.itemId(rel)}-${ymd(now)}`;
    let name = `${base}.${ext}`;
    for (let n = 2; fs.existsSync(path.join(this.root, IMAGE_DIR, name)); n++) name = `${base}-${n}.${ext}`;
    fs.mkdirSync(this.imagesDir(), { recursive: true });
    fs.writeFileSync(path.join(this.imagesDir(), name), buffer);
    return `/images/projects/${name}`;
  }

  draftImagePath(name) {
    if (!IMAGE_NAME.test(name)) return null;
    const full = path.join(this.imagesDir(), name);
    return fs.existsSync(full) ? full : null;
  }

  discard(rel) {
    this.assertContentFile(rel);
    fs.rmSync(this.draftPath(rel), { force: true });
    this.removeDraftImages(rel);
    const manifest = this.readManifest();
    delete manifest[rel];
    this.writeManifest(manifest);
  }

  discardAll() {
    fs.rmSync(this.draftsDir, { recursive: true, force: true });
    this.writeManifest({});
  }

  label(rel) {
    const kind = fileKind(rel);
    if (kind === 'copy') return 'サイトの文言';
    if (kind === 'site') return 'プロフィール・サイトの情報';
    const name = parseFrontmatter(this.read(rel)).data.name || this.itemId(rel);
    return `${kind === 'work' ? '作品' : 'ダウンロード'}「${name}」`;
  }

  list() {
    const manifest = this.readManifest();
    return Object.keys(manifest)
      .filter((rel) => this.hasDraft(rel) && fs.existsSync(path.join(this.root, rel)))
      .sort()
      .map((rel) => ({
        file: rel,
        label: this.label(rel),
        conflict: sha256(this.original(rel)) !== manifest[rel].base,
        images: this.draftImagesOf(rel),
      }));
  }

  getNotes() {
    try {
      return fs.readFileSync(this.notesPath, 'utf8');
    } catch {
      return '';
    }
  }

  setNotes(text) {
    if (text.length > 20000) throw new EditorError(413, 'メモが長すぎます');
    fs.mkdirSync(this.dir, { recursive: true });
    fs.writeFileSync(this.notesPath, text);
  }
}
