#!/usr/bin/env bash
set -euo pipefail

# Background removal helper using rembg (U^2-Net).
# Processes images in assets/products, assets/realisations, assets/uploads.
# Input formats: jpg, jpeg, png, webp. Outputs PNG with transparency "*-nobg.png".

DIRS=("assets/products" "assets/realisations" "assets/uploads")

have() { command -v "$1" >/dev/null 2>&1; }

if ! have rembg; then
  cat <<'EOT'
⚠︎ L'outil "rembg" n'est pas installé.

Installation rapide (choisissez UNE option):
  Option A — macOS (Homebrew + Python):
    brew install python
    python3 -m pip install --upgrade pip
    python3 -m pip install rembg

  Option B — Debian/Ubuntu:
    sudo apt-get update && sudo apt-get install -y python3-pip
    pip3 install --upgrade pip
    pip3 install rembg

  Option C — Docker:
    docker pull danielgatis/rembg
    # Puis remplacez la commande "rembg" plus bas par:
    #   docker run --rm -v "$PWD:$PWD" -w "$PWD" danielgatis/rembg rembg

Relancez ensuite ce script:  bash scripts/remove-bg.sh
EOT
  exit 1
fi

shopt -s nullglob
count=0
for d in "${DIRS[@]}"; do
  [ -d "$d" ] || continue
  while IFS= read -r -d '' img; do
    base="${img%.*}"
    out="${base}-nobg.png"
    if [ -f "$out" ]; then
      echo "⏭  Skip (exists): $out"
      continue
    fi
    # Skip if image already has transparency (when ImageMagick is available)
    if command -v identify >/dev/null 2>&1; then
      channels=$(identify -format '%[channels]' "$img" 2>/dev/null || true)
      case "$channels" in *a*|*A*) echo "⏭  Skip (already transparent): $img"; continue;; esac
    fi
    echo "→ Removing background: $img -> $out"
    ext="${img##*.}"; ext_lc=$(printf '%s' "$ext" | tr 'A-Z' 'a-z')
    ok=0
    if rembg i "$img" "$out" >/dev/null 2>&1; then
      ok=1
    else
      # If WEBP input fails, try converting to PNG then retry (requires dwebp)
      if [ "$ext_lc" = "webp" ] && command -v dwebp >/dev/null 2>&1; then
        tmp_png="${base}.tmp-rembg.png"
        dwebp "$img" -o "$tmp_png" >/dev/null 2>&1 && rembg i "$tmp_png" "$out" >/dev/null 2>&1 && ok=1
        rm -f "$tmp_png"
      fi
    fi
    if [ $ok -eq 1 ] && [ -s "$out" ]; then
      count=$((count+1))
    else
      echo "  ⚠︎ rembg failed for $img"
      rm -f "$out"
    fi
  done < <(find "$d" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) -print0)
done

echo "✅ Terminé. Fichiers créés: $count"
