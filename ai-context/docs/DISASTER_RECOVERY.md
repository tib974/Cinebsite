# Recréer l'environnement

## Nouveau Mac
1) Homebrew + apps :
```
brew install --cask zed ollama
brew install node git lftp
npm i -g @google/gemini-cli
```
2) Gemini CLI :
```
mkdir -p ~/.gemini
echo 'GOOGLE_CLOUD_PROJECT="mon-projet-gemini-14716"' > ~/.gemini/.env
echo 'alias g="gemini"' >> ~/.zshrc
source ~/.zshrc
```
3) Décompresse le pack dans `/Users/thibautapv/Desktop/ai-context` et clone dans `/Users/thibautapv/Desktop/Cinebsite` :
```
mkdir -p "/Users/thibautapv/Desktop/ai-context" && unzip -o ~/Downloads/ai-context-v3-full-plus.zip -d "/Users/thibautapv/Desktop/ai-context"
git clone https://github.com/tib974/Cinebsite.git "/Users/thibautapv/Desktop/Cinebsite"
bash "/Users/thibautapv/Desktop/ai-context/scripts/install_ai_context.sh"
bash "/Users/thibautapv/Desktop/ai-context/scripts/start_workday.sh"
```
