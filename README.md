# CinéB — Site vitrine React

Application monopage (SPA) construite avec [Vite](https://vitejs.dev/) et [React Router] pour présenter les services de location audiovisuelle, les packs de matériel et les réalisations de CinéB (La Réunion).

## Prérequis
- Node.js 18+
- npm 9+

## Scripts disponibles
| Commande            | Description                                      |
|--------------------|--------------------------------------------------|
| `npm install`      | Installe les dépendances                         |
| `npm run dev`      | Lance le serveur de développement (port 5173)    |
| `npm run build`    | Construit la version production dans `dist/`     |
| `npm run preview`  | Sert localement le build pour validation finale  |

## Structure
- `src/` : composants React, pages et thème (`theme-poppins.css`)
- `src/data/` : normalisation du catalogue et des réalisations à partir de `data/catalog.json` et `data/realisations.json`
- `public/` : assets bruts copiés tels quels (images, polices, `.htaccess`)
- `dist/` : sortie générée par `npm run build` (à déployer sur l’hébergement)

## Déploiement
Consulter [`README_infinityfree.md`](README_infinityfree.md) pour le pas‑à‑pas vers InfinityFree (`cineb.great-site.net`).

### One click (InfinityFree)
1. Copier `.env.deploy.example` en `.env.deploy` et vérifier les identifiants FTP.
2. Sur macOS, double-cliquer `deploy.command`. En terminal, exécuter `npm run deploy:oneclick`.
3. Le script installe les dépendances si besoin, construit `dist/` puis envoie le site sur `htdocs/`.

## Personnalisation
- Contenu du catalogue : modifier `data/catalog.json`
- Réalisations : `data/realisations.json` ou synchronisation Sanity (`src/pages/Realisations.jsx`)
- Couleurs / styles : éditer `src/theme-poppins.css`
- Formulaire : mettre à jour la cible `action` dans `src/pages/Contact.jsx`

### Sanity (optionnel)
- Pour activer le chargement dynamique depuis Sanity, créer `.env.local` avec `VITE_SANITY_FETCH=true`
- Sans cette variable, le site utilise les réalisations locales et ne dépend d’aucun service externe

## Licence
Projet propriétaire CinéB — usage interne.
