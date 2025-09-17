#!/usr/bin/env bash
# macOS : double-cliquez pour lancer le build et la mise en ligne InfinityFree
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
npm run deploy:oneclick
echo "\nAppuyez sur Entrée pour fermer…"
read -r _
