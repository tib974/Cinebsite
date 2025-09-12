#!/usr/bin/env bash
set -euo pipefail
[ -f .env ] && set -a && source .env && set +a
: "${SFTP_HOST:?SFTP_HOST required}"
: "${SFTP_USER:?SFTP_USER required}"
: "${SFTP_PATH:?SFTP_PATH required}"
PORT="${SFTP_PORT:-22}"
ssh -p "$PORT" "$SFTP_USER@$SFTP_HOST" "mkdir -p '$SFTP_PATH'" || true
scp -r -P "$PORT" * "$SFTP_USER@$SFTP_HOST:$SFTP_PATH"
echo "SFTP upload complete."
