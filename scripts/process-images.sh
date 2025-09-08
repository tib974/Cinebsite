#!/usr/bin/env bash
set -euo pipefail

# Unified pipeline: remove background (if possible) then optimize (WebP/AVIF)
# Runs on: assets/products, assets/realisations, assets/uploads

ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

echo "▶︎ Step 1/2 — Remove backgrounds (when possible)"
bash scripts/remove-bg.sh || true

echo "▶︎ Step 2/3 — Optimize images (WebP/AVIF)"
bash scripts/optimize-images.sh

echo "▶︎ Step 3/3 — Generate responsive variants"
bash scripts/generate-responsive.sh || true

echo "▶︎ Build image manifest"
bash scripts/build-image-manifest.sh

echo "✅ All done. The site will auto‑utilize -nobg/AVIF/WebP variants via data/image_manifest.json."
