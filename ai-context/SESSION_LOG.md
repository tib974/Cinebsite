# Journal de Bord de Session

Ce document est un résumé détaillé de toutes les interactions et décisions prises au cours du projet.

---

### **Phase 1 : Découverte et Débogage de l'Architecture PHP**

- **Conclusion :** L'architecture PHP s'est avérée trop instable à déboguer en local.

### **Phase 2 : Pivot et Refonte vers une Stack Moderne (React/Vite)**

- **Décision Stratégique :** Refonte complète vers une stack JavaScript moderne (React, Vite, Vercel).
- **Actions Réalisées :**
    1.  Initialisation du projet React/Vite.
    2.  Mise en place de la structure de base (routage, composants, pages).
    3.  Importation des styles et des données de test du catalogue complet.

### **Phase 3 : Débogage de l'Environnement Local**

- **Problème :** Une série d'erreurs en cascade ("page blanche", `dispatcher is null`, `React is not defined`, `File not found`) a rendu l'application inutilisable après des opérations de nettoyage et de réinstallation.
- **Cause Racine :** Les opérations de suppression de fichiers (`rm -rf`) étaient trop agressives et ont supprimé des fichiers essentiels de l'application React (`src/main.jsx`, `src/App.jsx`, etc.).
- **Résolution :** Après de multiples tentatives de réparation ciblées, une "Grande Remise à Zéro" a été effectuée : tous les fichiers critiques de l'application React ont été recréés en une seule fois, garantissant leur présence et leur cohérence.
- **État Actuel :** L'application React est maintenant stable et fonctionnelle en local, en utilisant des données de test.

### **Phase 4 : Développement des Fonctionnalités (Interface Uniquement)**

- **Stratégie Actuelle :** Le développement local se concentre sur l'interface utilisateur (UI/UX). Les fonctionnalités nécessitant un back-end (API Sanity, API de génération d'images) seront construites "à l'aveugle" et ne seront fonctionnelles qu'une fois déployées sur Vercel. Le back-office Sanity est abandonné en local.
