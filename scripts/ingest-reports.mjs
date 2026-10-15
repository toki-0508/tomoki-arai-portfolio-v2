#!/usr/bin/env node
// ============================================================
// reports/ に置かれた制作レポートをポートフォリオ用コンテンツへ変換する。
//
//   使い方:
//     npm run ingest            … 変換を実行
//     npm run ingest -- --dry-run … 何が起きるかだけ表示
//
//   仕組み:
//     reports/ 直下の .md ファイル、またはレポート一式を入れた
//     サブフォルダ(画像・配布ファイル同梱可)を検出し、
//       - 画像       → public/images/projects/ へコピー
//       - 配布ファイル → public/downloads/ へコピー
//       - 本文       → src/content/works/ or downloads/ の md へ変換
//     処理済みレポートは reports/archive/ へ移動する。
//     形式は reports/_TEMPLATE.md を参照。
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS_DIR = path.join(ROOT, 'reports');
const ARCHIVE_DIR = path.join(REPORTS_DIR, 'archive');
const MANIFEST = path.join(REPORTS_DIR, '.ingested.json');
const WORKS_DIR = path.join(ROOT, 'src', 'content', 'works');
const DOWNLOADS_DIR = path.join(ROOT, 'src', 'content', 'downloads');
const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'projects');
const FILES_DIR = path.join(ROOT, 'public', 'downloads');

const DRY_RUN = process.argv.includes('--dry-run');

const WORK_CATEGORIES = ['web', 'app', '3d', 'electronics', 'other'];
const DOWNLOAD_CATEGORIES = ['app', '3d', 'electronics', 'sounds', 'other'];
// レポートに日本語や別名で書かれた分類を、サイトの分類名にそろえる
const CATEGORY_ALIASES = {
  ウェブ: 'web',
  アプリ: 'app',
  電子工作: 'electronics',
  ハードウェア: 'electronics',
  hardware: 'electronics',
  音源: 'sounds',
  サウンド: 'sounds',
};
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];

// 作品詳細の見出しは全作品で「概要 / 特徴 / 対象 / 作った理由 / 成果と学び」にそろえる。
// 古いテンプレートや言い回しの違う見出しで書かれたレポートも、ここで統一後の名前に置き換える。
const HEADING_ALIASES = {
  主な機能: '特徴',
  機能: '特徴',
  ポイント: '特徴',
  対象ユーザー: '対象',
  想定ユーザー: '対象',
  目的: '作った理由',
  制作の目的: '作った理由',
  作ったきっかけ: '作った理由',
  成果: '成果と学び',
  学んだこと: '成果と学び',
  学び: '成果と学び',
};

function normalizeHeadings(body) {
  return body.replace(/^##\s+(.+?)\s*$/gm, (line, title) => {
    const unified = HEADING_ALIASES[title];
    return unified ? `## ${unified}` : line;
  });
}

// ---------- 小さな frontmatter パーサ(src/lib/markdown.jsx と同じ文法) ----------
function parseScalar(value) {
  let v = String(value).trim();
  const quoted = /^(["'])(.*)\1$/.exec(v);
  if (quoted) return quoted[2];
  v = v.replace(/\s+#.*$/, '').trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}

function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data = {};
  let currentKey = null;
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const listItem = /^\s+-\s+(.*)$/.exec(line);
    if (listItem && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(parseScalar(listItem[1]));
      continue;
    }
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    currentKey = kv[1];
    const value = kv[2].trim();
    if (value === '') data[currentKey] = data[currentKey] ?? '';
    else if (value.startsWith('[') && value.endsWith(']')) {
      data[currentKey] = value.slice(1, -1).split(',').map(parseScalar).filter((x) => x !== '');
    } else data[currentKey] = parseScalar(value);
  }
  return { data, body: raw.slice(match[0].length) };
}

// ---------- ユーティリティ ----------
const log = (...args) => console.log(...args);

function slugify(input) {
  const slug = String(input)
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/^\d{4}-\d{2}(-\d{2})?[-_]?/, '') // 先頭の日付は id に含めない
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `work-${Date.now()}`;
}

function todayMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function humanSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
}

function uniqueTargetPath(dir, id) {
  let candidate = id;
  let n = 2;
  while (fs.existsSync(path.join(dir, `${candidate}.md`))) {
    candidate = `${id}-${n++}`;
  }
  return { id: candidate, file: path.join(dir, `${candidate}.md`) };
}

function copyFile(src, dest) {
  if (DRY_RUN) {
    log(`  [dry] copy ${path.relative(ROOT, src)} -> ${path.relative(ROOT, dest)}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function writeFile(dest, content) {
  if (DRY_RUN) {
    log(`  [dry] write ${path.relative(ROOT, dest)}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
}

// ---------- レポート検出 ----------
// 対象: reports/ 直下の md(README/_TEMPLATE/隠しファイル以外)と、
//       archive 以外のサブフォルダ(中の md がレポート本体)
function findReports() {
  if (!fs.existsSync(REPORTS_DIR)) return [];
  const reports = [];
  for (const entry of fs.readdirSync(REPORTS_DIR, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const full = path.join(REPORTS_DIR, entry.name);
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md') && entry.name !== 'README.md') {
      reports.push({ mdPath: full, baseDir: REPORTS_DIR, moveTarget: full, name: entry.name });
    } else if (entry.isDirectory() && entry.name !== 'archive') {
      const mdName = fs.readdirSync(full).find((f) => f.toLowerCase().endsWith('.md'));
      if (mdName) {
        reports.push({ mdPath: path.join(full, mdName), baseDir: full, moveTarget: full, name: entry.name });
      } else {
        log(`! ${entry.name}/ に md がないためスキップしました`);
      }
    }
  }
  return reports;
}

// レポートフォルダ内から画像・配布ファイルを推測する
function detectAssets(report) {
  const assets = { image: null, file: null };
  if (report.baseDir === REPORTS_DIR) return assets;
  for (const f of fs.readdirSync(report.baseDir)) {
    const ext = path.extname(f).toLowerCase();
    const full = path.join(report.baseDir, f);
    if (!fs.statSync(full).isFile()) continue;
    if (IMAGE_EXTS.includes(ext) && !assets.image) assets.image = full;
    else if (!f.toLowerCase().endsWith('.md') && !IMAGE_EXTS.includes(ext) && !assets.file) assets.file = full;
  }
  return assets;
}

// ---------- 変換本体 ----------
function ingest(report, manifest) {
  const raw = fs.readFileSync(report.mdPath, 'utf8');
  const { data, body } = parseFrontmatter(raw);

  if (!data.name) {
    throw new Error(`name がありません(${path.relative(ROOT, report.mdPath)})。_TEMPLATE.md を参照してください`);
  }

  const rawCategory = CATEGORY_ALIASES[data.category] ?? String(data.category ?? '').toLowerCase();
  const isDownload = data.kind === 'download' || Boolean(data.file) || rawCategory === 'sounds';
  const kind = isDownload ? 'download' : 'work';
  const categories = isDownload ? DOWNLOAD_CATEGORIES : WORK_CATEGORIES;
  const category = categories.includes(rawCategory) ? rawCategory : 'other';
  const date = /^\d{4}-\d{1,2}/.test(String(data.date)) ? String(data.date).slice(0, 7) : todayMonth();

  const targetDir = isDownload ? DOWNLOADS_DIR : WORKS_DIR;
  const { id, file: targetPath } = uniqueTargetPath(targetDir, slugify(data.id || report.name));

  // ---- 画像 ----
  const assets = detectAssets(report);
  let image = '';
  const imageRef = typeof data.image === 'string' ? data.image : '';
  if (imageRef.startsWith('/')) {
    image = imageRef; // すでに public/ 配下を指している
  } else {
    const src = imageRef
      ? path.resolve(path.dirname(report.mdPath), imageRef)
      : assets.image;
    if (src && fs.existsSync(src)) {
      const ext = path.extname(src).toLowerCase();
      image = `/images/projects/${id}${ext}`;
      copyFile(src, path.join(ROOT, 'public', 'images', 'projects', `${id}${ext}`));
    }
  }

  // ---- 配布ファイル(ダウンロードのみ)----
  let fileField = '';
  let size = data.size || '';
  if (isDownload) {
    const fileRef = typeof data.file === 'string' ? data.file : '';
    if (fileRef.startsWith('/')) {
      fileField = fileRef;
      const existing = path.join(ROOT, 'public', fileRef.replace(/^\//, ''));
      if (!size && fs.existsSync(existing)) size = humanSize(fs.statSync(existing).size);
    } else {
      const src = fileRef
        ? path.resolve(path.dirname(report.mdPath), fileRef)
        : assets.file;
      if (src && fs.existsSync(src)) {
        const base = path.basename(src);
        fileField = `/downloads/${base}`;
        if (!size) size = humanSize(fs.statSync(src).size);
        copyFile(src, path.join(FILES_DIR, base));
      }
    }
  }

  // ---- 出力 md を組み立てる ----
  const fm = [`name: ${data.name}`, `category: ${category}`, `date: ${date}`];
  const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [];
  if (isDownload) {
    if (size) fm.push(`size: ${size}`);
    if (data.length) fm.push(`length: ${data.length}`);
    if (data.platform) fm.push(`platform: ${data.platform}`);
    if (tags.length) fm.push(`tags: [${tags.join(', ')}]`);
    if (fileField) fm.push(`file: ${fileField}`);
    if (image) fm.push(`image: ${image}`);
    if (data.note) fm.push(`note: ${data.note}`);
  } else {
    if (tags.length) fm.push(`tags: [${tags.join(', ')}]`);
    if (image) fm.push(`image: ${image}`);
    if (data.url) fm.push(`url: ${data.url}`);
    if (data.github) fm.push(`github: ${data.github}`);
    if (data.featured === true) fm.push('featured: true');
    if (data.summary) fm.push(`summary: ${data.summary}`);
  }

  let outBody = normalizeHeadings(body.trim());
  if (!isDownload && !outBody) {
    outBody = `## 概要\n\n${data.summary || data.name}`;
  }
  const content = `---\n${fm.join('\n')}\n---\n\n${outBody}\n`;
  writeFile(targetPath, content);

  // ---- レポートを archive へ移動 ----
  const stamp = new Date().toISOString().slice(0, 10);
  const archiveTarget = path.join(ARCHIVE_DIR, `${stamp}-${id}${report.baseDir === REPORTS_DIR ? '.md' : ''}`);
  if (DRY_RUN) {
    log(`  [dry] move ${path.relative(ROOT, report.moveTarget)} -> ${path.relative(ROOT, archiveTarget)}`);
  } else {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    fs.renameSync(report.moveTarget, archiveTarget);
  }

  manifest.push({
    id,
    kind,
    category,
    report: report.name,
    contentFile: path.relative(ROOT, targetPath),
    ingestedAt: new Date().toISOString(),
  });

  log(`+ ${kind}: ${data.name} → ${path.relative(ROOT, targetPath)}${image ? `(画像: ${image})` : ''}`);
  return { id, kind };
}

// ---------- main ----------
function main() {
  const reports = findReports();
  if (reports.length === 0) {
    log('新しいレポートはありません(reports/ に md を置いてください)');
    return;
  }

  log(`${reports.length} 件のレポートを検出${DRY_RUN ? '(dry-run)' : ''}:`);
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : [];
  let ok = 0;
  let failed = 0;

  for (const report of reports) {
    try {
      ingest(report, manifest);
      ok++;
    } catch (err) {
      failed++;
      console.error(`! 変換失敗: ${report.name} — ${err.message}`);
    }
  }

  if (!DRY_RUN && ok > 0) {
    fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  log(`\n完了: 追加 ${ok} 件 / 失敗 ${failed} 件`);
  if (ok > 0 && !DRY_RUN) {
    log('次にやること: npm run build で確認 → コミット & push で公開されます');
  }
  if (failed > 0) process.exitCode = 1;
}

main();
