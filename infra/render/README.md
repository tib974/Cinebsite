# Déploiement backend CinéB sur Render

Ce guide permet de publier l'API + back-office Node/Express sur Render (offre gratuite) sans rien installer localement côté serveur.

## 1. Créer le service

1. Aller sur https://render.com et créer un compte (ou se connecter) avec GitHub.
2. Cliquer **New → Blueprint** puis sélectionner le dépôt `tib974/Cinebsite`.
3. Render détecte le fichier `render.yaml` à la racine (copie du blueprint). Cliquer **Deploy**.
4. Pendant la création, Render demande les variables d’environnement obligatoires :
   - `SESSION_SECRET` : clique sur **Add Environment Variable** → mets la clé `SESSION_SECRET` et une longue valeur aléatoire (ex. générée sur https://passwordsgenerator.net/). Tu peux la noter de côté.
   - Les variables déjà listées dans `render.yaml` (`NODE_ENV`, `SQLITE_DIR`, etc.) sont préremplies, tu n’as rien à modifier.
5. Lancer le déploiement (bouton **Apply** puis **Deploy**).

## 2. Ce que fait la configuration

- Installe les dépendances (`npm ci`).
- Monte un disque persistant `/var/data` pour la base SQLite + sessions.
- Démarre le serveur avec `npm run render:start` qui applique automatiquement les migrations avant `node server/index.js`.
- Expose `/health`, `/api/*` et le back-office `/admin`.

## 3. Après le premier déploiement

1. Aller sur l’URL Render (ex. `https://cinebsite-api.onrender.com/admin`).
2. Se connecter avec les identifiants existants :
   - utilisateur : `admin`
   - mot de passe : valeur stockée dans `data/admin.pass` (par défaut `cinebadmin` si non modifié). Pense à le changer dans l’interface admin.
3. Vérifier :
   - `/api/products` renvoie la liste des produits.
   - `/admin` permet d’ajouter/modifier produits et packs, gérer les devis.

## 4. Connecter le front

- Sur Vercel (ou tout autre hébergement du front), définir la variable d’environnement :
  - `VITE_API_BASE_URL=https://cinebsite-api.onrender.com`
  - Optionnel : `VITE_USE_API_QUOTES=1` pour utiliser `/api/quotes` au lieu de Formspree.
- Relancer le déploiement du front pour refléter la configuration.

## 5. Sauvegarde et maintenance

- Les fichiers SQLite sont dans le disque `/var/data`. Render les conserve entre redémarrages.
- Pour une sauvegarde manuelle :
  1. Ouvrir le shell Render (**SSH**).
  2. Copier `/var/data/app.sqlite` via `scp` ou `render-cli disks download`.
- Logger les erreurs serveur depuis l’onglet **Logs** de Render.

## 6. Passage futur sur Oracle (optionnel)

Les mêmes scripts fonctionnent :
- Copier le contenu du dépôt sur la VM.
- `npm ci && npm run build && npm run migrate`.
- Lancer le service systemd `infra/cinebsite.service` et Nginx `infra/nginx.conf`.
- Mettre `ALLOWED_ORIGINS` sur l’URL publique du front.
