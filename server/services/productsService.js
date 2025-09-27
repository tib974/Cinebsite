import { z } from 'zod';

import db from '../db/db.js';

const productInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  featured: z.boolean().optional().default(false),
  dailyPrice: z.number().nonnegative().default(0),
  imageUrl: z.string().url().nullable().optional(),
  stock: z.number().int().nonnegative().default(0),
});

function mapProductRow(row) {
  if (!row) return null;
  return {
    ...row,
    type: 'product',
    featured: Boolean(row.featured),
    dailyPrice: row.dailyPrice ?? 0,
    imageUrl: row.imageUrl ?? null,
    stock: row.stock ?? 0,
  };
}

export function getAllProducts() {
  const stmt = db.prepare(`
    SELECT id,
           name,
           slug,
           description,
           category,
           featured,
           daily_price AS dailyPrice,
           image_url AS imageUrl,
           stock
    FROM products
    ORDER BY name ASC
  `);
  return stmt.all().map(mapProductRow);
}

const productBySlugStmt = db.prepare(`
  SELECT id,
         name,
         slug,
         description,
         category,
         featured,
         daily_price AS dailyPrice,
         image_url AS imageUrl,
         stock
  FROM products
  WHERE slug = ?
`);

const packMembershipStmt = db.prepare(`
  SELECT p.id,
         p.name,
         p.slug,
         p.daily_price AS dailyPrice,
         p.image_url AS imageUrl
  FROM pack_items pi
  JOIN packs p ON p.id = pi.pack_id
  WHERE pi.product_id = ?
  ORDER BY p.name ASC
`);

const availabilityStmt = db.prepare(`
  SELECT date,
         reserved_quantity AS reservedQuantity
  FROM availability
  WHERE product_id = ?
  ORDER BY date ASC
`);

function getPackItemsForPackIds(packIds) {
  if (!packIds.length) return new Map();
  const placeholders = packIds.map(() => '?').join(',');
  const stmt = db.prepare(`
    SELECT
      pi.pack_id AS packId,
      pi.quantity,
      prod.id AS productId,
      prod.name,
      prod.slug,
      prod.daily_price AS dailyPrice,
      prod.image_url AS imageUrl
    FROM pack_items pi
    JOIN products prod ON prod.id = pi.product_id
    WHERE pi.pack_id IN (${placeholders})
    ORDER BY pi.pack_id ASC, prod.name ASC
  `);
  const items = stmt.all(...packIds);
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.packId)) {
      map.set(item.packId, []);
    }
    map.get(item.packId).push({
      ...item,
      type: 'product',
      dailyPrice: item.dailyPrice ?? 0,
      imageUrl: item.imageUrl ?? null,
      quantity: item.quantity ?? 1,
    });
  }
  return map;
}

export function getProductBySlug(slug) {
  const row = productBySlugStmt.get(slug);
  if (!row) return null;
  const product = mapProductRow(row);
  const packs = packMembershipStmt.all(product.id).map((pack) => ({
    ...pack,
    type: 'pack',
    dailyPrice: pack.dailyPrice ?? 0,
    imageUrl: pack.imageUrl ?? null,
  }));
  const packItemsMap = getPackItemsForPackIds(packs.map((pack) => pack.id));
  product.packs = packs.map((pack) => ({
    ...pack,
    items: packItemsMap.get(pack.id) ?? [],
  }));
  product.availability = availabilityStmt.all(product.id);
  return product;
}

export function getProductById(id) {
  const stmt = db.prepare(`
    SELECT id,
           name,
           slug,
           description,
           category,
           featured,
           daily_price AS dailyPrice,
           image_url AS imageUrl,
           stock
    FROM products
    WHERE id = ?
  `);
  return mapProductRow(stmt.get(id));
}

export function createProduct(data) {
  const parsed = productInputSchema.parse(data);
  const stmt = db.prepare(`
    INSERT INTO products (name, slug, description, category, featured, daily_price, image_url, stock)
    VALUES (@name, @slug, @description, @category, @featured, @dailyPrice, @imageUrl, @stock)
    RETURNING id
  `);
  const result = stmt.get({
    ...parsed,
    description: parsed.description ?? null,
    category: parsed.category ?? null,
    imageUrl: parsed.imageUrl ?? null,
    featured: parsed.featured ? 1 : 0,
  });
  return getProductById(result.id);
}

export function updateProduct(id, data) {
  const parsed = productInputSchema.parse(data);
  const stmt = db.prepare(`
    UPDATE products
    SET name = @name,
        slug = @slug,
        description = @description,
        category = @category,
        featured = @featured,
        daily_price = @dailyPrice,
        image_url = @imageUrl,
        stock = @stock,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `);
  stmt.run({
    ...parsed,
    id,
    description: parsed.description ?? null,
    category: parsed.category ?? null,
    imageUrl: parsed.imageUrl ?? null,
    featured: parsed.featured ? 1 : 0,
  });
  return getProductById(id);
}

export function deleteProduct(id) {
  const stmt = db.prepare('DELETE FROM products WHERE id = ?');
  stmt.run(id);
}
