# Guide — Déployer le site CinéB

Deux canaux de diffusion existent : **Vercel** (https://cinebsite.vercel.app) et **InfinityFree** (https://cineb.great-site.net). Les deux partagent les mêmes sources `dist/`.

## 1. Préparer le build
1. Ouvrir un terminal dans `CinebsiteCDXL`.
2. Installer les dépendances si besoin : `npm install`.
3. Lancer `npm run build` pour générer `dist/` (le dossier n'est plus suivi par Git mais reste créé localement).
4. Vérifier rapidement le rendu local : `npm run preview` puis ouvrir `http://localhost:4173`.

## 2. Déployer sur Vercel
- Le dépôt Vercel reconstruit automatiquement lors d’un `git push` (si connecté).
- Pour un flux « un clic », exécuter `./scripts/push-vercel.sh` (macOS/Linux). Le script nettoie les `.DS_Store`, construit le projet et pousse sur `main`.
- Sinon, utiliser la commande `vercel deploy` (compte requis).
- URL de test : https://cinebsite.vercel.app.

## 3. Déployer sur InfinityFree (https://cineb.great-site.net)
InfinityFree fonctionne via FTP.

### 3.1. Pré-requis
- Identifiants FTP (hôte, user, mot de passe) fournis dans les notes récupérées avec l’ancien site.
- Script `deploy.command` (macOS) ou `npm run deploy:oneclick` déjà configuré.

### 3.2. Déploiement automatisé
1. Lancer `npm run deploy:oneclick` depuis la racine du projet.
2. Le script :
   - Installe les dépendances si nécessaire.
   - Construit `dist/`.
   - Envoie le contenu de `dist/` sur `htdocs/` via FTP.
3. Attendre le message « Upload completed ».
4. Vérifier ensuite https://cineb.great-site.net/.
   - Si la page est vide, patienter 1-2 minutes ou vider le cache (`Ctrl + F5`).

### 3.3. Déploiement manuel (option de secours)
1. Générer le build (`npm run build`).
2. Ouvrir un client FTP (FileZilla, Cyberduck…).
3. Se connecter avec les identifiants InfinityFree.
4. Glisser-déposer le contenu du dossier `dist/` vers `htdocs/`.
5. Supprimer les anciens fichiers si nécessaire (attention à ne pas effacer `.htaccess`).

## 4. Vérifications après déploiement
- Tester les formulaires (Contact et Calendrier). Un message de succès doit s’afficher en bas du formulaire.
- Ouvrir la console du navigateur et vérifier l’absence d’erreurs critiques.
- Contrôler que la bannière de consentement analytics s’affiche pour les nouveaux visiteurs.
- S’assurer que les sections « Mises en avant » et « Réalisations » chargent bien depuis Sanity (sinon consulter `window.getErrorLog?.()`).

## 5. Astuces & dépannage
- Si `npm run build` échoue, lancer `rm -rf node_modules && npm install` puis recommencer.
- Si le script `deploy.command` ne démarre pas (permissions), exécuter `chmod +x deploy.command`.
- InfinityFree impose parfois un délai avant de servir les nouveaux fichiers. Recharger la page plusieurs fois.
- Les Core Web Vitals peuvent être testées localement avec `npm run preview` + [Lighthouse](https://developers.google.com/web/tools/lighthouse). Consigner les résultats dans `ROADMAP.md` si nécessaire.

## 6. Historique des domaines
- `https://cinebsite.vercel.app` : version actuelle « staging ».
- `https://cineb.great-site.net` : reprise de l’ancien site InfinityFree (peut répondre vide; vérifier l’état du compte FTP si besoin).
- `https://www.cineb.re` : domaine souhaité à réactiver plus tard (DNS non résolus à date).
