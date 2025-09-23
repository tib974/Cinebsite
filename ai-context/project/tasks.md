# Journal des Tâches

## Tâches Terminées

1.  **Initialisation de la Refonte (React/Vite)**
    - Initialisation d'un nouveau projet React avec Vite.
    - Installation des dépendances de base via npm.
    - Mise à jour de la documentation `ai-context` pour refléter la nouvelle architecture.
2.  **Mise en Place de la Structure de Base React**
    - Création des composants `Header` et `Footer`.
    - Installation et configuration de `react-router-dom` pour la navigation.
    - Création des composants de page placeholders (`Home`, `Contact`, etc.).
    - Importation de la feuille de style principale (`theme-poppins.css`).
3.  **Reconstruction des Pages**
    - Recréation de la page `Contact` avec son formulaire.
    - Recréation de la page `Packs & Matériel`.
4.  **Nettoyage Final**
    - Suppression de tous les dossiers et fichiers de l'ancienne application PHP (`vendor`, `views`, `src`, `api`, etc.).
5.  **Mise en Place du Catalogue Local**
    - Création d'une source de données locale (`src/data/index.js`) à partir du fichier `catalogfdf.csv`.
    - Refactorisation de la page catalogue (`Packs.jsx`) pour utiliser les données locales au lieu de Sanity.
    - Refactorisation de la page de détail (`ProductDetail.jsx`) pour faire de même et suppression des fonctionnalités non essentielles (calendrier).

---

### Ancien Journal (Archivé)

1.  **Connexion du Catalogue à la DB:**
    - Modifié `/api/catalog.php` pour lire depuis la base de données SQLite au lieu d'un fichier JSON/CSV.
    - Ajout d'une logique pour différencier les 'packs' des 'products'.
    - Nettoyage des données retournées par l'API.
2.  **Refactorisation du Formulaire de Contact:**
    - Remplacement de la logique JavaScript personnalisée (basée sur Google Apps Script) par un formulaire HTML standard.
    - Configuration du formulaire pour pointer vers un endpoint de test public.
    - Suppression du fichier JavaScript `public/js/contact.js` devenu inutile.

## Prochaines Étapes (Plan de Projet)
- Le plan initial suggérait de travailler sur les horaires de cinéma, mais cette tâche a été annulée par l'utilisateur.
- La prochaine étape est à définir avec l'utilisateur.
