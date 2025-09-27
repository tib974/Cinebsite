import db from '../db/db.js';

const PACK_FIELDS = `id, name, slug, description, daily_price AS dailyPrice, image_url AS imageUrl`;

const selectAllPacksStmt = db.prepare(`
  SELECT ${PACK_FIELDS}
  FROM packs
  ORDER BY name ASC
`);

const selectPackByIdStmt = db.prepare(`
  SELECT ${PACK_FIELDS}
  FROM packs
  WHERE id = ?
`);

const selectPackIdBySlugStmt = db.prepare(`
  SELECT id
  FROM packs
  WHERE slug = ?
`);

const selectAllPackItemsStmt = db.prepare(`
  SELECT
    pi.id,
    pi.pack_id AS packId,
    pi.quantity,
    p.id AS productId,
    p.name,
    p.slug,
    p.category,
    p.daily_price AS dailyPrice,
    p.image_url AS imageUrl
  FROM pack_items pi
  JOIN products p ON p.id = pi.product_id
  ORDER BY pi.pack_id ASC, p.name ASC
`);

const selectPackItemsByPackIdStmt = db.prepare(`
  SELECT
    pi.id,
    pi.pack_id AS packId,
    pi.quantity,
    p.id AS productId,
    p.name,
    p.slug,
    p.category,
    p.daily_price AS dailyPrice,
    p.image_url AS imageUrl
  FROM pack_items pi
  JOIN products p ON p.id = pi.product_id
  WHERE pi.pack_id = ?
  ORDER BY p.name ASC
`);

const insertPackStmt = db.prepare(`
  INSERT INTO packs (name, slug, description, daily_price, image_url)
  VALUES (@name, @slug, @description, @dailyPrice, @imageUrl)
  RETURNING id
`);

const updatePackStmt = db.prepare(`
  UPDATE packs
  SET name = @name,
      slug = @slug,
      description = @description,
      daily_price = @dailyPrice,
      image_url = @imageUrl,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = @id
`);

const deletePackStmt = db.prepare('DELETE FROM packs WHERE id = ?');
const deletePackItemsStmt = db.prepare('DELETE FROM pack_items WHERE pack_id = ?');

const insertPackItemStmt = db.prepare(`
  INSERT INTO pack_items (pack_id, product_id, quantity)
  VALUES (@packId, @productId, @quantity)
`);

function mapPack(row) {
  if (!row) return null;
  return {
    ...row,
    type: 'pack',
    dailyPrice: row.dailyPrice ?? 0,
    imageUrl: row.imageUrl ?? null,
  };
}

function mapPackItem(row) {
  if (!row) return null;
  return {
    id: row.id ?? null,
    packId: row.packId ?? null,
    productId: row.productId,
    name: row.name,
    slug: row.slug,
    type: 'product',
    dailyPrice: row.dailyPrice ?? 0,
    imageUrl: row.imageUrl ?? null,
    quantity: row.quantity ?? 1,
  };
}

function hydratePack(row, itemsByPack) {
  const pack = mapPack(row);
  if (!pack) return null;
  const items = itemsByPack ? itemsByPack.get(pack.id) ?? [] : selectPackItemsByPackIdStmt.all(pack.id).map(mapPackItem);
  return { ...pack, items };
}

export function getAllPacks() {
  const packRows = selectAllPacksStmt.all();
  const itemRows = selectAllPackItemsStmt.all().map(mapPackItem);

  const itemsByPack = new Map();
  for (const item of itemRows) {
    if (!itemsByPack.has(item.packId)) {
      itemsByPack.set(item.packId, []);
    }
    itemsByPack.get(item.packId).push(item);
  }

  return packRows.map((row) => hydratePack(row, itemsByPack));
}

export function getPackById(id) {
  const row = selectPackByIdStmt.get(id);
  if (!row) return null;
  return hydratePack(row);
}

export function getPackBySlug(slug) {
  const row = selectPackIdBySlugStmt.get(slug);
  if (!row) return null;
  return getPackById(row.id);
}

export function createPack(data) {
  const inserted = insertPackStmt.get({
    ...data,
    dailyPrice: data.dailyPrice ?? 0,
    imageUrl: data.imageUrl ?? null,
  });
  return getPackById(inserted.id);
}

export function updatePack(id, data) {
  updatePackStmt.run({
    ...data,
    id,
    dailyPrice: data.dailyPrice ?? 0,
    imageUrl: data.imageUrl ?? null,
  });
  return getPackById(id);
}

export function deletePack(id) {
  deletePackStmt.run(id);
}

const replacePackItemsTx = db.transaction((packId, items) => {
  deletePackItemsStmt.run(packId);
  for (const item of items) {
    if (!item?.productId) continue;
    insertPackItemStmt.run({
      packId,
      productId: item.productId,
      quantity: item.quantity ?? 1,
    });
  }
});

export function setPackItems(packId, items = []) {
  replacePackItemsTx(packId, items);
  return getPackById(packId);
}
