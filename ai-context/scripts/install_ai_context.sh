#!/usr/bin/env bash
set -euo pipefail
AI_DIR="/Users/thibautapv/Desktop/ai-context"
PROJECT="/Users/thibautapv/Desktop/Cinebsite"

echo "==> Installing AI Context (SAFE) from: $AI_DIR"
[ -d "$AI_DIR" ] || { echo "ERROR: AI_DIR not found: $AI_DIR"; exit 1; }

mkdir -p "$PROJECT/_ai/prompts/gemini" "$PROJECT/_ai/docs"
cp -f "$AI_DIR/STATE.yaml" "$PROJECT/_ai/STATE.yaml"
cp -f "$AI_DIR/project/GEMINI.md" "$PROJECT/GEMINI.md" 2>/dev/null || true
cp -R "$AI_DIR/prompts/gemini" "$PROJECT/_ai/prompts/" 2>/dev/null || true
cp -R "$AI_DIR/docs" "$PROJECT/_ai/" 2>/dev/null || true
cp -f "$AI_DIR/README.md" "$PROJECT/_ai/README.AI-CONTEXT.md"

mkdir -p "$PROJECT/assets/img" "$PROJECT/assets/css" "$PROJECT/scripts" "$PROJECT/data"

if [ ! -f "$PROJECT/.gitignore" ]; then
  cat > "$PROJECT/.gitignore" <<'EOF'
node_modules/
.env
dist/
.DS_Store
EOF
fi

if [ ! -f "$PROJECT/.env.example" ]; then
  cat > "$PROJECT/.env.example" <<'EOF'
DEPLOY_TARGET=local
SFTP_HOST=ssh.example.host
SFTP_USER=username
SFTP_PORT=22
SFTP_PATH=/path/to/htdocs
FTP_HOST=ftpupload.net
FTP_USER=epiz_XXXXXXX
FTP_PASSWORD=
FTP_PORT=21
FTP_PATH=/htdocs
EOF
fi

if [ ! -f "$PROJECT/serve.sh" ]; then
  cat > "$PROJECT/serve.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-8080}"
echo "Local server: http://localhost:${PORT} (Ctrl+C to stop)"
python3 -m http.server "${PORT}"
EOF
  chmod +x "$PROJECT/serve.sh"
fi

touch "$PROJECT/NOTES_DE_SESSION.md"

ZSHRC="$HOME/.zshrc"
grep -q 'alias g="gemini"' "$ZSHRC" 2>/dev/null || echo 'alias g="gemini"' >> "$ZSHRC"

echo "✅ SAFE AI Context installed into: $PROJECT"
