#!/usr/bin/env bash
set -euo pipefail

# Partage public temporaire via localhost.run (gratuit, sans inscription)
# Prérequis: serveur local lancé (start.command) et SSH disponible (macOS: ok)

PORT="${1:-8000}"
echo "🔗 Ouverture d'un lien public pour http://127.0.0.1:$PORT ..."
echo "(Appuyez sur Ctrl+C pour arrêter le partage)"
echo
ssh -R 80:127.0.0.1:$PORT nokey@localhost.run || ssh -R 80:127.0.0.1:$PORT ssh.localhost.run

