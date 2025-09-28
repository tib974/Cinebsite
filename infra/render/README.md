# Déploiement backend CinéB sur Render

Ce guide permet de publier l'API + back-office Node/Express sur Render (offre gratuite) sans rien installer localement côté serveur.

## 1. Créer le service

1. Aller sur https://render.com et créer un compte (ou se connecter) avec GitHub.
2. Cliquer **New → Blueprint** et sélectionner ce dépôt.
3. Dans l’écran de configuration, Render détectera `infra/render/render.yaml`. Valider.
4. Dans la section *Environment Variables*, ajouter :
   - `SESSION_SECRET` : générer une chaîne longue (ex. via https://www.lastpass.com/features/password-generator). Garder cette valeur secrète.
   - (facultatif) `ALLOWED_ORIGINS` : remplacer par l’URL effective du front (peut être ajustée plus tard).
5. Lancer le déploiement.

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

