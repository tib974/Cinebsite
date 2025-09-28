import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readNdjson(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeSlug(slug) {
  if (!slug) return '';
  if (typeof slug === 'string') return slug;
  return slug.current || '';
}

function main() {
  const dataNdjson = path.join(root, 'migration-data.ndjson');
  const realNdjson = path.join(root, 'migration-realisations.ndjson');

  if (!fs.existsSync(dataNdjson)) {
    console.error('Missing migration-data.ndjson');
    process.exit(0);
  }

  const records = readNdjson(dataNdjson);

  const productsSrc = records.filter((r) => (r.type || r._type) === 'product' && (r.type || r._type) !== 'pack');
  const packsSrc = records.filter((r) => (r.type || r._type) === 'pack');

  // Map products
  const products = [];
  const byId = new Map();
  const bySlug = new Map();
  let idSeq = 1;
  for (const r of productsSrc) {
    const slug = normalizeSlug(r.slug);
    const prod = {
      id: idSeq++,
      slug,
      name: r.name || '',
      description: r.description || '',
      category: r.category || '',
      type: 'product',
      featured: Boolean(r.featured),
      dailyPrice: r.dailyPrice ?? r.pricePerDay ?? null,
      imageUrl: r.imageUrl ?? r.image ?? null,
      stock: null,
      availability: [],
      packs: [],
    };
    products.push(prod);
    byId.set(r._id || prod.id, prod);
    bySlug.set(slug, prod);
  }

  // Map packs
  const packs = [];
  let packIdSeq = 1;
  for (const r of packsSrc) {
    const slug = normalizeSlug(r.slug);
    const items = Array.isArray(r.includes)
      ? r.includes
          .map((ref) => byId.get(ref._ref))
          .filter(Boolean)
          .map((p) => ({
            productId: p.id,
            slug: p.slug,
            name: p.name,
            dailyPrice: p.dailyPrice ?? null,
            imageUrl: p.imageUrl ?? null,
            type: 'product',
            category: p.category || '',
          }))
      : [];

    const pack = {
      id: packIdSeq++,
      slug,
      name: r.name || '',
      description: r.description || '',
      type: 'pack',
      featured: Boolean(r.featured),
      dailyPrice: r.dailyPrice ?? r.pricePerDay ?? null,
      imageUrl: r.imageUrl ?? r.image ?? null,
      items,
      stock: null,
    };
    packs.push(pack);
  }

  // Reverse membership: product -> packs
  const packsByItemSlug = new Map();
  for (const pack of packs) {
    for (const it of pack.items) {
      if (!packsByItemSlug.has(it.slug)) packsByItemSlug.set(it.slug, []);
      packsByItemSlug.get(it.slug).push({
        id: pack.id,
        slug: pack.slug,
        name: pack.name,
        description: pack.description,
        dailyPrice: pack.dailyPrice,
        imageUrl: pack.imageUrl ?? null,
        type: 'pack',
        featured: Boolean(pack.featured),
        items: pack.items,
      });
    }
  }
  for (const p of products) {
    p.packs = packsByItemSlug.get(p.slug) || [];
  }

  writeJson(path.join(root, 'public', 'static', 'products.json'), products);
  writeJson(path.join(root, 'public', 'static', 'packs.json'), packs);

  if (fs.existsSync(realNdjson)) {
    const reals = readNdjson(realNdjson).map((r, idx) => ({
      id: idx + 1,
      slug: normalizeSlug(r.slug) || r._id || String(idx + 1),
      title: r.title || '',
      description: r.description || '',
      customer: r.customer || null,
      url: r.url || null,
      date: r.date || null,
      featured: Boolean(r.featured),
      imageUrl: r.imageUrl || r.image || null,
    }));
    writeJson(path.join(root, 'public', 'static', 'realisations.json'), reals);
  }

  console.log('Static API built: public/static/*.json');
}

main();

