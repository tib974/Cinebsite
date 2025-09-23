# CinéB — Site vitrine React

Application monopage (SPA) construite avec [Vite](https://vitejs.dev/) et [React Router] pour présenter les services de location audiovisuelle CinéB (La Réunion), les packs prêts à tourner et le matériel à la carte.

## Prérequis
- Node.js 18+
- npm 9+

## Scripts disponibles
| Commande            | Description                                      |
|--------------------|--------------------------------------------------|
| `npm install`      | Installe les dépendances                         |
| `npm run dev`      | Lance le serveur de développement (port 5173)    |
| `npm run build`    | Construit la version production dans `dist/`     |
| `npm run build:ssg`| Build + pré-rendu statique des pages (`dist/`)   |
| `npm run preview`  | Sert localement le build pour validation finale  |
| `npm run test:e2e` | Lance les tests Playwright (ouvre un serveur Preview) |

## Structure
- `src/` : composants React, pages et thème (`theme-poppins.css`)
- `src/data/` : normalisation du catalogue à partir de `data/catalog.json`
- `public/` : assets bruts copiés tels quels (images, polices, `.htaccess`)
- `dist/` : sortie générée par `npm run build` (non suivie par Git, à déployer sur l’hébergement)
- `docs/` : guides propriétaires (déploiement, mise à jour produit, prise en main générale)
- `studio/` : Sanity Studio (back-office) pour éditer produits, packs, disponibilités
- `start-admin.command` / `start-admin.bat` : lance un mini outil graphique pour inviter des collaborateurs Sanity et déployer le Studio (voir `docs/sanity-invitation.md`)

## Déploiement
Consulter [`README_infinityfree.md`](README_infinityfree.md) pour le pas‑à‑pas vers InfinityFree (`cineb.great-site.net`).

### Variables d’environnement utiles
- `SITE_BASE_URL` (optionnel) : URL utilisée pour générer le fichier `sitemap.xml` lors de `npm run build:ssg` (défaut : `https://cinebsite.vercel.app`).

### One click (InfinityFree)
1. Copier `.env.deploy.example` en `.env.deploy` et vérifier les identifiants FTP.
2. Sur macOS, double-cliquer `deploy.command`. En terminal, exécuter `npm run deploy:oneclick`.
3. Le script installe les dépendances si besoin, construit `dist/` puis envoie le site sur `htdocs/`.

## Personnalisation
- Contenu du catalogue : modifier `data/catalog.json`
- Couleurs / styles : éditer `src/theme-poppins.css`
- Formulaire : mettre à jour la cible `action` dans `src/pages/Contact.jsx`

### Sanity (optionnel)
- Pour activer le chargement dynamique du catalogue depuis Sanity, créer `.env.local` avec `VITE_SANITY_FETCH=true`
- Sans cette variable, le site exploite les données locales et ne dépend d’aucun service externe

## Licence
Projet propriétaire CinéB — usage interne.
