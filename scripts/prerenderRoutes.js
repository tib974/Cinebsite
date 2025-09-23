import fs from 'fs/promises';
import path from 'path';
import sanityClient from '../src/sanityClient.js';

const STATIC_ROUTES = ['/', '/packs', '/materiel', '/calendrier', '/campagne/clip', '/guides', '/apropos', '/contact'];

async function fetchSlugs(query) {
  try {
    const result = await sanityClient.fetch(query);
    return Array.isArray(result) ? result.filter(Boolean) : [];
  } catch (error) {
    console.warn('[prerender] Sanity fetch failed, fallback to local data.', error);
    return [];
  }
}

async function readNdjson(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    console.warn('[prerender] Unable to read fallback NDJSON', error);
    return [];
  }
}

async function getProductSlugs(rootDir) {
  const sanitySlugs = await fetchSlugs('*[_type == "product" && defined(slug.current)].slug.current');
  if (sanitySlugs.length > 0) {
    return sanitySlugs;
  }

  const localData = await readNdjson(path.join(rootDir, 'migration-data.ndjson'));
  return localData
    .filter((entry) => entry._type === 'product' && entry.slug?.current)
    .map((entry) => entry.slug.current);
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

export async function getPreRenderRoutes(rootDir) {
  const routes = new Set(STATIC_ROUTES);

  const productSlugs = await getProductSlugs(rootDir);
  productSlugs.forEach((slug) => routes.add(`/produit/${slug}`));

  const guideSlugs = await getGuideSlugs(rootDir);
  guideSlugs.forEach((slug) => routes.add(`/guides/${slug}`));

  return Array.from(routes);
}
