import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initSchema } from './schema';
import { CONFIG } from '../config';

let db: Database.Database | null = null;

export function getDb(dbPath?: string): Database.Database {
  if (db) return db;

  const effectivePath = dbPath || CONFIG.DB_PATH;

  if (!dbPath) {
    const dir = path.dirname(effectivePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  db = new Database(effectivePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/** Convenience wrapper called by index.ts at startup */
export function initDb(dbPath?: string): void {
  getDb(dbPath);
}
