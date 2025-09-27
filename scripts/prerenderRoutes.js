import fs from 'fs/promises';
import path from 'path';

import { getAllProducts } from '../server/services/productsService.js';
import { listRealisations } from '../server/services/realisationsService.js';

const STATIC_ROUTES = ['/', '/packs', '/materiel', '/calendrier', '/campagne/clip', '/guides', '/apropos', '/contact'];

async function readNdjson(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    console.warn('[prerender] Unable to read fallback NDJSON', error.message);
    return [];
  }
}

async function getProductSlugs(rootDir) {
  try {
    const products = getAllProducts();
    return products.map((product) => product.slug).filter(Boolean);
  } catch (error) {
    console.warn('[prerender] Unable to list products from database, fallback to migration data.', error.message);
    const localData = await readNdjson(path.join(rootDir, 'migration-data.ndjson'));
    return localData
      .filter((entry) => entry._type === 'product' && (entry.slug?.current || typeof entry.slug === 'string'))
      .map((entry) => (typeof entry.slug === 'string' ? entry.slug : entry.slug.current));
  }
}

async function getGuideSlugs(rootDir) {
  const contentDir = path.join(rootDir, 'docs', 'content');
  try {
    const files = await fs.readdir(contentDir, { withFileTypes: true });
    return files
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name.replace(/\.md$/i, ''));
  } catch (error) {
    console.warn('[prerender] Impossible de lire docs/content pour les guides', error.message);
    return [];
  }
}

async function getRealisationSlugs() {
  try {
    const items = listRealisations();
    return items.map((item) => item.slug).filter(Boolean);
  } catch (error) {
    console.warn('[prerender] Impossible de charger les réalisations', error.message);
    return [];
  }
}

export async function getPreRenderRoutes(rootDir) {
  const routes = new Set(STATIC_ROUTES);

  const productSlugs = await getProductSlugs(rootDir);
  productSlugs.forEach((slug) => routes.add(`/produit/${slug}`));

  const guideSlugs = await getGuideSlugs(rootDir);
  guideSlugs.forEach((slug) => routes.add(`/guides/${slug}`));

  const realisationSlugs = await getRealisationSlugs();
  realisationSlugs.forEach((slug) => routes.add(`/realisation/${slug}`));

  return Array.from(routes);
}
