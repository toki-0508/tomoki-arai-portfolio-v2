# tomoki-arai-portfolio

新井智己のポートフォリオサイト。React + Vite で構築し、**本番を Vercel**、**サブ公開を GitHub Pages**(GitHub Actions で自動デプロイ)の二系統で配信しています。

- 本番(メイン): https://tomoki-arai.vercel.app/
- サブ公開(GitHub Pages): https://toki-0508.github.io/tomoki-arai-portfolio/

---

## コンセプト

**テーマ:「身の回りを、ちょっと好きになる」**

日常の中にある小さな困りごとや退屈を、Web・アプリ・3D の力で「使いやすく、少しだけワクワクする形」に変えることを制作の軸にしています。このポートフォリオは、その姿勢を説明するのではなく、サイトを触る体験そのものとして伝えることを目的に設計しました。

**想定する対象**は、私に制作を任せるかどうかを判断する方(採用担当者・クライアント)です。「何を作れる人か」「どう考えて作る人か」を短時間で把握できることを最優先にしています。

---

## アーキテクチャの特徴

### 1. コンテンツはすべて Markdown

作品・公開データは **1作品 = 1つの Markdown ファイル** で管理します。コードを触らずにファイルを置くだけでサイトに反映されます。

```
src/content/
├── works/           # 作品(frontmatter + ## セクション)
│   ├── portfolio-site.md
│   └── ...
├── downloads/       # 公開データ
│   └── ...
└── site.js          # プロフィール・スキルなど固定情報
```

frontmatter(name / category / date / tags / image / url / summary / featured)と
本文の `## 見出し` セクションを、ビルド時に自前の軽量パーサで読み込みます
([src/lib/markdown.jsx](src/lib/markdown.jsx))。外部依存はありません。

### 2. レポートを置くだけの自動更新パイプライン

新しく作ったものは `reports/` にレポートを置くだけで、毎日の定期実行(Claude のスケジュールタスク)が検出し、変換 → ビルド確認 → コミット → push → デプロイまで自動で行います。

```
reports/xxx.md(または reports/xxx/ フォルダ)
   │  毎日の定期実行 or 手動で `npm run ingest`
   ▼
src/content/works/xxx.md + public/images/projects/xxx.png
   │  ビルド確認 → コミット → push
   ▼
Vercel / GitHub Pages に自動デプロイ
```

- 書き方: [reports/README.md](reports/README.md) と [reports/_TEMPLATE.md](reports/_TEMPLATE.md)
- 変換ロジック: [scripts/ingest-reports.mjs](scripts/ingest-reports.mjs)(`npm run ingest`、`--dry-run` 対応)
- 処理済みレポートは `reports/archive/` へ移動。`reports/` の原稿類は gitignore 済みで公開リポジトリには含まれません

### 3. ライト / ダークテーマ

OS 設定に追従しつつ、ナビのトグルで切替可能(localStorage に保存)。色はすべて
[src/styles/tokens.css](src/styles/tokens.css) の CSS 変数で管理し、3D ヒーローのライティングもテーマに連動します。

### 4. パフォーマンスと配慮

- Three.js は遅延読み込み(初期バンドルから分離)
- 3D は画面外で描画停止、`prefers-reduced-motion` で自動回転オフ
- スクロール出現アニメーションも reduced-motion を尊重
- スキップリンク・aria 属性・フォーカスリングなどアクセシビリティ対応

---

## 技術スタック

| 区分 | 内容 |
|------|------|
| フレームワーク | React 18 |
| ビルド | Vite 6 |
| 3D 表現 | Three.js(遅延読み込み) |
| コンテンツ | Markdown + 自前 frontmatter パーサ(依存なし) |
| ルーティング | ハッシュルーティング(自作・静的ホスティング互換) |
| 問い合わせ | Vercel Serverless Functions + Resend |
| ホスティング | Vercel(本番) / GitHub Pages(サブ・GitHub Actions 自動デプロイ) |
| 自動更新 | reports/ 監視の定期実行(Claude スケジュールタスク + `npm run ingest`) |

---

## ローカル開発

```bash
npm install
npm run dev      # 開発サーバー
npm run build    # 本番ビルド(Vercel 向け)
npm run preview  # ビルド結果の確認
npm run ingest   # reports/ のレポートを取り込み(--dry-run 可)
```

### GitHub Pages 向けビルド(通常は CI が実行)

```bash
GITHUB_PAGES=true VITE_CONTACT_API_BASE=https://tomoki-arai.vercel.app npm run build
```

| 環境変数 | 用途 | 未設定時 |
|----------|------|----------|
| `GITHUB_PAGES` | `true` で `base` をサブパスへ切替 | `/`(Vercel 用) |
| `VITE_CONTACT_API_BASE` | 問い合わせ API の向き先 | 空文字(同一オリジン) |

---

## デプロイ構成

```
push to main
   ├─ Vercel        → https://tomoki-arai.vercel.app/         (本番・メイン)
   └─ GitHub Actions → https://toki-0508.github.io/...        (サブ公開)
         .github/workflows/deploy.yml
```

Pages 版の問い合わせは Vercel の `/api/contact` へ転送されます(`api/contact.js` の
`ALLOWED_ORIGINS` で許可)。SEO 上の重複を避けるため、`index.html` の canonical は
本番である Vercel を指しています。

---

## AI の使用について

本サイトの制作では生成 AI(Claude)を以下の範囲で利用しました。

- **利用した箇所**: React コンポーネントの実装、CSS 設計、レポート取り込みスクリプト、
  問い合わせ API、GitHub Actions ワークフロー、コードレビューとリファクタリング。
- **利用しなかった箇所**: サイトのコンセプト立案、掲載する作品の選定と評価、
  3D モデルおよび楽曲の制作。
- **確認体制**: AI が生成したコードは内容を理解したうえで採用し、
  ローカルおよび実機ブラウザで動作確認を行っています。
