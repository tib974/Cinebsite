import db from '../db/db.js';

export function listQuotes({ status = null } = {}) {
  const baseQuery = `
    SELECT id, customer_name AS customerName, email, phone, start_date AS startDate,
           end_date AS endDate, status, total, notes, created_at AS createdAt
    FROM quotes
  `;

  if (status) {
    const stmt = db.prepare(`${baseQuery} WHERE status = ? ORDER BY created_at DESC`);
    return stmt.all(status);
  }

  const stmt = db.prepare(`${baseQuery} ORDER BY created_at DESC`);
  return stmt.all();
}

export function getQuoteById(id) {
  const quoteStmt = db.prepare(`
    SELECT id, customer_name AS customerName, email, phone, start_date AS startDate,
           end_date AS endDate, status, total, notes, created_at AS createdAt
    FROM quotes
    WHERE id = ?
  `);
  const quote = quoteStmt.get(id);
  if (!quote) return null;

  const itemsStmt = db.prepare(`
    SELECT id, item_type AS itemType, item_id AS itemId, name, unit_price AS unitPrice, quantity
    FROM quote_items
    WHERE quote_id = ?
    ORDER BY id ASC
  `);
  const items = itemsStmt.all(id);
  return { ...quote, items };
}

export function createQuote(data) {
  const stmt = db.prepare(`
    INSERT INTO quotes (customer_name, email, phone, start_date, end_date, status, total, notes)
    VALUES (@customerName, @email, @phone, @startDate, @endDate, @status, @total, @notes)
    RETURNING id
  `);
  const result = stmt.get(data);
  return getQuoteById(result.id);
}

export function updateQuote(id, data) {
  const stmt = db.prepare(`
    UPDATE quotes
    SET customer_name = @customerName,
        email = @email,
        phone = @phone,
        start_date = @startDate,
        end_date = @endDate,
        status = @status,
        total = @total,
        notes = @notes,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `);
  stmt.run({ ...data, id });
  return getQuoteById(id);
}

export function deleteQuote(id) {
  const stmt = db.prepare('DELETE FROM quotes WHERE id = ?');
  stmt.run(id);
}

export function setQuoteItems(quoteId, items) {
  const deleteStmt = db.prepare('DELETE FROM quote_items WHERE quote_id = ?');
  deleteStmt.run(quoteId);

  const insertStmt = db.prepare(`
    INSERT INTO quote_items (quote_id, item_type, item_id, name, unit_price, quantity)
    VALUES (@quoteId, @itemType, @itemId, @name, @unitPrice, @quantity)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insertStmt.run({ quoteId, ...row });
    }
  });

  insertMany(items);
  return getQuoteById(quoteId);
}

export function updateQuoteStatus(id, status) {
  const stmt = db.prepare(`
    UPDATE quotes
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(status, id);
  return getQuoteById(id);
}
