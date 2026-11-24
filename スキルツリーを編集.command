#!/bin/zsh
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v npm > /dev/null; then
  echo "Node.js を入れてから、もう一度開いてください。"
  read -k 1 "?何かキーを押すと閉じます"
  exit 1
fi
if [ ! -d node_modules ]; then
  npm ci || exit 1
fi
npm run edit:skills
