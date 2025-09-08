#!/usr/bin/env bash
set -euo pipefail

# Démarrage local du site CinéB
# Usage: ./scripts/start-local.sh [port]

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="127.0.0.1"
PORT="${1:-8000}"
URL="http://$HOST:$PORT"

have() { command -v "$1" >/dev/null 2>&1; }

if ! have php; then
  echo "❌ PHP introuvable. Installez-le (ex: brew install php) puis réessayez."
  exit 1
fi

# Vérifie si le port est occupé (macOS/Linux)
if have lsof; then
  if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "ℹ️  Le port $PORT est occupé. Utilisation du port $((PORT+1))."
    PORT=$((PORT+1))
    URL="http://$HOST:$PORT"
  fi
fi

echo "🚀 Démarrage du serveur sur $URL"
echo "📁 Racine: $DIR"

# Ouvre le navigateur après 1s
open_url() {
  local target="$1"
  if have open; then
    open "$target" || true
  elif have xdg-open; then
    xdg-open "$target" || true
  elif have powershell.exe; then
    powershell.exe -Command start "" "$target" || true
  fi
}

(
  sleep 1
  open_url "$URL/desk/login.php"
) &

cd "$DIR"
exec php -S "$HOST:$PORT" -t "$DIR"
