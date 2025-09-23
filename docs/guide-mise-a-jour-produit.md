# Guide — Mettre à jour un produit/packs dans Sanity

Ce document accompagne le propriétaire (non technicien) pas à pas.

## 1. Pré-requis
- Ordinateur avec Node.js 18+ installé (déjà utilisé pour le site).
- Accès au compte Sanity (identifiants sauvegardés lors de la récupération du projet).
- Projet cloné/présent sur la machine (`CinebsiteCDXL`).

## 2. Lancer Sanity Studio en local
1. Ouvrir le terminal.
2. Se placer dans le dossier `CinebsiteCDXL/studio`.
3. (Première fois seulement) exécuter `npm install`.
4. Lancer `npm run dev`. Sanity Studio s’ouvre sur `http://localhost:3333`.
5. Se connecter avec les identifiants Sanity si demandé.

> Astuce : laisser le terminal ouvert pendant toute la session. Pour arrêter le studio, utiliser `Ctrl + C`.

## 3. Modifier un produit existant
1. Dans la colonne de gauche, cliquer sur **Produit / Pack**.
2. Rechercher le produit ou pack à modifier (barre de recherche en haut).
3. Cliquer sur la fiche pour l’ouvrir.
4. Mettre à jour :
   - **Nom** et **Slug** (le slug doit rester court, sans espaces).
   - **Prix par jour** (nombre en euros, sans symbole `€`).
   - **Description** (texte court 2-4 phrases, utiliser un ton concret).
   - **Catégorie** (Image, Lumière, Audio ou Packs).
   - **Type** : `pack` si c’est un pack, `product` sinon.
 - **Includes** : pour un pack, sélectionner les produits contenus. Cela alimente la section « Accessoires compatibles » du site.
  - **Featured** : activer l’interrupteur pour remonter l’élément dans les sections « Nos favoris ».
5. Ajouter ou remplacer l’image (bouton **Upload**). Préférer des visuels 1200px max en largeur.
6. Cliquer sur **Publish** en haut à droite pour enregistrer.

## 4. Ajouter un nouveau produit/packs
1. Depuis la liste « Produit / Pack », cliquer sur **Create**.
2. Remplir les mêmes champs que décrits ci-dessus.
3. Vérifier le slug (Sanity le propose automatiquement à partir du titre) puis publier.

## 5. Mettre à jour les réalisations
1. Section **Réalisation** dans le studio.
2. Pour chaque projet :
   - Renseigner **Titre**, **Client**, **Date** et **URL du projet** (YouTube, Vimeo…).
   - Cocher **Featured** si la réalisation doit apparaître en home.
   - Télécharger une image 16:9 (1280x720 recommandé).
3. Publier la fiche.

## 6. Rafraîchir le site
- Le site récupère les données Sanity côté client en temps réel. Aucune reconstruction n’est nécessaire.
- Recharger la page ou vider le cache du navigateur si une modification ne s’affiche pas immédiatement.

## 7. Notes & bonnes pratiques
- Limiter les images à 400 KB : utiliser l’outil **Preview** de Sanity pour vérifier.
- Toujours ajouter une description courte mais parlante (délais, disponibilité, cas d’usage).
- Pour désactiver temporairement un produit, décocher **Featured** et ajouter `**Indisponible**` dans la description le temps de le retirer complètement.
- En cas d’erreur (champ rouge), vérifier que le slug est unique et sans caractères spéciaux.

## 8. Besoin d’aide ?
- Consulter la roadmap `ROADMAP.md` pour connaître les priorités.
- Utiliser le module de monitoring du site : ouvrir la console du navigateur (`F12`) puis `window.getErrorLog?.()` pour accéder aux erreurs récentes côté client.
