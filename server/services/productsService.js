import db from '../db/db.js';

export function getAllProducts() {
  const stmt = db.prepare(`
    SELECT id, name, slug, description, daily_price AS dailyPrice, image_url AS imageUrl, stock
    FROM products
    ORDER BY name ASC
  `);
  return stmt.all();
}

export function getProductBySlug(slug) {
  const stmt = db.prepare(`
    SELECT id, name, slug, description, daily_price AS dailyPrice, image_url AS imageUrl, stock
    FROM products
    WHERE slug = ?
  `);
  return stmt.get(slug);
}

export function getProductById(id) {
  const stmt = db.prepare(`
    SELECT id, name, slug, description, daily_price AS dailyPrice, image_url AS imageUrl, stock
    FROM products
    WHERE id = ?
  `);
  return stmt.get(id);
}

export function createProduct(data) {
  const stmt = db.prepare(`
    INSERT INTO products (name, slug, description, daily_price, image_url, stock)
    VALUES (@name, @slug, @description, @dailyPrice, @imageUrl, @stock)
    RETURNING id
  `);
  const result = stmt.get(data);
  return getProductById(result.id);
}

export function updateProduct(id, data) {
  const stmt = db.prepare(`
    UPDATE products
    SET name = @name,
        slug = @slug,
        description = @description,
        daily_price = @dailyPrice,
        image_url = @imageUrl,
        stock = @stock,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `);
  stmt.run({ ...data, id });
  return getProductById(id);
}

export function deleteProduct(id) {
  const stmt = db.prepare('DELETE FROM products WHERE id = ?');
  stmt.run(id);
}
