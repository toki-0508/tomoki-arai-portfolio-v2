import { Fragment } from 'react';

// ============================================================
// 軽量 Markdown レイヤー
//
// 作品・ダウンロードのコンテンツは src/content/**/*.md に
// 「frontmatter + 見出しセクション」の形で置く。
// 依存を増やさないため、必要な範囲だけ自前でパースする。
//
// サポートする frontmatter:
//   key: value            → 文字列 / 数値 / 真偽値
//   key: [a, b, c]        → 配列
//   key:
//     - a
//     - b                 → 配列(ブロック形式)
//   行末の「 # コメント」は無視する
//
// サポートする本文:
//   ## 見出し             → セクション区切り
//   - 項目                → リスト
//   空行区切り            → 段落
//   **強調** / `code` / [text](url) → インライン装飾
// ============================================================

function parseScalar(value) {
  let v = String(value).trim();
  const quoted = /^(["'])(.*)\1$/.exec(v);
  if (quoted) return quoted[2];
  v = v.replace(/\s+#.*$/, '').trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}

export function parseFrontmatter(raw) {
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
    if (value === '') {
      data[currentKey] = data[currentKey] ?? '';
    } else if (value.startsWith('[') && value.endsWith(']')) {
      data[currentKey] = value
        .slice(1, -1)
        .split(',')
        .map(parseScalar)
        .filter((item) => item !== '');
    } else {
      data[currentKey] = parseScalar(value);
    }
  }
  return { data, body: raw.slice(match[0].length) };
}

function parseBlocks(lines) {
  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'p', text: paragraph.join(' ') });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const line of lines) {
    const item = /^\s*-\s+(.*)$/.exec(line);
    if (item) {
      flushParagraph();
      if (!list) list = { type: 'list', items: [] };
      list.items.push(item[1].trim());
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  return blocks;
}

export function parseSections(body) {
  const sections = [];
  let current = null;
  for (const line of body.split(/\r?\n/)) {
    const heading = /^##\s+(.*)$/.exec(line);
    if (heading) {
      current = { title: heading[1].trim(), lines: [] };
      sections.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }
  return sections.map(({ title, lines }) => ({ title, blocks: parseBlocks(lines) }));
}

// セクション見出しより前にある本文(リード文)を段落として取り出す
export function parseLead(body) {
  const lines = [];
  for (const line of body.split(/\r?\n/)) {
    if (/^##\s+/.test(line)) break;
    lines.push(line);
  }
  return parseBlocks(lines);
}

// インライン装飾を外した文字列(リンクの中に置くなど、装飾を使えない場所向け)
export const plainText = (text) =>
  String(text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

// ---------- インライン装飾 → React ----------
const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

export function RichText({ text }) {
  const parts = String(text).split(INLINE_PATTERN);
  return (
    <Fragment>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i}>{part.slice(1, -1)}</code>;
        }
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) {
          return (
            <a key={i} href={link[2]} target="_blank" rel="noreferrer">
              {link[1]}
            </a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </Fragment>
  );
}

export function BlockList({ blocks }) {
  return (
    <Fragment>
      {blocks.map((block, i) =>
        block.type === 'list' ? (
          <ul key={i} className="md-list">
            {block.items.map((item, j) => (
              <li key={j}><RichText text={item} /></li>
            ))}
          </ul>
        ) : (
          <p key={i}><RichText text={block.text} /></p>
        ),
      )}
    </Fragment>
  );
}
