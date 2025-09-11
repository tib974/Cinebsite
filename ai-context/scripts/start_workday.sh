#!/usr/bin/env bash
set -euo pipefail
AI_DIR="/Users/thibautapv/Desktop/ai-context"
PROJECT="/Users/thibautapv/Desktop/Cinebsite"

open -a Zed "$PROJECT" || true
pbcopy < "$AI_DIR/prompts/gemini/01_site_audit_and_plan.txt"

if [ -t 1 ]; then
  cd "$PROJECT"
  echo "----------------------------------------------"
  echo "SAFE MODE: À l'invite 'gemini>', colle (Cmd+V) le prompt d'audit."
  echo "----------------------------------------------"
  g
else
  osascript <<'APPLESCRIPT'
tell application "Terminal"
  activate
  do script "cd '/Users/thibautapv/Desktop/Cinebsite'; clear; g"
end tell
APPLESCRIPT
fi
