#!/usr/bin/env bash
# macOS: double-cliquez pour lancer le serveur local et ouvrir l’admin
DIR="$(cd "$(dirname "$0")" && pwd)"
"$DIR/scripts/start-local.sh" "$@"

