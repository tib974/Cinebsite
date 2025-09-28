async function fetchText(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.text();
}

function parseNdjson(text) {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export async function loadCatalog() {
  const text = await fetchText('./data/migration-data.ndjson');
  const rows = parseNdjson(text);

  const idToProduct = new Map();
  const products = [];
  for (const r of rows) {
    const type = r.type || r._type;
    if (type === 'product' && r.type !== 'pack') {
      const slug = typeof r.slug === 'string' ? r.slug : r.slug?.current || '';
      const prod = {
        id: r._id || slug,
        slug,
        name: r.name || '',
        description: r.description || '',
        category: r.category || '',
        dailyPrice: r.dailyPrice ?? r.pricePerDay ?? null,
        imageUrl: r.imageUrl || r.image || null,
        featured: Boolean(r.featured),
        type: 'product',
      };
      products.push(prod);
      idToProduct.set(r._id, prod);
    }
  }

  const packs = [];
  for (const r of rows) {
    const type = r.type || r._type;
    if (type === 'pack') {
      const slug = typeof r.slug === 'string' ? r.slug : r.slug?.current || '';
      const items = Array.isArray(r.includes)
        ? r.includes.map((ref) => idToProduct.get(ref._ref)).filter(Boolean)
        : [];
      packs.push({
        id: r._id || slug,
        slug,
        name: r.name || '',
        description: r.description || '',
        dailyPrice: r.dailyPrice ?? r.pricePerDay ?? null,
        imageUrl: r.imageUrl || r.image || null,
        featured: Boolean(r.featured),
        type: 'pack',
        items,
      });
    }
  }

  return { products, packs };
}

export async function loadRealisations() {
  try {
    const text = await fetchText('./data/migration-realisations.ndjson');
    return parseNdjson(text).map((r, i) => ({
      id: r._id || i + 1,
      slug: typeof r.slug === 'string' ? r.slug : r.slug?.current || r._id || String(i+1),
      title: r.title || '',
      description: r.description || '',
      customer: r.customer || null,
      url: r.url || null,
      date: r.date || null,
      imageUrl: r.imageUrl || r.image || null,
    }));
  } catch {
    return [];
  }
}

export function formatPrice(eur) {
  if (eur === null || eur === undefined) return 'Prix sur demande';
  return `${Number(eur).toLocaleString('fr-FR', { minimumFractionDigits: eur % 1 ? 2 : 0 })}€ / jour`;
}

export function qs(name) {
  const usp = new URLSearchParams(location.search);
  return usp.get(name);
}
