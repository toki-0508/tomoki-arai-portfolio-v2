# tomoki-arai-portfolio-v2

新井智己（Tomoki Arai）のポートフォリオサイトです。React + Vite で作り、Vercel で公開しています。

- 公開URL: **https://tomoki-arai.vercel.app/**
- テーマ: **身の回りを、ちょっと好きになる。**

> 旧ポートフォリオ（[toki-0508/tomoki-arai-portfolio](https://github.com/toki-0508/tomoki-arai-portfolio)）は 2026年10月にこのリポジトリへ統合し、アーカイブしました。

---

## コンセプト

日常の小さな不便や退屈を、Web・アプリ・3Dで「使って便利、触って楽しい」ものに変える。その姿勢を、説明ではなくサイトを触る体験として伝えることを目指しています。

想定している読み手は、制作を任せるかどうかを判断する方（採用担当者・クライアント）です。「何を作れる人か」「どう考えて作る人か」を短時間でつかめることを優先しています。

### デザイン

「紙とインク」がコンセプトです。わずかに青みのある紙の白に、ボールペンのインクの青をアクセントとして使います。ボタンやリンクに加えて、トップページの手書きの注釈（見出しの「好き」の下線、自作の3Dモデルに添えたメモ）も同じインクで描いています。

| 役割 | 書体 |
|------|------|
| 見出し・本文 | Zen Kaku Gothic New |
| 日付・技術名などのデータ | DM Mono |
| 手書きの注釈（トップとプロフィールのみ） | Klee One |

色はすべて [src/styles/tokens.css](src/styles/tokens.css) の CSS 変数で管理しています（ライト / ダーク）。

---

## しくみ

### コンテンツは Markdown

作品とダウンロードは **1件 = 1つの Markdown ファイル** です。ファイルを置くだけでサイトに反映されます。

```
src/content/
├── works/        # 作品（frontmatter + 「## 見出し」のセクション）
├── downloads/    # ダウンロード
└── site.js       # プロフィール・スキル・キャッチコピーなどの固定情報
```

プロフィールのスキル欄は、作品・ダウンロードの `tags` から「実際に使っている技術」を自動で判定して表示します。

### レポートを置くだけで作品が増える

`reports/` に制作レポートを置くと、毎日の定期実行が検出し、変換 → ビルド確認 → コミット → push まで行います。push すると Vercel が自動でデプロイします。

- 書き方と表記ルール: [reports/README.md](reports/README.md)、[reports/_TEMPLATE.md](reports/_TEMPLATE.md)
- 変換スクリプト: [scripts/ingest-reports.mjs](scripts/ingest-reports.mjs)（`npm run ingest`、`--dry-run` 対応）
- `reports/` の原稿は git 管理外で、公開リポジトリには含まれません

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
npm run build    # 本番ビルド
npm run preview  # ビルド結果の確認
npm run ingest   # reports/ のレポートを取り込む（--dry-run 可）
npm run check:files  # 配布ファイルと画像の安全チェック（build 前にも自動実行）
```

---

## AI の使用について

制作には生成AI（Claude）を利用しています。

- **利用した箇所**: React コンポーネントや CSS の実装、レポート取り込みスクリプト、問い合わせ API、公開設定、文章の表記ゆれの統一、コードレビュー
- **利用しなかった箇所**: コンセプトの立案、掲載する作品の選定と評価、3Dモデルと楽曲の制作
- **確認**: 生成されたコードは内容を理解したうえで採用し、実際のブラウザで動作を確認しています
