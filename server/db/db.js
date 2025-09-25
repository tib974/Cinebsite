import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

import logger from '../utils/logger.js';

const dbDir = process.env.SQLITE_DIR
  ? path.resolve(process.env.SQLITE_DIR)
  : path.resolve(process.cwd(), 'data');
const dbFile = process.env.SQLITE_FILE || 'app.sqlite';
const dbPath = path.join(dbDir, dbFile);

fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' ? console.debug : undefined });

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

logger.info({ dbPath }, 'Base SQLite initialisée');

export default db;
