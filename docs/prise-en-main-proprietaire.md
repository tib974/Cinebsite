# Guide de prise en main — Propriétaire CinéB

Ce document résume tout ce qu’il faut savoir pour garder le site en ligne, mettre à jour les packs et déployer une nouvelle version. Les guides détaillés déjà présents dans `docs/` restent valables si besoin de précision.

## 1. Structure à connaître
- `src/` : application web (pages React, styles). À modifier uniquement si vous changez la mise en page.
- `public/` : images statiques (logo, icônes…).
- `docs/` : guides d’utilisation (dont ce fichier et les tutoriels détaillés).
- `studio/` : Sanity Studio = le « back-office » pour gérer produits, packs, réservations.
- `scripts/` : outils techniques (prérendu, déploiement…)

Pour sauvegarder une copie hors ligne : dupliquez tout le dossier `CinebsiteCDXL`.

## 2. Pré-requis logiciels
- **Node.js 18+** et **npm 9+** installés.
- Accès à un terminal (macOS Terminal, Windows PowerShell).

## 3. Lancer le site en local
1. Ouvrir un terminal dans `CinebsiteCDXL`.
2. Installer les dépendances (première fois ou après mise à jour) :
   ```bash
   npm install
   ```
3. Démarrer le serveur de développement :
   ```bash
   npm run dev
   ```
4. Ouvrir le lien indiqué (par défaut http://localhost:5173).

## 4. Déployer une nouvelle version
Suivre le guide détaillé `docs/guide-deploiement.md` (Vercel ou InfinityFree). Résumé rapide :
1. `npm run build` pour générer `dist/`.
2. `npm run preview` pour vérifier.
3. `npm run deploy:oneclick` (InfinityFree) ou `git push` (Vercel).

## 5. Gestion du catalogue via Sanity Studio
Sanity est la base de données sans serveur qui stocke : produits, packs, réservations, réalisations. Consultez aussi `docs/sanity-invitation.md` pour savoir comment inviter un nouveau collaborateur.

### 5.1 Ouvrir l’outil graphique (invitation & déploiement)
- Configurer `.env.admin` (voir `docs/sanity-invitation.md`) puis double-cliquer `start-admin.command` (macOS) ou `start-admin.bat` (Windows).
- L’outil ouvre http://localhost:4545 : inviter un collaborateur ou lancer `npm run deploy` sans terminal.

### 5.2 Installer et lancer le Studio localement
1. Se rendre dans `studio/` : `cd studio`.
2. Installer les dépendances : `npm install`.
3. Démarrer : `npm run dev`. Le Studio est accessible sur http://localhost:3333 (ou port indiqué).

> 🔐 **Connexion** : la commande demandera d’autoriser votre compte Sanity (gratuit). Utiliser le même compte que celui lié au projet `jyku6tox / production`.

### 5.3 Déployer le Studio en ligne (optionnel mais conseillé)
- Sanity permet de publier le Studio et d’y accéder depuis un navigateur :
  ```bash
  npm run deploy
  ```
- Lors de la première exécution, choisir un sous-domaine (ex: `cineb-studio.sanity.build`).
- Partagez ce lien + accès Sanity au propriétaire : il pourra gérer le catalogue sans config locale.

### 5.4 Ajouter / modifier un produit ou un pack
1. Aller dans la section **Produits / Packs** du Studio.
2. Cliquer sur « New Produit / Pack ».
3. Renseigner : nom, slug, type (`product` ou `pack`), prix, description, catégorie.
4. Pour un pack, ajouter les produits inclus via la liste « Produits inclus ».
5. Sauvegarder (`Cmd+S` ou bouton « Publish »).

> Consultez le guide détaillé `docs/guide-mise-a-jour-produit.md` pour captures d’écran et conseils.

### 5.5 Disponibilités / réservations
- Les documents `booking` (Réservations) permettent de bloquer des dates. Chaque réservation fait référence à un produit / pack. Mettre à jour depuis le Studio si besoin.

## 6. Gestion des campagnes (landing clip)
- La page `/campagne/clip` lit pour l’instant un contenu statique. Prévoir dans Sanity un document `campaign` si vous souhaitez éditer texte/prix directement depuis le Studio. (À implémenter lors d’une prochaine itération.)

## 7. Guides & checklists (Markdown)
- Les guides affichés sur `/guides` proviennent des fichiers Markdown dans `docs/content/`.
- Procédure ajout/modification :
  1. Dupliquer un fichier existant (ex. `guide-choisir-pack-camera.md`).
  2. Adapter le bloc frontmatter en haut (`title`, `excerpt`, `order`, `slug`).
  3. Rédiger le contenu en Markdown (titres `##`, listes, etc.).
  4. Enregistrer et, si besoin, redéployer (`npm run build` + `npm run deploy:oneclick`).
- Deux checklists imprimables sont prêtes : `checklist-mise-a-jour-produit.md` et `checklist-deploiement.md`. Elles sont visibles sur `/guides` et peuvent être imprimées (1 page chacune).

## 8. Sauvegardes et bonnes pratiques
- Après chaque modification sur Sanity, vérifier la Home/Packs en production.
- Faire un export régulier de Sanity (`sanity dataset export production ./backup`) pour garder une sauvegarde JSON.
- Conserver ce dossier projet + guides dans un stockage cloud.

## 9. À faire / décisions ouvertes
- [ ] Connecter la landing campagne à du contenu Sanity (titre, tarifs, visuels).
- [ ] Mettre en place un plan de sauvegarde mensuel (export Sanity + backup du dépôt).

Pour toute question technique, se référer aux guides existants ou contacter la personne ayant mis en place le site.
