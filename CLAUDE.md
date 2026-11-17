# このリポジトリで作業する Claude へ

- 本人に「保存したよ」「公開して」など、編集モードの下書きの公開を頼まれたら、[docs/editor.md](docs/editor.md) の「公開の手順(Claude 向け)」に従う。
- 表記ルールは `src/content/site.js` の冒頭と `reports/README.md`。
- main に push すると Vercel の本番に出る。push の前に `export GH_TOKEN="$(gh auth token --user toki-0508)"`。
- 毎日の定期実行(portfolio-report-ingest)がこのチェックアウトの main で commit する。複数の手順にまたがる作業は、別のブランチ(`.claude/worktrees/` の worktree)で進める。
