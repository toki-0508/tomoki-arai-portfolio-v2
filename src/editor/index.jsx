// ============================================================
// 文章と画像を表示する小さな部品(本番用)。
// 本番では値をそのまま返すだけで、編集の仕組みは持たない。
// `npm run edit` のときだけ、Vite プラグインがこのファイルを
// src/editor/live/index.jsx(編集できる実装)に差し替える。
//
//   <C k="layout.skipLink" />                  copy.json の文言
//   <S path="PROFILE.tagline" />              site.json の値
//   <F item={work} field="summary" />         作品・ダウンロードの frontmatter の値
//   <SectionTitle item={work} section={0} />  本文の「## 見出し」
//   <Prose item={work} part="lead">…</Prose>  リード文・セクション本文(中身は children で描く)
//   <L item={work} field="steps">…</L>        箇条書きの frontmatter(steps)
//   <EditableImage item={work}>…</EditableImage>  作品・ダウンロードの画像
//   <EditorRoot route={route} />              編集バー(本番では何も描かない)
// ============================================================
import { t } from '../content/copy.js';
import { SITE } from '../content/site.js';
import { getPath } from './shared.js';

export function C({ k, vars }) {
  return t(k, vars);
}

export function S({ path, children }) {
  return children ?? getPath(SITE, path) ?? '';
}

export function F({ item, field, children }) {
  return children ?? item[field] ?? '';
}

export function SectionTitle({ item, section }) {
  return item.sections[section]?.title ?? '';
}

export function Prose({ children }) {
  return children ?? null;
}

export function L({ children }) {
  return children ?? null;
}

export function EditableImage({ children }) {
  return children ?? null;
}

export function EditorRoot() {
  return null;
}
