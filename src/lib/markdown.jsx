import { Fragment } from 'react';

// 表示用の部品だけを持つ。パーサーは React に依存しない markdown-parse.js にあり、
// Node(テスト・編集モードの保存窓口)からも使えるようにしている。
export { parseFrontmatter, parseSections, parseLead } from './markdown-parse.js';

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
