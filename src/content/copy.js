// ============================================================
// ページや部品に直書きしていた文言は copy.json にまとめている
// (編集モードから書き換えられるようにするため)。
//
// キーは「ページ.場所.項目」。共通部品は common.*、ナビ・フッター・タブのタイトルは layout.*。
// 文言にデータを差し込むときは {name} と書き、t(key, { name }) で渡す。
// 表記ルールは site.js の冒頭を参照。
// ============================================================
import COPY from './copy.json';

export { COPY };

export function t(key, vars) {
  const template = COPY[key];
  if (typeof template !== 'string') throw new Error(`copy.json に「${key}」がありません`);
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}
