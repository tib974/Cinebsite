# Déploiement Cinebsite sur Oracle Cloud

## 1. Préparation Oracle Cloud Always Free
- **Créer un compte** Oracle Cloud (tenancy Always Free).
- **Provisionner une VM** (Ampere A1 ou VM.Standard.E2.1 Micro). Choisir Ubuntu 22.04 LTS.
- **Configurer le réseau** :
  - Ouvrir les ports `22` (SSH), `80` (HTTP), `443` (HTTPS) et `3000` (si besoin de debug) via Security Lists / Network Security Groups.
  - Associer une adresse IP publique réservée (Reserved Public IP).
- **Créer un utilisateur** SSH (ex : `deploy`) avec clé publique.

> **Critique** : surveiller les quotas (CPU, RAM, stockage). Les ressources Always Free sont limitées. Empêcher la création d’instances supplémentaires involontaires.

## 2. Installation de la stack serveur
Connexion SSH :
```bash
ssh -i ~/.ssh/oracle deploy@203.0.113.42
```

Mettre à jour le système :
```bash
sudo apt update && sudo apt upgrade -y
```

Installer Node.js et outils :
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs build-essential git
```

Installer Nginx et Certbot :
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Créer l’arborescence projet :
```bash
sudo mkdir -p /var/www/cinebsite/{current,data,logs,releases}
sudo chown -R deploy:www-data /var/www/cinebsite
```

> **Sécurité** : désactiver `root` SSH, utiliser `ufw` si besoin (autoriser `OpenSSH`, `Nginx Full`).

## 3. Déploiement initial
Cloner le dépôt :
```bash
cd /var/www/cinebsite
sudo -u deploy git clone https://github.com/votrecompte/cinebsite.git source
```

Installer les dépendances :
```bash
cd source
npm ci
```

Copier les fichiers de configuration (depuis `infra/`) :
```bash
sudo cp infra/nginx.conf /etc/nginx/sites-available/cinebsite.conf
sudo ln -s /etc/nginx/sites-available/cinebsite.conf /etc/nginx/sites-enabled/cinebsite.conf
sudo cp infra/cinebsite.service /etc/systemd/system/cinebsite.service
```

Configurer l’application :
- Créer `.env` (voir `server/.env.example`).
- Définir `SESSION_SECRET`, `SQLITE_DIR`, `PORT` etc.

Migrer et builder :
```bash
npm run migrate
npm run build
```

Déployer (`current` -> release initiale) :
```bash
RELEASE=$(date +"%Y%m%d%H%M%S")
mkdir -p /var/www/cinebsite/releases/$RELEASE
cp -R dist server scripts package.json package-lock.json /var/www/cinebsite/releases/$RELEASE
ln -sfn /var/www/cinebsite/releases/$RELEASE /var/www/cinebsite/current
```

Démarrer les services :
```bash
sudo systemctl daemon-reload
sudo systemctl enable cinebsite
sudo systemctl start cinebsite
sudo systemctl restart nginx
```

> **Attention** : vérifier les logs `journalctl -u cinebsite` et `/var/log/nginx/...`.

### Variante simple (sans Nginx, sans domaine)
Si vous n’avez pas encore de nom de domaine et voulez aller au plus simple pour tester en ligne :

1) Ouvrir le port `3000` dans le pare‑feu Oracle (Security Lists / NSG).
2) Sauter la section Nginx/Certbot ci‑dessous pour l’instant.
3) Lancer seulement le service Node:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable cinebsite
   sudo systemctl start cinebsite
   ```
4) Accéder au site sur `http://<IP_PUBLIQUE>:3000/` (front + API sur la même adresse).

Plus tard, quand vous achetez un domaine, revenez activer Nginx + HTTPS.

## 4. DNS et HTTPS
Chez le registrar (ex: Gandi, OVH, Cloudflare) :
- A `cineb.re` → IP publique Oracle.
- CNAME `www` → `cineb.re.`
- A `admin`/`api` → IP publique (selon besoin).

Utiliser la zone d’exemple `infra/dns-zone-cineb.re.txt` pour repères.

Configurer Certbot :
```bash
sudo certbot --nginx -d cineb.re -d www.cineb.re -d admin.cineb.re
sudo systemctl reload nginx
```

> **Limitation** : Oracle bloque parfois les ports sortants (mail). Utiliser un SMTP externe pour notifications.

## 5. Backups, journaux, monitoring
- **Base SQLite** : script cron journalier (`sqlite3 backup`). Exemple :
  ```bash
  0 3 * * * sqlite3 /var/www/cinebsite/data/app.sqlite \
    ".backup '/var/backups/cinebsite/app-$(date +\%Y\%m\%d).sqlite'"
  ```
  Conserver 7-14 jours, synchroniser vers OCI Object Storage ou S3.
- **Logs** : rotation via `logrotate` (`/etc/logrotate.d/cinebsite`). Nettoyer `nginx` et `journalctl` régulièrement.
- **Monitoring** : configurer UptimeRobot (pings https://cineb.re/health et https://cineb.re/api/products). Ajouter alertes email/SMS.

## 6. Rollback et versionning
- Chaque déploiement crée un dossier `releases/AAAAMMJJHHMMSS`.
- Pour revenir en arrière :
  ```bash
  cd /var/www/cinebsite
  ln -sfn releases/20250927180000 current
  sudo systemctl restart cinebsite
  sudo systemctl reload nginx
  ```
- Versionner tout dans Git (branche `main`). Utiliser tags pour releases.
- Conserver une copie `.env` (mais jamais pousser dans Git).

> **Critique** : tester `npm run migrate` avant `ln -s` pour éviter de casser la prod. En cas d’échec, ne pas changer `current`.

## 7. Pipeline CI/CD GitHub Actions
- Fichier `infra/.github/workflows/deploy.yml` : recevoir IP/SSH via secrets (`ORACLE_HOST`, `ORACLE_USER`, `ORACLE_SSH_KEY`, `ORACLE_SSH_PORT`).
- Étapes : build → tar → transfert SCP → extraction → `npm ci --omit=dev` → `npm run migrate` → symlink `current` → restart systemd + Nginx.
- Ajouter un job `smoke test` (curl `/health`) en post-déploiement (optionnel).

## 8. Points critiques à surveiller
- **Sécurité** :
  - Mettre à jour régulièrement (apt, npm).
  - Vérifier `SESSION_SECRET`, `CSRF`, `helmet`.
  - Restreindre SSH (fail2ban, clés seulement).
- **Ressources** Always Free : 1 vCPU/1GB. Monitorer la RAM (`htop`) et la place disque (`df -h`).
- **Base SQLite** : taille limitée, verrouillage en écriture. Prévoir bascule future vers MySQL/OCI Autonomous DB si trafic ↑.
- **Certificats** : automatiser `certbot renew` (cron). Vérifier avant expiration.
- **Logs** : rotation et purge. Ne pas saturer /var.
- **API quotas** : limiter `/api` via `express-rate-limit` déjà en place.
- **Monitoring** : alerter si CPU >80%, mémoire faible, HTTP 5xx.

---

## Check-list rapide
- Créer VM + firewall Oracle ✅
- Installer Node/Nginx/Certbot ✅
- Cloner repo, installer deps, migrer ✅
- Configurer `.env`, `systemd`, `nginx` ✅
- Certbot + DNS ✅
- Configurer CI/CD + secrets ✅
- Backups + monitoring ✅
- Documentation rollback ✅

## Annexe: front Vercel + API Oracle

Si vous gardez l’hébergement du front sur Vercel (build statique) et l’API sur la VM Oracle :

- Sur Vercel (Project → Settings → Environment Variables):
  - `VITE_API_BASE_URL=https://cineb.re` (ou le domaine/Nginx de votre API).
  - Optionnel: `VITE_USE_API_QUOTES=1` pour que la page Contact envoie vers l’API `/api/quotes`.
- Sur le serveur Oracle (`/etc/systemd/system/cinebsite.service`):
  - Ajouter `Environment=ALLOWED_ORIGINS=https://<votre-site>.vercel.app` pour autoriser le front à appeler l’API.
  - Puis `sudo systemctl daemon-reload && sudo systemctl restart cinebsite`.

Sans ces variables, le front Vercel ne recevra aucune donnée (les appels `/api/...` ne sont pas servis par Vercel et seront bloqués par le navigateur sans CORS).
