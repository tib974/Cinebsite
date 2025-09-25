import db from '../db/db.js';

export function getAllPacks() {
  const stmt = db.prepare(`
    SELECT id, name, slug, description, daily_price AS dailyPrice, image_url AS imageUrl
    FROM packs
    ORDER BY name ASC
  `);
  const packs = stmt.all();

  const itemsStmt = db.prepare(`
    SELECT
      pi.pack_id AS packId,
      pi.quantity,
      p.id AS productId,
      p.name,
      p.slug,
      p.daily_price AS dailyPrice
    FROM pack_items pi
    JOIN products p ON p.id = pi.product_id
    ORDER BY p.name ASC
  `);
  const items = itemsStmt.all();

  const byPack = new Map();
  for (const item of items) {
    if (!byPack.has(item.packId)) {
      byPack.set(item.packId, []);
    }
    byPack.get(item.packId).push(item);
  }

  return packs.map((pack) => ({
    ...pack,
    items: byPack.get(pack.id) ?? [],
  }));
}

export function getPackById(id) {
  const packStmt = db.prepare(`
    SELECT id, name, slug, description, daily_price AS dailyPrice, image_url AS imageUrl
    FROM packs
    WHERE id = ?
  `);
  const pack = packStmt.get(id);
  if (!pack) return null;

  const itemsStmt = db.prepare(`
    SELECT
      pi.id,
      pi.quantity,
      p.id AS productId,
      p.name,
      p.slug,
      p.daily_price AS dailyPrice
    FROM pack_items pi
    JOIN products p ON p.id = pi.product_id
    WHERE pi.pack_id = ?
    ORDER BY p.name ASC
  `);
  const items = itemsStmt.all(id);
  return { ...pack, items };
}

export function createPack(data) {
  const stmt = db.prepare(`
    INSERT INTO packs (name, slug, description, daily_price, image_url)
    VALUES (@name, @slug, @description, @dailyPrice, @imageUrl)
    RETURNING id
  `);
  const result = stmt.get(data);
  return getPackById(result.id);
}

export function updatePack(id, data) {
  const stmt = db.prepare(`
    UPDATE packs
    SET name = @name,
        slug = @slug,
        description = @description,
        daily_price = @dailyPrice,
        image_url = @imageUrl,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `);
  stmt.run({ ...data, id });
  return getPackById(id);
}

export function deletePack(id) {
  const stmt = db.prepare('DELETE FROM packs WHERE id = ?');
  stmt.run(id);
}

export function setPackItems(packId, items) {
  const deleteStmt = db.prepare('DELETE FROM pack_items WHERE pack_id = ?');
  deleteStmt.run(packId);

  const insertStmt = db.prepare(`
    INSERT INTO pack_items (pack_id, product_id, quantity)
    VALUES (@packId, @productId, @quantity)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insertStmt.run({ packId, ...row });
    }
  });

  insertMany(items);
  return getPackById(packId);
}
