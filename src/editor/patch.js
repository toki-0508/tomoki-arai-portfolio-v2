// ============================================================
// 編集モードの書き換え(純粋関数)。
// 指定した場所だけを書き換え、ほかの行・コメント・順番は1文字も変えない。
// 保存窓口(Node)とテストの両方から使う。
//
// 指定(target)の形
//   copy.json            { key }
//   site.json            { path: 'MVV.0.text' }
//   frontmatter の項目   { field }
//   リード文             { part: 'lead' }
//   セクション           { section: 番号, part: 'title' | 'body' }
// ============================================================
import { bodyRegions } from '../lib/markdown-parse.js';
import { COPY_FILE, SITE_FILE } from './shared.js';

export class PatchError extends Error {}

const WORK_FILE = /^src\/content\/works\/[a-z0-9][a-z0-9-]*\.md$/;
const DOWNLOAD_FILE = /^src\/content\/downloads\/[a-z0-9][a-z0-9-]*\.md$/;
const IMAGE_VALUE = /^\/images\/projects\/[a-z0-9][a-z0-9-]*\.(png|jpg)$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

// 書き換えられる frontmatter の項目と、値の種類
export const WORK_FIELDS = {
  name: 'required',
  summary: 'text',
  role: 'text',
  status: 'text',
  outcome: 'text',
  date: 'date',
  tags: 'list',
  steps: 'list',
  url: 'url',
  github: 'url',
  imageAlt: 'text',
  imageCaption: 'text',
  imageFit: 'fit',
};
export const DOWNLOAD_FIELDS = {
  name: 'required',
  date: 'date',
  size: 'text',
  length: 'text',
  platform: 'text',
  note: 'text',
  tags: 'list',
};

export function fileKind(file) {
  if (file === COPY_FILE) return 'copy';
  if (file === SITE_FILE) return 'site';
  if (WORK_FILE.test(file)) return 'work';
  if (DOWNLOAD_FILE.test(file)) return 'download';
  return null;
}

function oneLine(value) {
  const text = String(value ?? '').trim();
  if (/[\r\n]/.test(text)) throw new PatchError('1行で入力してください');
  return text;
}

function requireLine(value) {
  const text = oneLine(value);
  if (!text) throw new PatchError('空にはできません');
  return text;
}

function normalizeField(type, value) {
  if (type === 'list') {
    if (!Array.isArray(value)) throw new PatchError('一覧の形で送ってください');
    return value.map(oneLine).filter(Boolean);
  }
  const text = oneLine(value);
  if (type === 'required' && !text) throw new PatchError('空にはできません');
  if (type === 'date' && !/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) throw new PatchError('日付は 2026-10 のように「年-月」で入力してください');
  if (type === 'url' && text && !/^https?:\/\/\S+$/.test(text)) throw new PatchError('URL は https:// から入力してください');
  if (type === 'fit' && text && text !== 'contain') throw new PatchError('画像の表示は「全体を表示(contain)」か空にしてください');
  return text;
}

// ---------- JSON ----------
function setJsonString(raw, path, value) {
  if (path.some((key) => key === '__proto__' || key === 'constructor' || key === 'prototype')) {
    throw new PatchError('書き換えられない場所です');
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new PatchError('JSON を読めませんでした');
  }
  // 整形の決まった形でないファイルは、書き換えると他の行まで変わるので触らない
  if (`${JSON.stringify(data, null, 2)}\n` !== raw) {
    throw new PatchError('この JSON は決まった形で書かれていないため、書き換えられません');
  }
  let parent = data;
  for (const key of path.slice(0, -1)) parent = parent?.[key];
  const last = path[path.length - 1];
  if (parent === null || typeof parent !== 'object' || !Object.hasOwn(parent, last) || typeof parent[last] !== 'string') {
    throw new PatchError(`書き換えられない場所です: ${path.join('.')}`);
  }
  parent[last] = value;
  return `${JSON.stringify(data, null, 2)}\n`;
}

// ---------- frontmatter ----------
// 既存のパーサー(parseScalar)で同じ値として読めるよう、紛らわしい値は引用符で囲む
const needsQuotes = (text) =>
  /\s#/.test(text) || /^[\s"'[#]/.test(text) || /\s$/.test(text) || text === 'true' || text === 'false';
const formatScalar = (text) => (needsQuotes(text) ? `"${text}"` : text);

function setFrontmatterField(raw, field, value) {
  const match = FRONTMATTER.exec(raw);
  if (!match) throw new PatchError('frontmatter が見つかりません');
  const open = /^---\r?\n/.exec(raw)[0];
  const close = match[0].slice(open.length + match[1].length);
  const lines = match[1].split('\n');

  const start = lines.findIndex((line) => line.startsWith(`${field}:`));
  let end = start + 1;
  if (start >= 0) while (end < lines.length && /^\s+-\s+/.test(lines[end])) end++;
  const wasBlock = start >= 0 && (end > start + 1 || lines[start].trim() === `${field}:`);

  let next;
  if (Array.isArray(value)) {
    if (!value.length) next = [];
    else if (wasBlock || value.some((item) => /[,[\]]/.test(item))) next = [`${field}:`, ...value.map((item) => `  - ${formatScalar(item)}`)];
    else next = [`${field}: [${value.map(formatScalar).join(', ')}]`];
  } else {
    next = value ? [`${field}: ${formatScalar(value)}`] : [];
  }

  if (start >= 0) lines.splice(start, end - start, ...next);
  else lines.push(...next);
  return `${open}${lines.join('\n')}${close}${raw.slice(match[0].length)}`;
}

// ---------- 本文 ----------
// 入力を行に整える: 末尾の空白と前後の空行を落とし、続く空行は1行にまとめる
function blockLines(value, { allowEmpty }) {
  const out = [];
  for (const line of String(value ?? '').replace(/\r\n?/g, '\n').split('\n').map((l) => l.replace(/\s+$/, ''))) {
    if (/^##\s+/.test(line)) throw new PatchError('本文に「## 」で始まる行は使えません。見出しはページの見出しを直接直してください');
    if (!line && (!out.length || !out[out.length - 1])) continue;
    out.push(line);
  }
  while (out.length && !out[out.length - 1]) out.pop();
  if (!out.length && !allowEmpty) throw new PatchError('本文を空にはできません');
  return out;
}

// 範囲を「空行 + 本文 + 空行」に置き換える(見出しや次の見出しとの間を1行あける)
function replaceRegion(lines, { start, end }, body) {
  const region = body.length ? ['', ...body, ''] : [''];
  return [...lines.slice(0, start), ...region, ...lines.slice(end)].join('\n');
}

function patchBody(raw, target, value) {
  const head = FRONTMATTER.exec(raw)?.[0] ?? '';
  const { lines, lead, sections } = bodyRegions(raw.slice(head.length));
  if (target.part === 'lead') return head + replaceRegion(lines, lead, blockLines(value, { allowEmpty: true }));

  const section = Number.isInteger(target.section) ? sections[target.section] : undefined;
  if (!section) throw new PatchError('セクションが見つかりません');
  if (target.part === 'title') {
    const title = requireLine(value).replace(/^#+\s*/, '');
    if (!title) throw new PatchError('空にはできません');
    lines[section.heading] = `## ${title}`;
    return head + lines.join('\n');
  }
  return head + replaceRegion(lines, section, blockLines(value, { allowEmpty: false }));
}

// ---------- 入口 ----------
export function applyPatch(file, raw, target = {}, value, { allowImage = false } = {}) {
  const kind = fileKind(file);
  if (kind === 'copy') {
    if (typeof target.key !== 'string') throw new PatchError('文言のキーがありません');
    return setJsonString(raw, [target.key], requireLine(value));
  }
  if (kind === 'site') {
    if (typeof target.path !== 'string') throw new PatchError('場所の指定がありません');
    return setJsonString(raw, target.path.split('.'), requireLine(value));
  }
  if (kind === 'work' || kind === 'download') {
    if (typeof target.field === 'string') {
      if (target.field === 'image') {
        if (!allowImage) throw new PatchError('画像は「画像を差し替え」から変更してください');
        if (!IMAGE_VALUE.test(String(value))) throw new PatchError('画像のパスが正しくありません');
        return setFrontmatterField(raw, 'image', value);
      }
      const fields = kind === 'work' ? WORK_FIELDS : DOWNLOAD_FIELDS;
      if (!Object.hasOwn(fields, target.field)) throw new PatchError(`「${target.field}」はここでは変更できません`);
      const type = fields[target.field];
      return setFrontmatterField(raw, target.field, normalizeField(type, value));
    }
    if (['lead', 'title', 'body'].includes(target.part)) return patchBody(raw, target, value);
  }
  throw new PatchError('この書き換えには対応していません');
}
