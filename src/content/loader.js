import { parseFrontmatter, parseSections, parseLead } from '../lib/markdown.jsx';
import { asset } from '../asset.js';

// ============================================================
// コンテンツローダー
//
// 作品      → src/content/works/<id>.md
// ダウンロード → src/content/downloads/<id>.md
//
// ファイルを置くだけでビルドに取り込まれる(コード変更は不要)。
// reports/ に置いたレポートから scripts/ingest-reports.mjs が
// この形式の md を自動生成する。
// ============================================================

// カテゴリ表記は作品とダウンロードで共通にする
const LABELS = { all: 'All', web: 'Web', app: 'App', '3d': '3D', sounds: 'Sounds', other: 'Other' };
const categories = (ids) => ids.map((id) => ({ id, label: LABELS[id] }));

export const WORK_CATEGORIES = categories(['all', 'web', 'app', '3d', 'other']);
export const DOWNLOAD_CATEGORIES = categories(['all', 'app', '3d', 'sounds', 'other']);

const pickCategory = (value, list) => (list.some((c) => c.id === value && c.id !== 'all') ? value : 'other');

// 'YYYY-MM' → 'YYYY.MM'(表示用)。想定外の形式はそのまま返す。
const dateLabel = (date) => {
  const m = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(String(date ?? ''));
  return m ? `${m[1]}.${m[2].padStart(2, '0')}` : String(date ?? '');
};

const toList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const byDateDesc = (a, b) => String(b.date).localeCompare(String(a.date));

function entries(globbed) {
  return Object.entries(globbed).map(([path, raw]) => {
    const id = path.split('/').pop().replace(/\.md$/, '');
    const { data, body } = parseFrontmatter(raw);
    return { id, data, body };
  });
}

// トップの注目作品に添える要点。「特徴」の箇条書きの先頭から取る(本文と同じ事実だけを使う)
const highlightsOf = (sections, count = 3) =>
  sections
    .find((section) => section.title === '特徴')
    ?.blocks.find((block) => block.type === 'list')
    ?.items.slice(0, count) ?? [];

// ---------- 作品 ----------
const workFiles = import.meta.glob('./works/*.md', { query: '?raw', import: 'default', eager: true });

export const WORKS = entries(workFiles)
  .map(({ id, data, body }) => {
    const category = pickCategory(data.category, WORK_CATEGORIES);
    const sections = parseSections(body);
    return {
      id,
      name: data.name || id,
      category,
      categoryLabel: LABELS[category],
      date: data.date ?? '',
      dateLabel: dateLabel(data.date),
      tags: toList(data.tags),
      image: data.image ? asset(data.image) : null,
      url: data.url || null,
      github: data.github || null,
      summary: data.summary || '',
      featured: data.featured === true,
      sections,
      lead: parseLead(body),
      highlights: highlightsOf(sections),
    };
  })
  .sort(byDateDesc);

export const workById = (id) => WORKS.find((work) => work.id === id) ?? null;

// featured 指定を優先し、足りない分を新しい順で埋めて count 件返す
export function featuredWorks(count = 3) {
  const picked = WORKS.filter((work) => work.featured);
  for (const work of WORKS) {
    if (picked.length >= count) break;
    if (!picked.includes(work)) picked.push(work);
  }
  return picked.slice(0, count);
}

// ---------- ダウンロード ----------
const downloadFiles = import.meta.glob('./downloads/*.md', { query: '?raw', import: 'default', eager: true });

export const DOWNLOADS = entries(downloadFiles)
  .map(({ id, data, body }) => {
    const category = pickCategory(data.category, DOWNLOAD_CATEGORIES);
    return {
      id,
      name: data.name || id,
      category,
      categoryLabel: LABELS[category],
      date: data.date ?? '',
      dateLabel: dateLabel(data.date),
      size: data.size || '',
      length: data.length || '',
      platform: data.platform || '',
      note: data.note || '',
      tags: toList(data.tags),
      file: data.file ? asset(data.file) : null,
      rawFile: data.file || '',
      image: data.image ? asset(data.image) : null,
      lead: parseLead(body),
    };
  })
  .sort(byDateDesc);

export const isAudio = (download) => /\.(mp3|wav|m4a|ogg)$/i.test(download.rawFile);

// ---------- 技術の使用実績 ----------
// 作品・ダウンロードの tags を数える。プロフィールのスキル欄で「実際に使っている技術」を示すのに使う。
const normalize = (name) => String(name).trim().toLowerCase();
const TECH_USAGE = new Map();
for (const item of [...WORKS, ...DOWNLOADS]) {
  for (const tag of item.tags) TECH_USAGE.set(normalize(tag), (TECH_USAGE.get(normalize(tag)) ?? 0) + 1);
}

export const usageOf = (name) => TECH_USAGE.get(normalize(name)) ?? 0;
