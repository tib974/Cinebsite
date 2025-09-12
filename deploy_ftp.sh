#!/usr/bin/env bash
set -euo pipefail
[ -f .env ] && set -a && source .env && set +a
: "${FTP_HOST:?FTP_HOST required}"
: "${FTP_USER:?FTP_USER required}"
: "${FTP_PATH:?FTP_PATH required}"
PORT="${FTP_PORT:-21}"
if command -v lftp >/dev/null 2>&1; then
  lftp -u "$FTP_USER","${FTP_PASSWORD:-}" -p "$PORT" "$FTP_HOST" <<LFTP
set ftp:ssl-allow true
set ftp:passive-mode true
mkdir -p "$FTP_PATH"
mirror -R --exclude-glob .git* --exclude .env ./ "$FTP_PATH"
bye
LFTP
else
  echo "lftp not installed. Install with: brew install lftp"
  exit 1
fi
