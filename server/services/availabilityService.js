import db from '../db/db.js';

const productsStmt = db.prepare(`
  SELECT id AS productId, name AS productName, stock
  FROM products
  ORDER BY name ASC
`);

const productByIdStmt = db.prepare(`
  SELECT id, name, stock
  FROM products
  WHERE id = ?
`);

const manualAvailabilityRangeStmt = db.prepare(`
  SELECT product_id AS productId, date, reserved_quantity AS reservedQuantity
  FROM availability
  WHERE date BETWEEN ? AND ?
`);

const manualAvailabilitySingleStmt = db.prepare(`
  SELECT reserved_quantity AS reservedQuantity
  FROM availability
  WHERE product_id = ? AND date = ?
`);

const upsertAvailabilityStmt = db.prepare(`
  INSERT INTO availability (product_id, date, reserved_quantity)
  VALUES (?, ?, ?)
  ON CONFLICT(product_id, date) DO UPDATE SET reserved_quantity = excluded.reserved_quantity
`);

const listAvailabilityForProductStmt = db.prepare(`
  SELECT date, reserved_quantity AS reservedQuantity
  FROM availability
  WHERE product_id = ?
  ORDER BY date ASC
`);

const listAvailabilityBetweenStmt = db.prepare(`
  SELECT product_id AS productId, date, reserved_quantity AS reservedQuantity
  FROM availability
  WHERE date BETWEEN ? AND ?
  ORDER BY product_id ASC, date ASC
`);

const deleteAvailabilityForProductStmt = db.prepare('DELETE FROM availability WHERE product_id = ?');

const validatedQuotesInRangeStmt = db.prepare(`
  SELECT id, start_date AS startDate, end_date AS endDate
  FROM quotes
  WHERE status = 'validated' AND NOT (end_date < ? OR start_date > ?)
`);

const quoteItemsStmt = db.prepare(`
  SELECT item_type AS itemType, item_id AS itemId, quantity
  FROM quote_items
  WHERE quote_id = ?
`);

const packItemsStmt = db.prepare(`
  SELECT pack_id AS packId, product_id AS productId, quantity
  FROM pack_items
`);

const availabilityCalendarStmt = db.prepare(`
  SELECT
    a.product_id AS productId,
    p.name AS productName,
    a.date,
    a.reserved_quantity AS reservedQuantity
  FROM availability a
  JOIN products p ON p.id = a.product_id
  WHERE a.date BETWEEN ? AND ?
  ORDER BY p.name ASC, a.date ASC
`);

function enumerateDates(start, end) {
  const dates = [];
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
    return dates;
  }
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function getPackItemsMap() {
  const rows = packItemsStmt.all();
  const map = new Map();
  for (const row of rows) {
    const packId = row.packId;
    if (!map.has(packId)) {
      map.set(packId, []);
    }
    map.get(packId).push({
      productId: row.productId,
      quantity: row.quantity ?? 0,
    });
  }
  return map;
}

function addReservedQuantity(targetMap, productId, date, quantity) {
  if (!productId || quantity <= 0) {
    return;
  }
  const key = `${productId}:${date}`;
  const current = targetMap.get(key) ?? 0;
  targetMap.set(key, current + quantity);
}

function computeReservedFromValidatedQuotes(start, end) {
  const reservedMap = new Map();
  const packItemsMap = getPackItemsMap();
  const quotes = validatedQuotesInRangeStmt.all(start, end);

  for (const quote of quotes) {
    const overlapStart = start > quote.startDate ? start : quote.startDate;
    const overlapEnd = end < quote.endDate ? end : quote.endDate;
    const dates = enumerateDates(overlapStart, overlapEnd);
    if (dates.length === 0) continue;

    const items = quoteItemsStmt.all(quote.id);
    for (const item of items) {
      const quantity = Number(item.quantity ?? 0);
      if (!Number.isFinite(quantity) || quantity <= 0) continue;

      if (item.itemType === 'product') {
        const productId = Number(item.itemId);
        for (const date of dates) {
          addReservedQuantity(reservedMap, productId, date, quantity);
        }
      } else if (item.itemType === 'pack') {
        const packId = Number(item.itemId);
        const packItems = packItemsMap.get(packId) ?? [];
        for (const packItem of packItems) {
          const productQuantity = (packItem.quantity ?? 0) * quantity;
          if (productQuantity <= 0) continue;
          const productId = Number(packItem.productId);
          for (const date of dates) {
            addReservedQuantity(reservedMap, productId, date, productQuantity);
          }
        }
      }
    }
  }

  return reservedMap;
}

export function getAvailabilityCalendar({ start, end }) {
  return availabilityCalendarStmt.all(start, end);
}

export function upsertAvailability(productId, date, reservedQuantity) {
  upsertAvailabilityStmt.run(productId, date, reservedQuantity);
}

export function getAvailability(start, end) {
  const dates = enumerateDates(start, end);
  if (dates.length === 0) {
    const error = new Error('Plage de dates invalide');
    error.status = 400;
    throw error;
  }

  const manualRows = manualAvailabilityRangeStmt.all(start, end);
  const manualMap = new Map();
  for (const row of manualRows) {
    const key = `${row.productId}:${row.date}`;
    manualMap.set(key, row.reservedQuantity ?? 0);
  }

  const quotesReservedMap = computeReservedFromValidatedQuotes(start, end);
  const products = productsStmt.all();
  const results = [];

  for (const product of products) {
    const stock = product.stock ?? 0;
    for (const date of dates) {
      const key = `${product.productId}:${date}`;
      const reservedFromQuotes = quotesReservedMap.get(key) ?? 0;
      const manualReserved = manualMap.get(key) ?? 0;
      const totalReserved = Math.min(stock, reservedFromQuotes + manualReserved);
      results.push({
        productId: product.productId,
        productName: product.productName,
        date,
        stock,
        reservedQuantity: totalReserved,
        reservedFromQuotes,
        manualReservedQuantity: manualReserved,
        availableQuantity: Math.max(stock - totalReserved, 0),
      });
    }
  }

  results.sort((a, b) => {
    if (a.date === b.date) {
      return a.productName.localeCompare(b.productName);
    }
    return a.date.localeCompare(b.date);
  });

  return results;
}

export function updateAvailability(productId, date, reservedQuantity) {
  const product = productByIdStmt.get(productId);
  if (!product) {
    const error = new Error('Produit introuvable');
    error.status = 404;
    throw error;
  }

  const stock = product.stock ?? 0;
  const numericReserved = Number(reservedQuantity ?? 0);
  const clampedReserved = Number.isFinite(numericReserved)
    ? Math.min(Math.max(0, Math.trunc(numericReserved)), stock)
    : 0;

  upsertAvailability(productId, date, clampedReserved);

  const quotesReservedMap = computeReservedFromValidatedQuotes(date, date);
  const reservedFromQuotes = quotesReservedMap.get(`${productId}:${date}`) ?? 0;
  const totalReserved = Math.min(stock, reservedFromQuotes + clampedReserved);

  return {
    productId: product.id,
    productName: product.name,
    date,
    stock,
    reservedQuantity: totalReserved,
    reservedFromQuotes,
    manualReservedQuantity: clampedReserved,
    availableQuantity: Math.max(stock - totalReserved, 0),
  };
}

export function listAvailabilityForProduct(productId) {
  return listAvailabilityForProductStmt.all(productId);
}

export function listAvailabilityBetween(start, end) {
  return listAvailabilityBetweenStmt.all(start, end);
}

export function clearAvailabilityForProduct(productId) {
  deleteAvailabilityForProductStmt.run(productId);
}
