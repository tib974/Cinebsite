#!/usr/bin/env bash
set -euo pipefail
AI_DIR="/Users/thibautapv/Desktop/ai-context"
PROJECT="/Users/thibautapv/Desktop/Cinebsite"
mkdir -p "$PROJECT/_ai/prompts" "$PROJECT/_ai/docs"
rsync -av --delete "$AI_DIR/prompts/" "$PROJECT/_ai/prompts/"
rsync -av "$AI_DIR/docs/" "$PROJECT/_ai/docs/"
cp -f "$AI_DIR/STATE.yaml" "$PROJECT/_ai/STATE.yaml"
echo Done.
