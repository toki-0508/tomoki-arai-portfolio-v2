#!/bin/zsh
# ダブルクリックで編集モードを開く(このMacの中だけで動く。使い方は docs/editor.md)。
# 閉じるときは、このウィンドウで Ctrl+C を押すか、ウィンドウを閉じる。
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v npm > /dev/null; then
  echo "npm が見つかりません。Node.js を入れてから、もう一度開いてください。"
  read -k 1 "?何かキーを押すと閉じます"
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "はじめての起動なので、必要なものを入れています…"
  npm install || exit 1
fi
npm run edit
