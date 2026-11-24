#!/usr/bin/env node
// ============================================================
// 編集モードの下書きを本物へ反映する(公開の手順で Claude が使う。docs/editor.md)。
//
//   npm run editor:apply -- --dry-run   差分・衝突・メモを表示するだけ(衝突があれば終了コード 2)
//   npm run editor:apply                反映して、下書きとメモを .editor/history/<日時>/ へ移す
//
// 下書きを作り始めた後に本物が更新されていたら(衝突)、何も反映せずに止まる。
// 差し替えで使われなくなった画像は候補として表示するだけで、消さない。
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseFrontmatter } from '../src/lib/markdown-parse.js';
import { sha256 } from './editor/drafts.mjs';
import { fileKind } from '../src/editor/patch.js';
import { SKILL_TREE_FILE, validateSkillTree } from '../src/lib/skill-tree-model.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const paths = (root) => {
  const dir = path.join(root, '.editor');
  return {
    dir,
    drafts: path.join(dir, 'drafts'),
    manifest: path.join(dir, 'manifest.json'),
    notes: path.join(dir, 'notes.md'),
  };
};

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full, base) : [path.relative(base, full).split(path.sep).join('/')];
    })
    .sort();
}

export function lineDiff(before, after) {
  const a = before.split('\n');
  const b = after.split('\n');
  const lcs = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push(`- ${a[i++]}`);
    } else {
      out.push(`+ ${b[j++]}`);
    }
  }
  while (i < a.length) out.push(`- ${a[i++]}`);
  while (j < b.length) out.push(`+ ${b[j++]}`);
  return out;
}

function readManifest(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

export function planApply(root = ROOT) {
  const p = paths(root);
  const manifest = readManifest(p.manifest);
  const items = walk(p.drafts)
    .filter((rel) => fileKind(rel) !== null || /^public\/images\/projects\/[a-z0-9][a-z0-9-]*\.(png|jpg)$/.test(rel))
    .map((rel) => {
    const draft = fs.readFileSync(path.join(p.drafts, rel));
    const target = path.join(root, rel);
    if (rel.startsWith('public/images/projects/')) {
      return fs.existsSync(target)
        ? { rel, kind: 'image', status: 'conflict', reason: '同じ名前の画像がすでにあります' }
        : { rel, kind: 'image', status: 'new' };
    }
    if (!fs.existsSync(target)) return { rel, kind: 'text', status: 'conflict', reason: '元のファイルがなくなっています' };
    const original = fs.readFileSync(target);
    if (original.equals(draft)) return { rel, kind: 'text', status: 'same' };
    const diff = lineDiff(original.toString('utf8'), draft.toString('utf8'));
    return manifest[rel]?.base === sha256(original)
      ? { rel, kind: 'text', status: 'changed', diff }
      : { rel, kind: 'text', status: 'conflict', diff, reason: '下書きを作り始めた後に、元のファイルが更新されています' };
  });
  const notes = fs.existsSync(p.notes) ? fs.readFileSync(p.notes, 'utf8') : '';
  return { items, conflicts: items.filter((item) => item.status === 'conflict'), notes };
}

// src/ のどこかでその画像のパスが使われているか
function isReferenced(root, image) {
  return walk(path.join(root, 'src')).some((rel) => fs.readFileSync(path.join(root, 'src', rel), 'utf8').includes(image));
}

const stamp = (d) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-` +
  `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;

export function applyDrafts(root = ROOT, { now = new Date() } = {}) {
  const p = paths(root);
  const plan = planApply(root);
  if (plan.conflicts.length) {
    throw new Error(`衝突があるため反映しませんでした: ${plan.conflicts.map((item) => item.rel).join(', ')}`);
  }
  if (!plan.items.length) return { applied: [], historyDir: null, unusedImages: [] };

  if (plan.items.some((item) => item.rel === SKILL_TREE_FILE)) {
    const icons = JSON.parse(fs.readFileSync(path.join(root, 'src/content/skill-icons.json'), 'utf8'));
    validateSkillTree(JSON.parse(fs.readFileSync(path.join(p.drafts, SKILL_TREE_FILE), 'utf8')), Object.keys(icons));
  }

  const applied = [];
  const replacedImages = [];
  for (const item of plan.items) {
    if (item.status === 'same') continue;
    const source = path.join(p.drafts, item.rel);
    const target = path.join(root, item.rel);
    if (item.rel.endsWith('.md')) {
      const before = parseFrontmatter(fs.readFileSync(target, 'utf8')).data.image;
      const after = parseFrontmatter(fs.readFileSync(source, 'utf8')).data.image;
      if (before && before !== after) replacedImages.push(before);
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    applied.push(item.rel);
  }

  const historyDir = path.join(p.dir, 'history', stamp(now));
  fs.mkdirSync(historyDir, { recursive: true });
  fs.renameSync(p.drafts, path.join(historyDir, 'drafts'));
  if (fs.existsSync(p.manifest)) fs.renameSync(p.manifest, path.join(historyDir, 'manifest.json'));
  if (fs.existsSync(p.notes)) {
    fs.copyFileSync(p.notes, path.join(historyDir, 'notes.md'));
    fs.writeFileSync(p.notes, '');
  }
  fs.writeFileSync(p.manifest, '{}\n');

  const unusedImages = replacedImages.filter((image) => !isReferenced(root, image));
  return { applied, historyDir, unusedImages };
}

function printPlan(plan) {
  if (!plan.items.length) {
    console.log('下書きはありません。');
    return;
  }
  for (const item of plan.items) {
    const label = { changed: '変更', new: '新しい画像', same: '変更なし', conflict: '衝突' }[item.status];
    console.log(`\n[${label}] ${item.rel}${item.reason ? `(${item.reason})` : ''}`);
    for (const line of item.diff ?? []) console.log(`    ${line}`);
  }
  console.log(plan.notes.trim() ? `\n[Claudeへのメモ]\n${plan.notes.trim()}` : '\n[Claudeへのメモ] なし');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const plan = planApply();
  printPlan(plan);
  if (process.argv.includes('--dry-run')) {
    process.exit(plan.conflicts.length ? 2 : 0);
  }
  try {
    const result = applyDrafts();
    console.log(`\n反映しました(${result.applied.length}件)。下書きの控え: ${result.historyDir ? path.relative(ROOT, result.historyDir) : 'なし'}`);
    if (result.unusedImages.length) {
      console.log('使われなくなった画像(削除はしていません):');
      for (const image of result.unusedImages) console.log(`  public${image}`);
    }
  } catch (err) {
    console.error(`\n${err.message}`);
    process.exit(2);
  }
}
