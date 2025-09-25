import db from '../db/db.js';

export function getAvailabilityCalendar({ start, end }) {
  const stmt = db.prepare(`
    SELECT
      product_id AS productId,
      date,
      reserved_quantity AS reservedQuantity
    FROM availability
    WHERE date BETWEEN ? AND ?
    ORDER BY date ASC
  `);
  return stmt.all(start, end);
}

export function upsertAvailability(productId, date, reservedQuantity) {
  const stmt = db.prepare(`
    INSERT INTO availability (product_id, date, reserved_quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(product_id, date) DO UPDATE SET reserved_quantity = excluded.reserved_quantity
  `);
  stmt.run(productId, date, reservedQuantity);
}
