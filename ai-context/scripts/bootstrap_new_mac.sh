#!/usr/bin/env bash
set -euo pipefail
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || true
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
brew install --cask zed ollama
brew install node git lftp
npm i -g @google/gemini-cli
mkdir -p ~/.gemini
echo 'GOOGLE_CLOUD_PROJECT="mon-projet-gemini-14716"' > ~/.gemini/.env
echo 'alias g="gemini"' >> ~/.zshrc
source ~/.zshrc
echo Done.
