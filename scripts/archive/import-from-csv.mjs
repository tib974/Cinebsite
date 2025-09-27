
import fs from 'fs';
import path from 'path';

// Chemin vers les fichiers source et destination
const CSV_PATH = path.resolve('data/catalog.csv');
const OUTPUT_PATH = path.resolve('migration-data.ndjson');

// Lecture du fichier CSV
const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');

// Séparation des lignes et suppression de l'en-tête
const lines = csvContent.trim().split('\n');
const headerLine = lines.shift();
const headers = headerLine.split(',').map(h => h.trim());

// Regex pour parser une ligne CSV en tenant compte des champs entre guillemets
const csvRowRegex = /,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/;

// Transformation des lignes CSV en objets JSON pour Sanity
const sanityDocs = lines.map(line => {
  const values = line.split(csvRowRegex);
  const doc = headers.reduce((obj, header, index) => {
    let value = (values[index] || '').trim();
    // Nettoyage des guillemets superflus
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    obj[header] = value;
    return obj;
  }, {});

  // Création du document Sanity
  const sanityDoc = {
    _id: doc.slug,
    _type: 'product',
    name: doc.name,
    slug: { _type: 'slug', current: doc.slug },
    pricePerDay: Number(doc.price_eur_day.replace(',', '.')), // Remplacer la virgule par un point pour la conversion en nombre
    description: doc.description,
    category: doc.category,
    featured: doc.featured === 'TRUE', // Convertir la chaîne 'TRUE' en booléen
    type: doc.type,
  };

  // Gestion des produits inclus pour les packs
  if (doc.type === 'pack' && doc.includes) {
    sanityDoc.includes = doc.includes.split(',').map(slug => ({
      _type: 'reference',
      _ref: slug.trim(),
    }));
  }

  return sanityDoc;
});

// Écriture des documents dans le fichier .ndjson
const ndjsonContent = sanityDocs.map(doc => JSON.stringify(doc)).join('\n');
fs.writeFileSync(OUTPUT_PATH, ndjsonContent);

console.log(`✅ Fichier ${OUTPUT_PATH} généré avec ${sanityDocs.length} documents.`);
