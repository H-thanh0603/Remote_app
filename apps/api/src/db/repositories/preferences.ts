import { getDb } from '../index.js'

export function getPreference(key: string): string | null {
  const db = getDb()
  const row = db.prepare('SELECT value FROM user_preferences WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setPreference(key: string, value: string): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO user_preferences (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(key, value)
}
