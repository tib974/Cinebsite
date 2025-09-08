Base propre CinéB (new-site)

Contenu
- Pages: index, services, packs, produit, realisations, realisation, calendrier, contact, 404
- JS: config, cache, image-optimizer, nav, featured, catalog, product, realisations, realisation, calendar, contact
- Données: data/catalogfdf.csv, data/realisations.csv (fallbacks locaux)

Configuration
- Modifier `js/config.js` → `API_BASE_URL` avec l’URL de déploiement Apps Script V2.
- Les CSV de secours sont déjà référencés via `data/...`.

Développement local
- Servez le dossier racine du repo avec un serveur statique (ex: `python3 -m http.server 8000`) puis ouvrez `/new-site/index.html`.
- Ou configurez votre hébergeur pour pointer vers `new-site/`.

Notes
- Les assets (images) restent au niveau racine `../assets/...`.
- Le thème utilisé est `../theme-poppins.css`.

Checklist
- [ ] Changer le mot de passe admin
