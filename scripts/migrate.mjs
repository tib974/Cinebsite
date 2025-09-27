#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import db from '../server/db/db.js';
import logger from '../server/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.resolve(__dirname, '..', 'server', 'db', 'migrations');

if (!fs.existsSync(migrationsDir)) {
  logger.warn({ migrationsDir }, 'Répertoire des migrations introuvable.');
  process.exit(0);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const listAppliedStmt = db.prepare('SELECT name FROM migrations ORDER BY name ASC');
const appliedMigrations = new Set(listAppliedStmt.all().map((row) => row.name));

const insertMigrationStmt = db.prepare('INSERT INTO migrations (name) VALUES (?)');

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b));

const runMigration = db.transaction((name, sql) => {
  db.exec(sql);
  insertMigrationStmt.run(name);
});

let appliedCount = 0;

for (const fileName of migrationFiles) {
  if (appliedMigrations.has(fileName)) {
    logger.debug({ fileName }, 'Migration déjà appliquée, saut.');
    continue;
  }

  const filePath = path.join(migrationsDir, fileName);
  const sql = fs.readFileSync(filePath, 'utf8');
  logger.info({ fileName }, 'Application de la migration');
  try {
    runMigration(fileName, sql);
    appliedCount += 1;
  } catch (error) {
    logger.error({ fileName, error }, 'Échec de la migration');
    process.exitCode = 1;
    throw error;
  }
}

if (appliedCount === 0) {
  logger.info('Aucune nouvelle migration à appliquer.');
} else {
  logger.info({ appliedCount }, 'Migrations appliquées avec succès.');
}
