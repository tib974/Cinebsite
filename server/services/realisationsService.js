import fs from 'node:fs';
import path from 'node:path';

let cachedRealisations = null;
let cachedMtimeMs = 0;

function getDataFilePath() {
  if (process.env.REALISATIONS_DATA_PATH) {
    return path.resolve(process.env.REALISATIONS_DATA_PATH);
  }
  const baseDir = process.env.SQLITE_DIR
    ? path.resolve(process.env.SQLITE_DIR)
    : path.resolve(process.cwd(), 'data');
  return path.join(baseDir, 'realisations.csv');
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);

  return values.map((value) => value.replace(/\r/g, ''));
}

function parseCsv(content) {
  const lines = content
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const records = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    const values = parseCsvLine(line);
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = values[index] ?? '';
    });
    records.push(entry);
  }

  return records;
}

function normalizeRecord(record) {
  const slug = (record.slug || '').trim();
  const imagePath = (record.image || '').trim();
  const imageUrl = imagePath ? `/${imagePath.replace(/^\/+/g, '')}` : null;
  const description = (record.description || '').trim();
  const customer = (record.tags || record.customer || '').trim();
  const url = (record.url || '').trim();
  const date = (record.date || '').trim();
  const featuredRaw = String(record.featured || record.Featured || '').toLowerCase();

  return {
    id: slug || null,
    slug,
    title: (record.title || '').trim(),
    customer: customer || null,
    url: url || null,
    date: date || null,
    description,
    featured: featuredRaw === 'true' || featuredRaw === '1' || featuredRaw === 'yes',
    imageUrl,
  };
}

function loadRealisationsFromDisk() {
  const filePath = getDataFilePath();
  const stats = fs.statSync(filePath);

  if (cachedRealisations && cachedMtimeMs === stats.mtimeMs) {
    return cachedRealisations;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const records = parseCsv(content);
  cachedRealisations = records.map(normalizeRecord);
  cachedMtimeMs = stats.mtimeMs;
  return cachedRealisations;
}

export function listRealisations() {
  return loadRealisationsFromDisk().slice();
}

export function getRealisationBySlug(slug) {
  if (!slug) return null;
  const normalized = slug.toString().trim().toLowerCase();
  const items = loadRealisationsFromDisk();
  return items.find((item) => item.slug.toLowerCase() === normalized) || null;
}
