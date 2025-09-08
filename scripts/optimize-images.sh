#!/usr/bin/env bash
set -euo pipefail

# Simple image optimizer: creates .webp and .avif next to JPG/PNG images.
# Requirements (recommended): cwebp (webp), avifenc (libavif) — install:
#   macOS:   brew install webp libavif
#   Debian:  apt-get install webp libavif-bin

DIRS=("assets/products" "assets/realisations" "assets/uploads")
QUALITY_WEBP=${QUALITY_WEBP:-82}
QUALITY_AVIF=${QUALITY_AVIF:-50}

have() { command -v "$1" >/dev/null 2>&1; }

echo "➡︎ Optimizing images in: ${DIRS[*]}"
if ! have cwebp; then echo "⚠︎ cwebp not found; skipping WebP (brew install webp)"; fi
if ! have avifenc; then echo "⚠︎ avifenc not found; skipping AVIF (brew install libavif)"; fi

shopt -s nullglob
for d in "${DIRS[@]}"; do
  [ -d "$d" ] || continue
  while IFS= read -r -d '' img; do
    base="${img%.*}"
    # ext unused (POSIX compatible; avoid bash 4-specific lowercase expansion)
    ext="${img##*.}"
    # WebP
    if have cwebp; then
      if [ ! -f "$base.webp" ]; then
        echo "→ webp $img -> $base.webp"
        cwebp -q "$QUALITY_WEBP" "$img" -o "$base.webp" >/dev/null 2>&1 || echo "  webp failed for $img"
      fi
    fi
    # AVIF
    if have avifenc; then
      if [ ! -f "$base.avif" ]; then
        echo "→ avif $img -> $base.avif"
        avifenc --min 20 --max "$QUALITY_AVIF" --jobs 4 "$img" "$base.avif" >/dev/null 2>&1 || echo "  avif failed for $img"
      fi
    fi
  done < <(find "$d" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)
done

# Lossless PNG optimization pass (optional tools)
if command -v oxipng >/dev/null 2>&1; then
  echo "➡︎ Optimizing PNGs losslessly with oxipng"
  find assets -type f -iname '*.png' -print0 | xargs -0 -I{} -n1 sh -c 'oxipng -o 4 --strip all -q "$1" || true' -- {}
elif command -v optipng >/dev/null 2>&1; then
  echo "➡︎ Optimizing PNGs losslessly with optipng"
  find assets -type f -iname '*.png' -print0 | xargs -0 -I{} -n1 sh -c 'optipng -o2 -quiet "$1" || true' -- {}
fi

echo "✅ Done."
