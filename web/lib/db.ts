import Database from "better-sqlite3";

const DB_PATH = process.env.SQLITE_PATH ?? "/data/app.db";

let db: Database.Database | null = null;

export function getDb() {
  if (!db) db = new Database(DB_PATH, { readonly: true });
  return db;
}