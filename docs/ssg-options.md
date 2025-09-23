# Étude SSG pour CinéB

## Contexte
- SPA React 19 avec Vite 7, routing via `react-router-dom`.
- Données dynamiques récupérées auprès de Sanity (produits, réalisations).
- Objectif : générer des pages statiques indexables (Home, Services, Packs, Produit, Réalisations, Contact) tout en conservant l’hydratation côté client.
- Contraintes : budget 0 €, rester dans un workflow simple pour le propriétaire, éviter la réécriture complète du routage.

## Candidats analysés

### 1. `vite-plugin-ssr`
- **Description** : solution SSR/SSG officielle de la communauté Vite permettant de définir des routes `.page.jsx` et de pré-rendre côté serveur.
- **Avantages** :
  - Compatible React 19 et Vite 7.
  - Support natif SSG + hydrate sur le client.
  - Possibilité de générer des routes dynamiques (produit/slug) via `onBeforeRender`.
  - Documentation active.
- **Inconvénients** :
  - Nécessite de réorganiser les pages (structure `.page.jsx`), adapter `createBrowserRouter`.
  - Ajoute une couche de complexité (fichiers `_default.page.*`).
  - Demande un temps de migration (1-2 jours) avant de livrer valeur.
- **Évaluation** : viable mais implique une refonte partielle du routage existant.

### 2. `vite-ssg`
- **Description** : plugin léger pour transformer une app Vite en site statique à partir du router (notamment Vue, React support partiel).
- **Avantages** :
  - Support du pattern “app existante” avec hooks `onBeforeRender` pour pré-charger des données.
  - Permet de conserver `react-router` via `staticPaths`.
- **Inconvénients** :
  - Documentation centrée Vue. Support React non officiel.
  - Nécessite de gérer manuellement la récupération Sanity lors du build.
  - Communauté plus restreinte → risques de compatibilité.
- **Évaluation** : risque moyen. Retenu comme backup si `vite-plugin-ssr` s’avère trop lourd.

### 3. `react-snap`
- **Description** : outil qui lance un navigateur headless pour pré-rendre chaque route.
- **Avantages** :
  - Mise en place rapide (une commande après `npm run build`).
  - Fonctionne sans changer le code existant.
- **Inconvénients** :
  - Abandonné (dernière release 2021), pas compatible React 19 (issues ouvertes).
  - Charge les données via API lors du prerender → dépend de la disponibilité Sanity au build (ok) mais risque d’échec silencieux.
  - Gestion des routes dynamiques limitée (nécessite liste manuelle des URL).
- **Évaluation** : écarté pour raisons de maintenance/compatibilité.

### 4. SSR Vite natif (`vite build --ssr` + `@vitejs/plugin-react-swc`)
- **Description** : utiliser Vite pour générer un bundle SSR personnalisé.
- **Avantages** :
  - Contrôle complet.
  - Pas de dépendance tierce.
- **Inconvénients** :
  - Nécessite de coder toute la pipeline SSR (renderToString, route matching) manuellement.
  - Temps de développement élevé.
- **Évaluation** : écarté (complexité trop importante pour le budget).

## Décision
- **Option retenue** : `vite-plugin-ssr`.
  - Migration progressive possible :
    1. Ajouter plugin + config.
    2. Créer routes `.page.jsx` pour les vues principales en conservant les composants existants.
    3. Générer les routes dynamiques (`/produit/:slug`, `/realisation/:slug`) via requête Sanity lors du build (`onBeforeRender` + `entries`).
    4. Utiliser `prefetchStaticAssets` + `prerender` pour obtenir HTML statique.
    5. Conserver `QuoteContext` en injectant les providers dans `_default.page.client.jsx`.

## Prochaines étapes
1. Ajouter `vite-plugin-ssr` et restructurer l’entrée (`main.jsx` → `_default.page.client.jsx`).
2. Créer `_default.page.server.jsx` pour instancier `QuoteProvider` et partager les données initiales.
3. Implémenter pages SSG : Home, Services, Packs, Réalisations, Contact, Calendrier, Produit, Réalisation.
4. Script Sanity pour récupérer les slugs (via `migration-data.ndjson` en fallback si API indisponible).
5. Mettre à jour la commande `npm run build:ssg` puis adapter le déploiement (InfinityFree reçoit toujours `dist/`).

