# Passation projet – Cinebsite

## 1) Architecture et choix techniques

- React + Vite (simplicité site vitrine, pas de framework surdimensionné).
- Backend Node/Express + SQLite via `better-sqlite3`.
- API REST exposée par `server/` (produits, packs, disponibilité, devis à venir).
- Reverse proxy Nginx, HTTPS via Certbot, Node derrière (`127.0.0.1:3000`).
- Déploiement Oracle Cloud Always Free (service `systemd`, CI/CD GitHub Actions en SSH).

Répertoires clés:
- `src/pages/` (pages front).
- `src/utils/apiClient.js` (client REST + mappers).
- `server/services/*.js` (services DB et logique métier).
- `infra/` (Nginx, systemd, CI/CD, DNS, guide).
- `scripts/` (migrations, utilitaires).

## 2) État d’avancement

- Front migré vers l’API REST pour:
  - `src/pages/Home.jsx` (sélections produits/packs).
  - `src/pages/Materiel.jsx` (catalogue produits: catégories, tri, recherche).
  - `src/pages/Packs.jsx` (catalogue packs: tri, catégories).
  - `src/pages/ProductDetail.jsx` (fiche produit/pack, items inclus, packs compatibles, produits liés, disponibilité basée sur `stock` + `availability`).
- Contexte devis:
  - `src/context/QuoteContext.jsx` normalisé (slug, type, prix/jour), persistance locale robuste.
- Client REST:
  - `src/utils/apiClient.js` (`fetchJson`, `mapApiProduct`, `mapApiPack`, `fetchProductOrPackBySlug`).
- Backend:
  - `server/services/packsService.js` enrichi (catégorie sur les items pour le front).
  - `server/services/productsService.js` expose produits/packs/availability (structure compatible front).
- Infra livrée (`infra/`):
  - `infra/nginx.conf` (HTTPS/redirect/cache/proxy).
  - `infra/cinebsite.service` (systemd Node).
  - `infra/.github/workflows/deploy.yml` (pipeline build + déploiement SSH).
  - `infra/dns-zone-cineb.re.txt` (zone DNS exemple).
  - `infra/DEPLOYMENT_GUIDE.md` (pas-à-pas de déploiement).

## 3) Points critiques (sécurité/quotas Oracle)

- Secrets: toujours définir `SESSION_SECRET` (backend), limiter `/api` via `express-rate-limit`.
- Certificats: renouvellement `certbot` automatique.
- Quotas Oracle Always Free: CPU/RAM/stockage; surveiller `htop`, `df -h`.
- SQLite: prévoir backups/rotation; penser migration SGBD si trafic ↑.
- Logs: rotation `logrotate` / purge pour éviter saturation `/var`.
- CI/CD: secrets GitHub (`ORACLE_HOST`, `ORACLE_USER`, `ORACLE_SSH_KEY`, `ORACLE_SSH_PORT`).

## 4) Tâches à faire ensuite (priorisées)

1. Calendrier – `src/pages/Calendrier.jsx` ✅ FAIT
   - Produit pré‑sélectionné via `?produit=slug` et récupération API OK.
   - Optionnel: endpoint disponibilité dédié si besoin (sinon logique locale OK pour vitrine).
2. Contact – `src/pages/Contact.jsx`
   - Actuel: Formspree par défaut.
   - Nouveau: bascule optionnelle vers l’API interne `/api/quotes` via `VITE_USE_API_QUOTES=1`.
   - Déploiements statiques (ex: Vercel): définir `VITE_API_BASE_URL=https://<domaine-backend>` pour pointer l’API distante. Le front préfixera automatiquement ses appels `/api/...`.
3. Routes & UX
   - Vérifier `AppRoutes`, fallback SPA, placeholders images, affichage prix/stock cohérent.
4. Ops/Infra
   - Installer/activer `infra/nginx.conf`, `infra/cinebsite.service` sur la VM.
   - Renseigner secrets GitHub; tester déploiement staging.
   - Mettre en place cron backup SQLite + `logrotate` + monitoring UptimeRobot.

## 5) Liste de vérification avant prod

- Back:
  - `/api/products`, `/api/packs`, fiches `/api/products/slug/:slug`, `/api/packs/slug/:slug` OK.
  - (Optionnel) `/api/quotes` prêt si on quitte Formspree.
- Front:
  - Navigation Home → Materiel → Detail OK.
  - Ajout au devis (slug unique) + persistance OK.
  - Contact (Formspree ou `/api/quotes`) OK.
  - Calendrier: estimation prix (dégressifs) OK.
- Infra:
  - Nginx proxy /api & /admin + cache assets + SPA fallback.
  - Certbot OK, renouvellement programmé.
  - systemd `cinebsite` activé (sur reboot).
  - CI/CD déploie et permet rollback (symlink `current`).
  - DNS: `A`/`CNAME` conformes.

## 6) Décisions / conventions

- Simplicité vitrine prioritaire (pas d’over-engineering).
- Formspree acceptable (rapidité). `/api/quotes` prêt si besoin d’internaliser.
- Slug comme clé unique front (`product.slug`/`pack.slug`).
- `dailyPrice` standardisé côté front.

## 7) Prochaines actions conseillées (ordre)

1. Adapter `Calendrier.jsx` et (au choix) `Contact.jsx` ➜ API.
2. (Si internalisation) Terminer `/api/quotes` et basculer le front.
3. Tests E2E manuels locaux (vite + node).
4. Déploiement staging via pipeline; vérif logs; monitoring.

8) Où trouver quoi :
Nginx/systemd/CI/DNS/Guide: infra/
infra/nginx.conf
infra/cinebsite.service
infra/.github/workflows/deploy.yml
infra/dns-zone-cineb.re.txt
infra/DEPLOYMENT_GUIDE.md
Client API: src/utils/apiClient.js
Contexte devis: src/context/QuoteContext.jsx
Pages migrées: src/pages/Home.jsx, src/pages/Materiel.jsx, src/pages/Packs.jsx, src/pages/ProductDetail.jsx
Backend services: server/services/productsService.js, server/services/packsService.js (+ quotesService.js à finaliser selon choix)

Paramètres front:
- `.env.example`
  - `VITE_USE_API_QUOTES=0|1` pour basculer l’envoi du formulaire Contact vers `/api/quotes`.
  - `VITE_API_BASE_URL` pour faire pointer les appels API vers une instance distante (utile sur Vercel qui ne sert que le front statique).
---

Document à jour: voir aussi `infra/DEPLOYMENT_GUIDE.md` pour l’exploitation/ops.
