import { z } from 'zod';

import db from '../db/db.js';

const quoteItemSchema = z.object({
  itemType: z.enum(['product', 'pack']),
  itemId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  unitPrice: z.coerce.number().nonnegative().default(0),
  quantity: z.coerce.number().int().min(1).default(1),
});

const quoteSchema = z.object({
  customerName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  startDate: z.string().regex(/\d{4}-\d{2}-\d{2}/, 'Format AAAA-MM-JJ'),
  endDate: z.string().regex(/\d{4}-\d{2}-\d{2}/, 'Format AAAA-MM-JJ'),
  status: z.enum(['pending', 'validated', 'archived']).default('pending'),
  notes: z.string().optional().nullable(),
  items: z.array(quoteItemSchema).default([]),
});

const quotesBaseQuery = `
  SELECT id,
         customer_name AS customerName,
         email,
         phone,
         start_date AS startDate,
         end_date AS endDate,
         status,
         total,
         notes,
         created_at AS createdAt,
         updated_at AS updatedAt
  FROM quotes
`;

const quoteItemsStmt = db.prepare(`
  SELECT id,
         item_type AS itemType,
         item_id AS itemId,
         name,
         unit_price AS unitPrice,
         quantity
  FROM quote_items
  WHERE quote_id = ?
  ORDER BY id ASC
`);

const insertQuoteStmt = db.prepare(`
  INSERT INTO quotes (customer_name, email, phone, start_date, end_date, status, total, notes)
  VALUES (@customerName, @email, @phone, @startDate, @endDate, @status, @total, @notes)
  RETURNING id
`);

const updateQuoteStmt = db.prepare(`
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

const deleteQuoteStmt = db.prepare('DELETE FROM quotes WHERE id = ?');

const deleteQuoteItemsStmt = db.prepare('DELETE FROM quote_items WHERE quote_id = ?');

const insertQuoteItemStmt = db.prepare(`
  INSERT INTO quote_items (quote_id, item_type, item_id, name, unit_price, quantity)
  VALUES (@quoteId, @itemType, @itemId, @name, @unitPrice, @quantity)
`);

function computeTotal(items) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

function loadQuoteItems(quoteId) {
  return quoteItemsStmt.all(quoteId);
}

function hydrateQuote(row) {
  if (!row) return null;
  const items = loadQuoteItems(row.id);
  const totalFromItems = computeTotal(items);
  return {
    ...row,
    total: Number.isFinite(totalFromItems) ? totalFromItems : row.total ?? 0,
    items,
  };
}

export function getQuotes({ status = null } = {}) {
  if (status) {
    const stmt = db.prepare(`${quotesBaseQuery} WHERE status = ? ORDER BY created_at DESC`);
    return stmt.all(status).map(hydrateQuote);
  }
  const stmt = db.prepare(`${quotesBaseQuery} ORDER BY created_at DESC`);
  return stmt.all().map(hydrateQuote);
}

export function getQuoteById(id) {
  const stmt = db.prepare(`${quotesBaseQuery} WHERE id = ?`);
  const quote = stmt.get(id);
  return hydrateQuote(quote);
}

function saveQuoteItems(quoteId, items) {
  deleteQuoteItemsStmt.run(quoteId);
  if (!items.length) return;
  const runMany = db.transaction((rows) => {
    for (const row of rows) {
      insertQuoteItemStmt.run({ quoteId, ...row });
    }
  });
  runMany(items);
}

export function createQuote(payload) {
  const parsed = quoteSchema.parse(payload);
  const items = parsed.items.map((item) => ({
    itemType: item.itemType,
    itemId: Number(item.itemId),
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));
  const total = computeTotal(items);

  const inserted = insertQuoteStmt.get({
    customerName: parsed.customerName,
    email: parsed.email,
    phone: parsed.phone ?? null,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    status: parsed.status,
    notes: parsed.notes ?? null,
    total,
  });

  saveQuoteItems(inserted.id, items);
  return getQuoteById(inserted.id);
}

export function updateQuote(id, payload) {
  const parsed = quoteSchema.parse(payload);
  const existing = getQuoteById(id);
  if (!existing) {
    const error = new Error('Demande introuvable');
    error.status = 404;
    throw error;
  }

  const items = parsed.items.map((item) => ({
    itemType: item.itemType,
    itemId: Number(item.itemId),
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));
  const total = computeTotal(items);

  updateQuoteStmt.run({
    id,
    customerName: parsed.customerName,
    email: parsed.email,
    phone: parsed.phone ?? null,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    status: parsed.status,
    notes: parsed.notes ?? null,
    total,
  });

  saveQuoteItems(id, items);
  return getQuoteById(id);
}

export function updateQuoteStatus(id, status) {
  const existing = getQuoteById(id);
  if (!existing) {
    const error = new Error('Demande introuvable');
    error.status = 404;
    throw error;
  }

  const schema = z.object({ status: z.enum(['pending', 'validated', 'archived']) });
  const parsed = schema.parse({ status });

  updateQuoteStmt.run({
    id,
    customerName: existing.customerName,
    email: existing.email,
    phone: existing.phone,
    startDate: existing.startDate,
    endDate: existing.endDate,
    status: parsed.status,
    notes: existing.notes,
    total: computeTotal(existing.items ?? []),
  });

  return getQuoteById(id);
}

export function deleteQuote(id) {
  deleteQuoteStmt.run(id);
}

export function removeQuoteItems(quoteId) {
  deleteQuoteItemsStmt.run(quoteId);
}

export function setQuoteItems(quoteId, items) {
  saveQuoteItems(quoteId, items);
  return getQuoteById(quoteId);
}

export { quoteSchema, quoteItemSchema };
