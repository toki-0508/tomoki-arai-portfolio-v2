// ============================================================
// サイト全体で使うプロフィール・固定コンテンツ
// 中身は site.json にある(編集モードから書き換えられるようにするため)。
// 作品・ダウンロードは works/ downloads/ の md で管理する。
//
// 表記ルール(全ページ共通。reports/README.md にも同じものを載せている)
//   - 文体は「です・ます」。見出しのみ体言止め
//   - 約物は全角(、。！？「」（）)、英数字は半角。和欧間にスペースは入れない
//   - 技術名は公式表記(JavaScript / Three.js / Firebase / GarageBand など)
//   - 「作る」は漢字、「もの」はひらがな
//   - キャッチコピーは PROFILE.tagline の1つだけ。ほかの言い回しを増やさない
//
// 各項目の決まりごと(JSON にはコメントを書けないのでここに残す)
//   PROFILE.fieldsEn : トップの小見出しなど英語で並べる場所用。fields と同じ順番にする
//   NAV_LINKS        : ナビは英語(label)、ページ内の見出しは日本語(title)。
//                      title はページの h1 とブラウザタブのタイトルに使う
//   INTERESTS        : Values を3つの行動に分けたもの。「どう考えて作るか」を短く伝える
//   SKILL_GROUPS     : 作品・ダウンロードの tags に含まれる技術は「作品で使用」と表示される
//                      (判定は loader.js の usageOf。名前は tags と同じ表記で書くこと)
//   NOW_UPDATED      : 「いま」の内容は古くなりやすいので、いつ時点の情報かを必ず表示する
// ============================================================
import SITE from './site.json';

export { SITE };
export const { PROFILE, NAV_LINKS, MVV, INTERESTS, SKILL_GROUPS, HISTORY, NOW_UPDATED, NOW } = SITE;
