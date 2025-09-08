#!/usr/bin/env bash
set -euo pipefail

# Generate responsive sizes (320/640/960/1280) for WebP and AVIF
# Prefers -nobg.png as source if available, else original

DIRS=("assets/products" "assets/realisations" "assets/uploads")
WIDTHS=(320 640 960 1280)
QUALITY_WEBP=${QUALITY_WEBP:-82}
QUALITY_AVIF=${QUALITY_AVIF:-45}

have(){ command -v "$1" >/dev/null 2>&1; }

if ! have cwebp && ! have magick; then
  echo "⚠︎ Need 'cwebp' (or ImageMagick 'magick') for WebP generation" >&2
fi
if ! have avifenc && ! have magick; then
  echo "⚠︎ Need 'avifenc' (or ImageMagick 'magick' with AVIF support) for AVIF generation" >&2
fi

resize_png_tmp(){ # $1=src $2=width $3=outpng
  if have magick; then
    magick "$1" -resize "$2x" "$3"
    return $?
  fi
  return 1
}

for d in "${DIRS[@]}"; do
  [ -d "$d" ] || continue
  while IFS= read -r -d '' img; do
    rel="$img"
    base_noext="${rel%.*}"
    dirn="$(dirname "$rel")"
    name="$(basename "$rel")"
    ext="${rel##*.}"; ext_lc=$(printf '%s' "$ext" | tr 'A-Z' 'a-z')
    src="${base_noext}-nobg.png"
    [ -f "$src" ] || src="$rel"
    # Generate WebP sizes
    for w in "${WIDTHS[@]}"; do
      out_webp="${base_noext}-w${w}.webp"
      if [ ! -f "$out_webp" ]; then
        if have cwebp; then
          echo "→ webp ${name} ${w}w"
          cwebp -q "$QUALITY_WEBP" -resize "$w" 0 "$src" -o "$out_webp" >/dev/null 2>&1 || true
        elif have magick; then
          echo "→ webp (magick) ${name} ${w}w"
          magick "$src" -resize "${w}x" "$out_webp" >/dev/null 2>&1 || true
        fi
      fi
      out_avif="${base_noext}-w${w}.avif"
      if [ ! -f "$out_avif" ]; then
        if have avifenc; then
          tmp_png="${base_noext}.tmp-w${w}.png"
          if resize_png_tmp "$src" "$w" "$tmp_png"; then
            echo "→ avif ${name} ${w}w"
            avifenc --min 20 --max "$QUALITY_AVIF" --jobs 4 "$tmp_png" "$out_avif" >/dev/null 2>&1 || true
            rm -f "$tmp_png"
          elif have magick; then
            echo "→ avif (magick) ${name} ${w}w"
            magick "$src" -resize "${w}x" "$out_avif" >/dev/null 2>&1 || true
          fi
        elif have magick; then
          echo "→ avif (magick) ${name} ${w}w"
          magick "$src" -resize "${w}x" "$out_avif" >/dev/null 2>&1 || true
        fi
      fi
    done
  done < <(find "$d" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.avif' \) -print0)
done

echo "✅ Responsive variants done."

