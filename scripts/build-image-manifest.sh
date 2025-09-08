#!/usr/bin/env bash
set -euo pipefail

# Build a JSON manifest mapping original image path -> best available optimized variant
# Preference order: -nobg.avif, -nobg.webp, -nobg.png, .avif, .webp, original

ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

OUT="data/image_manifest.json"
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

printf '{\n' > "$TMP"
first=1

scan_dir() {
  local d="$1"
  [ -d "$d" ] || return 0
  while IFS= read -r -d '' img; do
    rel=${img#"$ROOT_DIR/"}
    base="${rel%.*}"
    # Choose best single
    cand=("$base-nobg.avif" "$base-nobg.webp" "$base-nobg.png" "$base.avif" "$base.webp" "$rel")
    best=""; for c in "${cand[@]}"; do [ -f "$c" ] && { best="$c"; break; }; done
    [ -z "$best" ] && continue
    # Collect sizes
    sizes_avif=""; sizes_webp=""
    for w in 320 640 960 1280; do
      for suf in "-nobg-w${w}.avif" "-w${w}.avif"; do [ -f "${base}${suf}" ] && sizes_avif+="${base}${suf} ${w}w," && break; done
      for suf in "-nobg-w${w}.webp" "-w${w}.webp"; do [ -f "${base}${suf}" ] && sizes_webp+="${base}${suf} ${w}w," && break; done
    done
    # Trim trailing comma
    sizes_avif=${sizes_avif%,}; sizes_webp=${sizes_webp%,}
    # Write structured entry
    if [ $first -eq 0 ]; then printf ',\n' >> "$TMP"; fi
    first=0
    printf '  %s: {"best": %s' \
      "$(printf '"%s"' "$rel" | sed 's/\\/\\\\/g; s/\"/\\\"/g')" \
      "$(printf '"%s"' "$best" | sed 's/\\/\\\\/g; s/\"/\\\"/g')" \
      >> "$TMP"
    if [ -n "$sizes_avif" ] || [ -n "$sizes_webp" ]; then
      printf ', "sizes": {' >> "$TMP"
      if [ -n "$sizes_avif" ]; then printf '"avif": %s' "$(printf '"%s"' "$sizes_avif" | sed 's/\\/\\\\/g; s/\"/\\\"/g')" >> "$TMP"; fi
      if [ -n "$sizes_webp" ]; then [ -n "$sizes_avif" ] && printf ', ' >> "$TMP"; printf '"webp": %s' "$(printf '"%s"' "$sizes_webp" | sed 's/\\/\\\\/g; s/\"/\\\"/g')" >> "$TMP"; fi
      printf '}' >> "$TMP"
    fi
    printf '}' >> "$TMP"
  done < <(find "$d" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.avif' \) -print0)
}

scan_dir assets/products
scan_dir assets/realisations
scan_dir assets/uploads

printf '\n}\n' >> "$TMP"
mkdir -p data
mv "$TMP" "$OUT"
echo "Built $OUT"
