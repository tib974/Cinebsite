# Roadmap Refonte CinéB

## 0. Mode d'emploi
- Ce document sert de fil rouge unique pour l'équipe (propriétaire + IA). Garder ce fichier à jour à chaque session.
- Pour marquer une tâche réalisée, transformer `[ ]` en `[x]` et ajouter une note datée dans le journal de bord (§6).
- Lorsqu'une nouvelle action est décidée, l'ajouter dans la checklist pertinente ou dans le backlog global (§5).
- En cas de changement de stratégie, documenter la décision dans le journal de bord avec le « pourquoi » et l'impact.

## 1. Contexte express
- **Objectif** : remettre en service et optimiser le site de location audiovisuelle CinéB (https://cinebsite.vercel.app/).
- **Contraintes** : budget 0 €, propriétaire non technicien, dépendances existantes à conserver (React + Vite + Sanity + Formspree).
- **Atouts actuels** : structure SPA fonctionnelle, données Sanity, scripts de déploiement `deploy.command` / `deploy:oneclick`.
- **Points de douleur initiaux** : performances faibles (bundle unique 422 KB, assets lourds), SEO quasi nul (pas de pré-rendu), formulaires peu robustes, design non aligné avec les mockups papier fournis.
- **Supports design** : `Page d'accueil.jpg`, `Page materiels + page Produit.jpg`, `Page devis.jpg` à la racine du projet.

## 2. Gouvernance & Rôles
| Rôle | Responsabilité | Personne/Assistant |
|------|----------------|--------------------|
| Product Owner | Priorité business, validation design, contenus | Propriétaire CinéB |
| Responsable technique | Implémentation, documentation, monitoring | IA Codex |
| Support contenu | Photographies, textes, témoignages | À confirmer (PO ou réseau) |

### Environnements & commandes clés
- **Développement** : `npm run dev`
- **Build** : `npm run build`
- **Déploiement** : `npm run deploy:oneclick` (InfinityFree) ou Vercel auto.
- **Sanity Studio** : dossier `studio/`, lancer `npm run dev` depuis `studio` si nécessaire.

## 3. Vue d'ensemble du programme
| Phase | Horizon cible | Objectif principal | Dépendances | Critères de succès |
|-------|---------------|-------------------|-------------|--------------------|
| 1. Stabilisation | Semaine 1 | Corriger assets critiques & balises SEO basiques | Audit initial | LCP mobile <3s estimée, sitemap/OG cohérents, fetch Sanity tolérant aux erreurs |
| 2. Accessibilité & Tracking | Semaines 2 | Sécuriser formulaires, activer analytics, doc onboarding | Phase 1 | Formulaires protégés, Plausible/Umami branché, guide utilisateur livré |
| 3. SSG & Découpage | Semaines 3-4 | Pré-rendu des pages & optimisation bundle | Phase 1 | Pages HTML statiques prêtes, lazy loading routes lourdes, Core Web Vitals <2.5s LCP |
| 4. Refonte Design Alignée Mockups | Semaines 5-6 | Implémenter UI conforme croquis (Home, Packs, Produit, Devis) | Phases 1-3 | Layouts conformes, tests UX validés, cohérence mobile |
| 5. Contenu & Preuve sociale | Mois 3 | Enrichir avec témoignages, guides, pages campagnes | Phases 1-4 | +2 contenus premium publiés, preuves sociales visibles |
| 6. Transfert & Automatisation | Mois 3-4 | Process de mise à jour autonome & suivis | Phases 1-5 | Checklists propriétaires rédigées, scripts "un-clic" validés |

## 4. Détails par phase

### Phase 1 – Stabilisation (Semaine 1)
**Objectifs** : fiabiliser l'existant (SEO, assets, erreurs runtime).

**Livrables**
- Assets optimisés (≤200 KB pour logo, ≤400 KB pour packshot PNG).
- Sitemap/OG mis à jour vers l'URL active.
- Gestion d'erreur utilisateur sur fetch Sanity.

**Checklist priorisée**
- [x] Compresser images lourdes (`public/assets/products/pack-fx30-1770-...png`, logos) via script Node (`sharp`).
- [x] Nettoyer doublons JPG/WebP inutiles (`public/assets/realisations/*`).
- [x] Mettre à jour `index.html` & `public/sitemap.xml` vers `https://cinebsite.vercel.app` (temp) ou domaine final.
- [x] Ajouter fallback visuel + message utilisateur quand Sanity ne répond pas (Home, Packs, Matériel, ProductDetail).
- [x] Installer monitoring console simple (utiliser `console.error` déjà, ajouter tracking Sentry? -> reporter si coût, sinon log).

**Notes / Observations**
- Vérifier disponibilité finale du domaine `www.cineb.re` avant de réinscrire dans OG.

### Phase 2 – Accessibilité & Tracking (Semaines 2)
**Objectifs** : Sécuriser formulaires et instaurer mesure.

**Livrables**
- Formspree protégé (honeypot + délai minimal + message de succès clair).
- Analytics libre (Plausible self-host ou Umami) intégré + bannière consentement simple.
- Documentation (PDF/Markdown) "Comment mettre à jour un produit Sanity" + "Comment déployer".

**Checklist priorisée**
- [x] Ajouter champ horodatage et rejet si envoi <3s après chargement (`src/pages/Contact.jsx`, `Calendrier.jsx`).
- [x] Message de confirmation utilisateur (modal/toast) après Formspree.
- [x] Implémenter analytics (script conditionnel) + gestion consentement (localStorage flag).
- [x] Rédiger guides utilisateurs dans `docs/` (créer dossier si besoin).

### Phase 3 – SSG & Découpage (Semaines 3-4)
**Objectifs** : Permettre SEO et réduire bundle.

**Livrables**
- `vite-plugin-ssr` (ou équivalent) configuré : génération static pour Home, Packs, Matériel, Produit, Contact.
- Lazy loading `react-calendar` & autres modules lourds.
- Sitemap généré dynamiquement post-build via script Node (lecture Sanity).

**Checklist priorisée**
- [x] Étudier options SSG (vite-plugin-ssr vs react-snap) et décider (documenter choix).
- [x] Implémenter SSG retenu (routes, hydration).
- [x] Fractionner bundle (lazy routes & `React.Suspense`).
- [x] Script `npm run generate:sitemap` tirant Sanity + fallback local.
- [x] Mettre en place tests E2E rapides (Playwright) pour valider SSR.

### Phase 4 – Refonte Design Alignée Mockups (Semaines 5-6)
**Objectifs** : Coller aux croquis, améliorer conversion.

**Livrables**
- Composants Hero carousel + sections "Produits les plus loués" / "Packs les plus demandés".
- Page catalogue avec onglets Son/Lumière/Accessoire et indicateur disponibilité.
- Page produit avec panneau disponibilité + recommandations.
- Page contact/devis avec double colonne (contact + calendrier) et rappel sélection.

**Checklist priorisée**
- [ ] Créer maquettes haute fidélité (Figma ou directement UI code).
- [x] Implémenter Hero carousel (3 slides max, CTA devis + Calendly).
- [x] Ajouter sections highlights (gérées par champs Sanity `featured`).
- [x] Repenser `Packs.jsx` filtres: onglets, badges disponibilité.
- [x] Refonte `ProductDetail.jsx`: bloc disponibilité (lecture `booking`), compatibilités.
- [x] Refonte `Contact.jsx`: layout aligné croquis + récap devis.
- [x] Tests responsive (≤390px, ≥1440px).

### Phase 5 – Contenu & Preuve sociale (Mois 3)
**Objectifs** : Monter la confiance et enrichir SEO.

**Livrables**
- Témoignages clients (texte ou vidéo) intégrés sur Home/Packs.
- Deux guides de tournage (Markdown -> page blog/ressource).
- Landing campagne (clip / livestream) avec CTA tracking.

**Checklist priorisée**
- [ ] Collecter preuves sociales (PO).
- [ ] Implémenter composant témoignages (suspendu sur décision propriétaire du 2025-09-23).
- [x] Créer système Markdown-to-React pour guides (`docs/content/*.md`).
- [x] Landing type `src/pages/CampagneClip.jsx` (option route dynamique).

### Phase 6 – Transfert & Automatisation (Mois 3-4)
**Objectifs** : Autonomie du propriétaire.

**Livrables**
- Checklists papier + vidéos courtes (mise à jour produit, déploiement).
- Script d’export de contacts Formspree -> CSV.
- Mise en place d’un rappel mensuel (cron local/GitHub Action) pour audit Core Web Vitals.

**Checklist priorisée**
- [x] Rédiger checklist mise à jour produit (Markdown + impression).
- [ ] Tour vidéo Loom/Screenflow (si possible) – à planifier.
- [ ] Script Node `npm run export:contacts` utilisant API Formspree (si accessible) sinon manuel.
- [ ] Configurer GitHub Action (gratuite) lançant `npm run build && npm run test` + capture Lighthouse (utiliser `lhci`).

## 5. Backlog global / Parking lot
- [ ] Implémenter moteur de recherche interne (Fuse.js) côté client.
- [ ] Intégrer carte des disponibilités via Google Calendar (si API gratuite acceptable).
- [ ] Étudier migration future vers domaine `cineb.re` (DNS + Vercel).
- [ ] Ajouter notifications Slack/Email sur nouvelles demandes de devis (Zapier free limit ? vérifier alternatives open-source).

## 6. Journal de bord
| Date | Auteur | Ce qui a été fait | Décisions | Prochaines actions |
|------|--------|-------------------|-----------|---------------------|
| 2025-09-21 | Codex | Création de la roadmap initiale. | Plan global validé (6 phases). | Démarrer Phase 1: compression assets & corrections SEO. |
| 2025-09-21 | Codex | Compression des assets lourds, mise à jour des metas/sitemap/robots, ajout de messages d'erreur Sanity sur les pages clés. | Conservation des assets convertis en nouvelles icônes manifest (icon-192/icon-512) et maintien de logooo.png compressé. | Mettre en place une solution de monitoring simple (log console + piste Sentry) pour clore la Phase 1. |
| 2025-09-21 | Codex | Déploiement d'un module de monitoring client (`src/utils/errorReporter.js`) + intégration globale (`initErrorMonitoring`, `reportError`). Build de vérification effectué. | Choix d'un stockage sessionStorage local (0 €) avec logs accessibles via `window.__CINEB_LAST_ERROR__`/`getErrorLog()`. | Préparer le démarrage de la Phase 2 (sécurisation formulaires & analytics). |
| 2025-09-21 | Codex | Ajout anti-spam + retours visuels sur les formulaires (Contact & Calendrier), bannière consentement analytics (`AnalyticsConsentBanner`), tracking pageview minimal et guides utilisateurs (`docs/`). | Script Plausible chargé seulement après consentement, délai 3s avant envoi Formspree, documentation pour PO livrée. | Surveiller l'état du domaine InfinityFree (https://cineb.great-site.net) et planifier les tests anti-spam en production après le prochain déploiement. |
| 2025-09-21 | Codex | Étude SSG (`docs/ssg-options.md`) puis mise en place d’un pré-rendu maison (`npm run build:ssg`, `scripts/prerender.mjs`) avec hydratation conditionnelle et export des routes Sanity. | Choix d’un pipeline custom (StaticRouter + Vite SSR) en attendant une éventuelle migration `vite-plugin-ssr`. | Résoudre l'avertissement sur le champ "items" (Contact) lors du SSR, puis démarrer le découpage bundle (`react-calendar` en import dynamique). |
| 2025-09-21 | Codex | Découpage du bundle (`react-calendar` en lazy load) + génération automatique du sitemap dans `build:ssg` (basée sur Sanity). | `scripts/prerender.mjs` écrit désormais `dist/public/sitemap.xml` via `SITE_BASE_URL`; hydratation côté client gérée par `hydrateRoot`. | Vérifier la taille des bundles restants et planifier l'ajout de tests E2E Playwright. |
| 2025-09-21 | Codex | Mise en place de Playwright (`playwright.config.js`, tests/e2e) + script `npm run test:e2e`. | Tests couvrant home, navigation packs et page produit (loader/fallback) exécutés sur Chromium. | Étendre la couverture (mobile project), automatiser via CI et exploiter les traces en cas d’échec. |
| 2025-09-22 | Codex | Refonte Home: hero slider multi-CTA, badges "Prix dégressifs", sections "Produits les plus loués" / "Packs les plus demandés" avec données Sanity. | Lazy load calendrier + build SSG génère sitemap dynamique via `SITE_BASE_URL`. | Enchaîner sur la page Packs (onglets + disponibilités) et gabarit Contact/Product suivant les maquettes. |
| 2025-09-22 | Codex | Refonte pages catalogue, fiche produit et contact : badges disponibilité, bloc réservations, formulaire double colonne + calendrier synchronisé. | Disponibilités calculées depuis `booking`, compatibilités via packs référencés, formulaire enrichi (dates ISO + Calendly). | Vérifier responsive extrême (≤390px / ≥1440px) sur devices réels et valider données Sanity live. |
| 2025-09-22 | Codex | Ajustements responsive (hero, toolbar packs, container) + ajout tests Playwright viewport 390/1440. | CTA hero flex-wrap mobile + conteneurs XL / mobile améliorés; couverture E2E responsive étendue. | Contrôler le rendu réel sur appareils physiques et passer à la Phase 5 (preuves sociales). |
| 2025-09-22 | Codex | Landing campagne clip (`/campagne/clip`) : structure hero, highlights, étapes + CTA, intégrée à la navigation. | Route pré-rendue et testée (Playwright), nouvelle nav "Campagne clip". | Prévoir contenus spécifiques (vidéos, retours clients) et décliner vers d’autres campagnes si validé. |
| 2025-09-22 | Codex | Système guides Markdown (`/guides` + pages détail) + outil invitation Sanity sans terminal. | Guides gérés via `docs/content/*.md`, routes pré-rendues, tests E2E mis à jour; dashboard `start-admin` pour invites et déploiement Studio. | Collecter témoignages réels et décider du design carousel; alimenter les guides avec contenus réels. |
| 2025-09-22 | Codex | Checklists imprimables (mise à jour produit & déploiement) ajoutées aux guides + doc propriétaire mise à jour. | Checklists Markdown (`docs/content/checklist-*.md`) visibles sur `/guides`; guide propriétaire intègre l’outil admin. | Finaliser le composant témoignages une fois les preuves sociales collectées. |
| 2025-09-23 | Codex | Retrait complet des témoignages (code, schéma, guides) suite décision propriétaire. | Fonctionnalité mise en pause ; priorité à d'autres contenus avant réintroduction éventuelle. | Revenir sur l'idée seulement si le propriétaire fournit des témoignages validés. |
| 2025-09-23 | Codex | Audit technique (lint, scripts "push vercel", nettoyage dist). | `dist/` retiré du suivi, lint passe, script de déploiement one-click documenté. | Lancer `./scripts/push-vercel.sh` avant chaque itération et résoudre `npm audit` quand le réseau sera disponible. |
