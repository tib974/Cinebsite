#!/usr/bin/env bash
set -euo pipefail
PROJECT="/Users/thibautapv/Desktop/Cinebsite"
BACKUP_DIR="$PROJECT/_backups"
STAMP=$(date +%Y%m%d-%H%M)

mkdir -p "$BACKUP_DIR"
cd "$PROJECT"

if [ ! -d .git ]; then
  git init
  git add -A
  git commit -m "Initial snapshot SAFE"
fi

git branch -M main || true
git checkout -B "backup/$STAMP" || true
zip -r "$BACKUP_DIR/backup-$STAMP.zip" . -x "*.git*"

echo "✅ Backup done → $BACKUP_DIR/backup-$STAMP.zip"
echo "Branch: backup/$STAMP"
