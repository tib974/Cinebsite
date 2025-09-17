# Déploiement sur InfinityFree

Site en production : https://cineb.great-site.net/

## 1. Préparer les fichiers
1. Installer les dépendances si ce n’est pas déjà fait : `npm install`
2. Générer la version de production : `npm run build`
   - Les fichiers prêts à publier se trouvent dans `dist/`
   - `.htaccess` (copié depuis `public/.htaccess`) est inclus pour rediriger toutes les routes du SPA vers `index.html`

## 2. Nettoyer l’hébergement
Avant chaque mise à jour, vider le contenu de `htdocs/` sur InfinityFree (ou sauvegarder ce qui doit l’être).
Supprimer notamment les anciens fichiers PHP/JS hérités de l’ancienne version pour éviter les conflits.

## 3. Mettre en ligne
1. **Option automatique (One Click)**
   1. Copier `.env.deploy.example` en `.env.deploy` puis ajuster le mot de passe si besoin.
   2. Double-cliquer sur `deploy.command` (macOS) ou lancer `npm run deploy:oneclick` dans le terminal.
   3. Le script installe les dépendances si nécessaire, construit `dist/` puis envoie le contenu dans `htdocs/` via FTP.
2. **Option manuelle (FileZilla recommandé)**
   1. Hôte : fourni par InfinityFree (`ftpupload.net` pour ce projet)
   2. Utilisateur / Mot de passe : ceux affichés dans le panneau client
   3. Port : 21
   4. Glisser **le contenu** de `dist/` (pas le dossier lui‑même) dans `htdocs/`
   5. Une fois le transfert terminé, ouvrir `https://cineb.great-site.net/` pour vérifier que tout fonctionne
      - Tester la navigation interne (`/packs`, `/produit/sony-fx30`, …) pour confirmer que la réécriture SPA fonctionne

## 4. Formulaire de contact
Le formulaire envoie actuellement les données vers `https://formtester.goodbytes.be/post.php` (sandbox). Lorsque vous aurez un endpoint définitif :
- Ouvrir `src/pages/Contact.jsx`
- Mettre à jour l’attribut `action="…"`
- Recompiler (`npm run build`) et redéployer

## 5. Données et médias
- Les données produits / réalisations sont intégrées au bundle via `src/data/index.js`
- Les images et polices se trouvent dans `public/assets/` et sont copiées automatiquement lors du build
- Aucun export SQL/CSV n’est nécessaire côté hébergement

## 6. Post‑déploiement
- Ouvrir la console navigateur (F12) et surveiller l’onglet « Console » pour vérifier l’absence d’erreurs JavaScript
- Si une page retourne une 404, confirmer que `.htaccess` est bien présent et que le transfert FTP a respecté la casse des fichiers
- Purger éventuellement le cache Cloudflare/InfinityFree si les modifications ne sont pas visibles immédiatement
