import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { CREATE_TABLES_SQL } from './schema.js'

const DB_PATH = path.join(process.cwd(), 'data', 'app.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.')
  }
  return db
}

export function initDb(): Database.Database {
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  db = new Database(DB_PATH)

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Create tables
  db.exec(CREATE_TABLES_SQL)

  console.log(`✅ Database initialized at ${DB_PATH}`)
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
