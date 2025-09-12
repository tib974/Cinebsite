#!/usr/bin/env bash
set -euo pipefail
[ -f .env ] && set -a && source .env && set +a
TARGET="${DEPLOY_TARGET:-local}"
case "$TARGET" in
  local) echo "Local mode – nothing to upload." ;;
  github) exec bash ./deploy_github_pages.sh ;;
  sftp) exec bash ./deploy_sftp.sh ;;
  ftp) exec bash ./deploy_ftp.sh ;;
  *) echo "Unknown DEPLOY_TARGET: $TARGET" ; exit 1 ;;
esac
