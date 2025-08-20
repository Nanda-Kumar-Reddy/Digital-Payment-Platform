import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');
const dbPath = process.env.DATABASE_PATH || path.join(root, 'database/app.db');

export const db = new Database(dbPath, { fileMustExist: false });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function runSchemaIfNeeded() {
  const schemaFile = path.join(root, 'database/schema.sql');
  const seedsFile = path.join(root, 'database/seeds.sql');
  const hasUsers = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  if (!hasUsers) {
    if (!fs.existsSync(schemaFile)) {
      console.error('Missing schema.sql in database/');
      process.exit(1);
    }
    const sql = fs.readFileSync(schemaFile, 'utf8');
    db.exec(sql);
    if (fs.existsSync(seedsFile)) {
      db.exec(fs.readFileSync(seedsFile, 'utf8'));
    }
    console.log('Database initialized with schema and seeds.');
  }
}
