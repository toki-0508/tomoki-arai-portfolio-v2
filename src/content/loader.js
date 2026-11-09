import { parseFrontmatter, parseSections, parseLead } from '../lib/markdown.jsx';
import { asset } from '../asset.js';
import { categoryId, categoryLabel } from './categories.js';

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

// 'YYYY-MM' → 'YYYY.MM'(表示用)。想定外の形式はそのまま返す。
const dateLabel = (date) => {
  const m = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(String(date ?? ''));
  return m ? `${m[1]}.${m[2].padStart(2, '0')}` : String(date ?? '');
};

const toList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const byDateDesc = (a, b) => String(b.date).localeCompare(String(a.date));
const LAST = Number.MAX_SAFE_INTEGER;
const byPriority = (a, b) =>
  Number(a.category === 'other') - Number(b.category === 'other') ||
  a.priority - b.priority ||
  byDateDesc(a, b);

function entries(globbed) {
  return Object.entries(globbed).map(([path, raw]) => {
    const id = path.split('/').pop().replace(/\.md$/, '');
    const { data, body } = parseFrontmatter(raw);
    return { id, data, body };
  });
}

function orderNumber(value) {
  const order = Number(value);
  return typeof value === 'string' && Number.isSafeInteger(order) && order > 0 ? order : LAST;
}

// ---------- 作品 ----------
const workFiles = import.meta.glob('./works/*.md', { query: '?raw', import: 'default', eager: true });

export const WORKS = entries(workFiles)
  .map(({ id, data, body }) => {
    const category = categoryId('work', data.category);
    const featuredOrder = orderNumber(data.featured);
    return {
      id,
      name: data.name || id,
      category,
      categoryLabel: categoryLabel(category),
      date: data.date ?? '',
      dateLabel: dateLabel(data.date),
      tags: toList(data.tags),
      image: data.image ? asset(data.image) : null,
      imageFit: data.imageFit === 'contain' ? 'contain' : undefined,
      imageAlt: data.imageAlt || '',
      imageCaption: data.imageCaption || '',
      url: data.url || null,
      github: data.github || null,
      summary: data.summary || '',
      featured: featuredOrder !== LAST || data.featured === true,
      featuredOrder,
      priority: orderNumber(data.priority),
      role: data.role || '',
      status: data.status || '',
      outcome: data.outcome || '',
      steps: toList(data.steps),
      relatedIds: toList(data.related),
      sections: parseSections(body),
      lead: parseLead(body),
    };
  })
  .sort((a, b) =>
    Number(b.featured) - Number(a.featured) ||
    a.featuredOrder - b.featuredOrder ||
    byPriority(a, b));

export const workById = (id) => WORKS.find((work) => work.id === id) ?? null;

// featured 指定を優先し、足りない分を新しい順で埋めて count 件返す
export function featuredWorks(count = 3) {
  return WORKS.slice(0, count);
}

// ---------- ダウンロード ----------
const downloadFiles = import.meta.glob('./downloads/*.md', { query: '?raw', import: 'default', eager: true });

export const DOWNLOADS = entries(downloadFiles)
  .map(({ id, data, body }) => {
    const category = categoryId('download', data.category);
    return {
      id,
      name: data.name || id,
      category,
      categoryLabel: categoryLabel(category),
      priority: orderNumber(data.priority),
      date: data.date ?? '',
      dateLabel: dateLabel(data.date),
      size: data.size || '',
      length: data.length || '',
      platform: data.platform || '',
      note: data.note || '',
      tags: toList(data.tags),
      file: data.file ? asset(data.file) : null,
      rawFile: data.file || '',
      downloadLabel: data.downloadLabel || 'ダウンロード',
      guide: data.guide ? asset(data.guide) : null,
      image: data.image ? asset(data.image) : null,
      lead: parseLead(body),
    };
  })
  .sort(byPriority);

export const isAudio = (download) => /\.(mp3|wav|m4a|ogg)$/i.test(download.rawFile);

// ---------- 技術の使用実績 ----------
// 作品・ダウンロードの tags を数える。プロフィールのスキル欄で「実際に使っている技術」を示すのに使う。
const normalize = (name) => String(name).trim().toLowerCase();
const TECH_USAGE = new Map();
for (const item of [...WORKS, ...DOWNLOADS]) {
  for (const tag of item.tags) TECH_USAGE.set(normalize(tag), (TECH_USAGE.get(normalize(tag)) ?? 0) + 1);
}

export const usageOf = (name) => TECH_USAGE.get(normalize(name)) ?? 0;
