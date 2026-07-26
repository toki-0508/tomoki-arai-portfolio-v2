import { parseFrontmatter, parseSections, parseLead } from '../lib/markdown.jsx';
import { asset } from '../asset.js';

// ============================================================
// コンテンツローダー
//
// 作品      → src/content/works/<id>.md
// 公開データ → src/content/downloads/<id>.md
//
// ファイルを置くだけでビルドに取り込まれる(コード変更は不要)。
// reports/ に置いたレポートから scripts/ingest-reports.mjs が
// この形式の md を自動生成する。
// ============================================================

export const WORK_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'web', label: 'Web' },
  { id: 'app', label: 'App' },
  { id: '3d', label: '3D' },
  { id: 'other', label: 'Other' },
];

export const DOWNLOAD_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'app', label: 'App' },
  { id: '3d', label: '3D Models' },
  { id: 'sounds', label: 'Sounds' },
  { id: 'other', label: 'Other' },
];

const workLabel = (id) => WORK_CATEGORIES.find((c) => c.id === id)?.label ?? 'Other';
const downloadLabel = (id) => DOWNLOAD_CATEGORIES.find((c) => c.id === id)?.label ?? 'Other';

// 'YYYY-MM' → 'YYYY.MM'(表示用)。想定外の形式はそのまま返す。
const dateLabel = (date) => {
  const m = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(String(date ?? ''));
  return m ? `${m[1]}.${m[2].padStart(2, '0')}` : String(date ?? '');
};

const byDateDesc = (a, b) => String(b.date).localeCompare(String(a.date));

function entries(globbed) {
  return Object.entries(globbed).map(([path, raw]) => {
    const id = path.split('/').pop().replace(/\.md$/, '');
    const { data, body } = parseFrontmatter(raw);
    return { id, data, body };
  });
}

// ---------- Works ----------
const workFiles = import.meta.glob('./works/*.md', { query: '?raw', import: 'default', eager: true });

export const WORKS = entries(workFiles)
  .map(({ id, data, body }) => {
    const category = WORK_CATEGORIES.some((c) => c.id === data.category && c.id !== 'all')
      ? data.category
      : 'other';
    return {
      id,
      name: data.name || id,
      category,
      categoryLabel: workLabel(category),
      date: data.date ?? '',
      dateLabel: dateLabel(data.date),
      tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
      image: data.image ? asset(data.image) : null,
      url: data.url || null,
      github: data.github || null,
      summary: data.summary || '',
      featured: data.featured === true,
      sections: parseSections(body),
      lead: parseLead(body),
    };
  })
  .sort(byDateDesc);

export const workById = (id) => WORKS.find((work) => work.id === id) ?? null;

// featured 指定を優先し、残りを新しい順で埋めて count 件返す
export function featuredWorks(count = 3) {
  const picked = WORKS.filter((work) => work.featured);
  for (const work of WORKS) {
    if (picked.length >= count) break;
    if (!picked.includes(work)) picked.push(work);
  }
  return picked.slice(0, count);
}

// ---------- Downloads ----------
const downloadFiles = import.meta.glob('./downloads/*.md', { query: '?raw', import: 'default', eager: true });

export const DOWNLOADS = entries(downloadFiles)
  .map(({ id, data, body }) => {
    const category = DOWNLOAD_CATEGORIES.some((c) => c.id === data.category && c.id !== 'all')
      ? data.category
      : 'other';
    return {
      id,
      name: data.name || id,
      category,
      categoryLabel: downloadLabel(category),
      date: data.date ?? '',
      dateLabel: dateLabel(data.date),
      size: data.size || '',
      file: data.file ? asset(data.file) : null,
      rawFile: data.file || '',
      image: data.image ? asset(data.image) : null,
      lead: parseLead(body),
    };
  })
  .sort(byDateDesc);

export const isAudio = (download) => /\.(mp3|wav|m4a|ogg)$/i.test(download.rawFile);
