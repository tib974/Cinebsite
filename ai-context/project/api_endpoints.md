# Endpoints API

## `/api/catalog.php`
- **Méthode:** GET
- **Fonction:** Récupère la liste complète des produits et des packs depuis la base de données (`products` table).
- **Logique:**
  - Se connecte à la base de données SQLite.
  - Interroge la table `products`.
  - Détermine le `type` ('product' ou 'pack') en fonction de la présence de données dans la colonne `includes`.
  - Nettoie les données (`includes`) et les mappe aux noms de champs attendus par le frontend (ex: `price` -> `price_eur_day`).
  - Retourne les données en format JSON.
