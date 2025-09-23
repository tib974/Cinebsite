---
title: "Checklist déploiement site CinéB"
excerpt: "Contrôle avant/après pour publier une nouvelle version sur Vercel ou InfinityFree."
order: 11
slug: checklist-deploiement
---
## Avant de builder
- S’assurer que `npm install` ne renvoie pas d’erreur.
- Valider les tests : `npm run test:e2e` → 0 échec.
- Vérifier que `.env.admin` et `.env.local` ne contiennent rien à commiter.

## Build & prévisualisation
1. `npm run build`
2. `npm run preview`
3. Ouvrir http://localhost:4173 → cliquer sur : Home, Packs, Matériel, Guides, Campagne clip, Contact.

## Déploiement
### Vercel
- `git status` propre → `git commit` → `git push`.
- Vérifier la build sur https://vercel.com (projet CinéB).

### InfinityFree (si nécessaire)
- `npm run deploy:oneclick`
- Surveiller le terminal jusqu’à « Upload completed ».

## Vérifications post-déploiement
- Ouvrir https://cinebsite.vercel.app (ou domaine cible) et https://cineb.great-site.net.
- Vidanger le cache navigateur (Ctrl+F5) pour vérifier les nouvelles pages.
- Tester le formulaire Contact (mail de test) et la bannière analytics.
- S’assurer que `/sitemap.xml` et `/guides/...` répondent.

## Communication
- Prévenir le propriétaire (email court) : « déploiement OK, changelog : … ».
- Archiver le build : enregistrer l’export `dist/` si changement majeur.

---
Astuce : conserver cette checklist imprimée près du poste de travail et cocher les étapes au stabilo avant chaque mise en production.
