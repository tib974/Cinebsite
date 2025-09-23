#!/usr/bin/env bash
set -euo pipefail

if [ ! -f "package.json" ]; then
  echo "💥 Ce script doit être exécuté depuis la racine du projet (CinebsiteCDXL)." >&2
  exit 1
fi

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$HOME/.nvm/nvm.sh"
  nvm use --lts >/dev/null 2>&1 || true
fi

# Nettoyage des fichiers systèmes macOS
find . -name '.DS_Store' -print -delete || true

# Assure que dist/ et studio/dist ne sont plus suivis par git
if git ls-files --error-unmatch dist >/dev/null 2>&1; then
  git rm -r --cached dist
fi

if git ls-files --error-unmatch studio/dist >/dev/null 2>&1; then
  git rm -r --cached studio/dist
fi

npm install
npm run build

if git status --short | grep -q '^'; then
  git add -A
  git status --short
  git commit -m "Mise à jour vitrine CinéB"
  git push
  echo "✅ Déploiement Vercel déclenché."
else
  echo "ℹ️ Aucun changement à committer."
fi
