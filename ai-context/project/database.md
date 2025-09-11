# Schéma de la Base de Données

La base de données est un fichier SQLite situé à `data/database.sqlite`.

## Table: `products`
Cette table contient tous les articles individuels et les packs.

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    name TEXT,
    description TEXT,
    price REAL,
    image TEXT,
    tags TEXT,
    includes TEXT
);
```
- `price`: Contient le prix journalier. (Actuellement non rempli)
- `tags`: Contient les catégories, séparées par des virgules. (Actuellement non rempli)
- `includes`: Pour les packs, contient une liste de `slugs` de produits inclus, séparés par des virgules.
