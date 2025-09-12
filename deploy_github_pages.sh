#!/usr/bin/env bash
set -euo pipefail
[ -d .git ] || git init
git add -A
git commit -m "Deploy $(date +%F-%T)" || true
git branch -M main || true
git push -u origin main || true
git subtree split --prefix . -b gh-pages || true
git push origin gh-pages:gh-pages -f
echo "Deployed to GitHub Pages."
