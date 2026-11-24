# tomoki-arai-portfolio-v2

新井智己（Tomoki Arai）のポートフォリオサイトです。React + Vite で作り、Vercel で公開しています。

- 公開URL: **https://tomoki-arai.vercel.app/**
- テーマ: **QOLを今よりちょっとプラスに**

> 現行版はこのリポジトリで管理しています。旧版のリポジトリとGitHub Pagesは終了しました。

---

## コンセプト

日常の小さな不便や退屈を、アプリ・3D・電子工作で「使って便利、触って楽しい」ものに変える。その姿勢を、説明ではなくサイトを触る体験として伝えることを目指しています。

想定している読み手は、制作を任せるかどうかを判断する方（採用担当者・クライアント）です。「何を作れる人か」「どう考えて作る人か」を短時間でつかめることを優先しています。

### デザイン

「紙とインク」がコンセプトです。操作には青を使い、トップとプロフィールの導入には緑がかった紙の色と共通のキャプションを使います。

| 役割 | 書体 |
|------|------|
| 見出し・本文 | Zen Kaku Gothic New |
| 日付・技術名などのデータ | DM Mono |

色はすべて [src/styles/tokens.css](src/styles/tokens.css) の CSS 変数で管理しています（ライト / ダーク）。

### Aboutのスキルツリー

`スキルツリーを編集.command` をダブルクリックするか、`npm run edit:skills` で配置エディターを開けます。既存の編集バーにも「スキルツリーを配置」があります。

ノードをドラッグし、右側で名前・X/Y座標・接続先・色・ロゴを変えられます。形は円・菱形・四角・六角形、大きさは44〜112pxを独立して指定でき、接続線も直線・折れ線・曲線と曲がり量を調整できます。追加・削除、Undo/Redo、20刻みのスナップ、JSONの書き出し・読み込みにも対応しています。フォームの変更は「変更を適用」、配置全体は「下書きを保存」で確定します。

接続は技術・制作上の関連を示す実線だけで、必須の依存関係や学習順ではありません。編集画面のノード一覧・ノード選択・接続先・ロゴ候補と、公開サイトのスキル一覧はA–Z順です（制作元は先頭、日本語名は英字名の後）。ツリー上の座標や形は並び替えで変わりません。経験の区分（制作・授業・間接利用など）とLv.1〜5の自己評価を別に持ち、未評価のレベルを自動で推測しません。形と大きさは習熟度とは独立した見た目の設定です。

唯一の元データは `src/content/skill-tree.json`、ロゴ一覧は `src/content/skill-icons.json` です。以前の `site.json` の `SKILL_GROUPS` と `skill-nodes.js` は統合しました。名前は作品のタグと同じ表記にすると使用実績がつきます。ロゴ追加時は `public/images/skills/` とロゴ一覧に追記します。

保存先は `.editor/drafts/src/content/skill-tree.json` で、公開サイトはすぐには変わりません。通常の `npm run editor:apply -- --dry-run` → 確認 → `npm run editor:apply` → テスト・ビルド → push の手順で公開します。配置エディターと保存APIは編集モード専用で、本番ビルドには入りません。詳しくは [編集モード](docs/editor.md) を参照してください。

通常表示はツリー全体、拡大画面は読みやすい倍率で始まり、ドラッグ・ホイール・ピンチ・キーボードで探索できます。分野名の箱やタブは表示せず、技術アイコン自体を分岐点に使います。経路は技術のつながりを視覚化したもので、必須の学習順序や習熟度を意味しません。選択時の件数は掲載作品・配布物のタグから集計します。

参考にしたのは本人指定の画像、[Path of Exile](https://www.pathofexile.com/passive-skill-tree) と [Last Epoch](https://lastepoch.com/skills/) の大小ノード・細い経路・選択時の強調です。ゲームの画像は転載していません。技術ロゴはローカル配信し、Devicon・Lobe Icons・Simple Iconsおよび公式配布元の出典を `public/images/skills/NOTICE.txt` に記載しています。nRF52840にはメーカーのNordic Semiconductorのロゴを使用しています。

### OG 画像の作り直し

SNS で共有したときに出る画像（`public/og-image.png`）は [scripts/og/og.html](scripts/og/og.html) から作っています。文言を変えたら、次のコマンドで書き出し直してください。

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --virtual-time-budget=5000 --window-size=1200,630 --screenshot="$PWD/public/og-image.png" "file://$PWD/scripts/og/og.html"
```

---

## しくみ

### コンテンツは Markdown

作品とダウンロードは **1件 = 1つの Markdown ファイル** です。ファイルを置くだけでサイトに反映されます。

```
src/content/
├── works/        # 作品（frontmatter + 「## 見出し」のセクション）
├── downloads/    # ダウンロード
├── site.json     # プロフィール・歩み・MVV など(site.js が読み込んで書き出す)
├── copy.json     # ページや部品の文言
└── site.js       # 表記ルールと、site.json の書き出し
```

スキルツリーの項目は `skill-tree.json` で管理し、作品・ダウンロードの `tags` と照合して使用実績へのリンクを表示します。本人申告の経験と、掲載作品から確認できる使用実績は区別しています。

作品の `featured: 1`、`featured: 2` のような番号で、トップのピックアップの順番を指定できます（既存の `featured: true` は番号指定の後ろ）。必要な作品だけ、`role`（担当）、`status`（現在地）、`outcome`（確認できた成果）を指定すると、詳細の冒頭に表示されます。`related: [作品ID, 作品ID]` はカテゴリをまたいだ関連作品の指定、`steps` は操作の流れの箇条書きに使えます。

作品・配布物ともに `priority` は小さい番号を先に表示します。指定のない項目は日付順で、Otherは一覧の後ろです。ゲームとイベントは `game`、音源の配布は `other` を指定します（試聴はファイル形式で判定します）。

作品に `download: mtools` のように配布物のIDを指定すると、作品詳細にも配布ボタン・対応環境・注意事項が表示されます。ZIPのパスや配布版の表記は `src/content/downloads/<ID>.md` にだけ書けば反映されます。

### レポートを置くだけで作品が増える

`reports/` に制作レポートを置くと、毎日の定期実行が検出し、変換 → ビルド確認 → コミット → push まで行います。push すると Vercel が自動でデプロイします。

レポートが無くても、定期実行は手元の開発フォルダと GitHub を見回り、載せる価値がある新しい作品を見つけたら、事実だけでレポートを書いて同じ流れで公開します。受託・事業・課題・非公開のものなど、迷うものは公開せずに確認を求めます。

- 書き方と表記ルール: [reports/README.md](reports/README.md)、[reports/_TEMPLATE.md](reports/_TEMPLATE.md)
- 変換スクリプト: [scripts/ingest-reports.mjs](scripts/ingest-reports.mjs)（`npm run ingest`、`--dry-run` 対応）
- `reports/` の原稿は git 管理外で、公開リポジトリには含まれません

### 文章と画像はブラウザで直せる(編集モード)

`npm run edit`(または `編集する.command` をダブルクリック)で、このMacの中だけで編集モードのサイトが開きます。文章をクリックして書き換えたり、画像を差し替えたりでき、内容は下書き(`.editor/`、Git 管理外)に保存されます。公開は Claude に頼むと、表記とレイアウトを整えてから行います。公開サイトには編集の仕組みは入りません。

- 使い方と公開の手順: [docs/editor.md](docs/editor.md)
- ページの文言は `src/content/copy.json`、プロフィール系は `src/content/site.json`

### 配布ファイルの安全チェック

`npm run build` の前に [scripts/check-public-files.mjs](scripts/check-public-files.mjs) が `public/downloads/` と `public/images/` を検査します。鍵・トークン・`.env`・キーストア・このPCのパス・写真の位置情報などが見つかるとビルドが止まり、公開されません（zip / jar / apk は展開して検査）。詳しくは [reports/README.md](reports/README.md#配布ファイルの安全チェック)。

---

## 公開構成

```
main に push
  └─ Vercel → https://tomoki-arai.vercel.app/   （本番。問い合わせ API も同じオリジン）

転送のみ
  └─ tomoki-arai-portfolio.vercel.app → 本番へ 308（vercel.json）
```

以前使っていた GitHub Pages（toki-0508.github.io/tomoki-arai-portfolio-v2/）は 2026年10月に停止しました。

- 問い合わせフォームは [api/contact.js](api/contact.js)（Vercel Functions + Resend）。Vercel の環境変数 `RESEND_API_KEY` が必要です
- canonical / OG / 構造化データ / sitemap.xml / robots.txt は、ビルド時に `SITE_URL` から生成されます（[vite.config.js](vite.config.js)）

| 環境変数 | 用途 | 未設定時 |
|----------|------|----------|
| `SITE_URL` | canonical などに使う公開URL | `https://tomoki-arai.vercel.app` |
| `NOINDEX` | `true` で検索エンジンに載せない（プレビュー用） | `false` |
| `GITHUB_PAGES_BASE` | サブパスで配信するときのベースパス | `/` |
| `VITE_CONTACT_API_BASE` | 問い合わせ API の向き先 | 同一オリジン |

---

## ローカル開発

```bash
npm install
npm run dev      # 開発サーバー
npm run edit     # 編集モード(文章・画像を下書きに保存)
npm run build    # 本番ビルド(配布ファイルの安全チェックと、編集機能の混入チェックつき)
npm run preview  # ビルド結果の確認
npm test         # 単体テスト
npm run snapshot -- output/snapshots/a.txt  # 全ページの表示テキストを書き出す(build の後)
npm run editor:apply -- --dry-run           # 下書きの差分を見る(公開の手順で使う)
npm run ingest   # reports/ のレポートを取り込む（--dry-run 可）
npm run check:files  # 配布ファイルと画像の安全チェック（build 前にも自動実行）
```

---

## AI の使用について

制作には生成AI（Claude）を利用しています。

- **利用した箇所**: React コンポーネントや CSS の実装、レポート取り込みスクリプト、問い合わせ API、公開設定、文章の表記ゆれの統一、コードレビュー
- **利用しなかった箇所**: コンセプトの立案、掲載する作品の選定と評価、3Dモデルと楽曲の制作
- **確認**: 生成されたコードは内容を理解したうえで採用し、実際のブラウザで動作を確認しています
