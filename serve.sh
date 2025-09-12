#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-8080}"
echo "Local server: http://localhost:${PORT} (Ctrl+C to stop)"
python3 -m http.server "${PORT}"
