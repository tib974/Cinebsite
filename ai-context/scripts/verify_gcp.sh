#!/usr/bin/env bash
set -euo pipefail
if [ -f "$HOME/.gemini/.env" ]; then cat "$HOME/.gemini/.env"; else echo "No ~/.gemini/.env"; fi
