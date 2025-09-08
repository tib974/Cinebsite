#!/usr/bin/env bash
# macOS: double-cliquez pour partager votre site local via localhost.run
DIR="$(cd "$(dirname "$0")" && pwd)"
"$DIR/scripts/share-local.sh" 8000

