# CinéB – Maquette statique

Prototype autonome contenant :
- pages HTML/CSS reprenant la structure du site (accueil, matériel, packs, fiche produit, réalisations, contact),
- données fictives proches du catalogue réel (`data/catalog.json`),
- aucun build ni dépendance : suffit d’ouvrir `index.html` dans un navigateur ou de déposer le dossier sur n’importe quel FTP (InfinityFree, etc.).

## Structure
```
static-prototype/
  index.html
  materiel.html
  packs.html
  product.html
  realisations.html
  contact.html
  assets/
    style.css
    placeholder.svg
  data/
    catalog.json
  scripts/
    data.js
```

## Fonctionnement
- Les pages chargent `data/catalog.json` via un module ES (`scripts/data.js`).
- Pas de back-office ni de formulaire côté serveur : seul le formulaire contact Formspree fonctionne.
- Les estimations affichées dans `contact.html` utilisent une remise fictive (15% dès 3 jours, 30% dès 5 jours).

## Déploiement rapide
1. Copier le dossier `static-prototype/` sur un hébergement statique (InfinityFree : uploader dans `htdocs`, Vercel : configurer “Other → root = static-prototype”).
2. Mettre à jour les données en éditant `data/catalog.json` (format JSON simple).
3. Modifier les couleurs ou la typographie dans `assets/style.css`.

Cette maquette sert de base visuelle. Pour le site complet (API, devis, calendrier), il faudra brancher le code React/Node original ou construire un back-office séparé.
