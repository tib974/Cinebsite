import fs from 'fs';
import path from 'path';

const JSON_PATH = path.resolve('data/realisations.json');
const OUTPUT_PATH = path.resolve('migration-realisations.ndjson');

const jsonContent = fs.readFileSync(JSON_PATH, 'utf-8');
const sourceDocs = JSON.parse(jsonContent);

const sanityDocs = sourceDocs.map(doc => ({
  _id: doc.slug,
  _type: 'realisation',
  title: doc.title,
  slug: { _type: 'slug', current: doc.slug },
  customer: doc.tags, // Le champ 'tags' semble correspondre à 'customer'
  url: doc.url,
  date: doc.date,
  featured: doc.featured === true,
  description: doc.description,
}));

const ndjsonContent = sanityDocs.map(doc => JSON.stringify(doc)).join('\n');
fs.writeFileSync(OUTPUT_PATH, ndjsonContent);

console.log(`✅ Fichier ${OUTPUT_PATH} généré avec ${sanityDocs.length} documents.`);
