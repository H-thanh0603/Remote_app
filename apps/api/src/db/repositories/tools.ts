import { getDb } from '../index.js'
import type { Tool } from '@remote-app/shared'

export function getAllTools(): Tool[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM tools ORDER BY name ASC').all() as Record<string, unknown>[]
  return rows.map(parseToolRow)
}

export function getToolById(id: string): Tool | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM tools WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? parseToolRow(row) : null
}

export function upsertTool(tool: Partial<Tool> & { id: string; name: string; type: string }): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO tools (id, name, type, status, description, config, last_seen_at)
    VALUES (@id, @name, @type, @status, @description, @config, @last_seen_at)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      type = excluded.type,
      status = excluded.status,
      description = excluded.description,
      config = excluded.config,
      last_seen_at = excluded.last_seen_at
  `).run({
    id: tool.id,
    name: tool.name,
    type: tool.type,
    status: tool.status ?? 'offline',
    description: tool.description ?? null,
    config: tool.config ? JSON.stringify(tool.config) : null,
    last_seen_at: tool.lastSeenAt ?? null,
  })
}

export function updateToolStatus(id: string, status: string): void {
  const db = getDb()
  db.prepare(`
    UPDATE tools SET status = ?, last_seen_at = datetime('now') WHERE id = ?
  `).run(status, id)
}

function parseToolRow(row: Record<string, unknown>): Tool {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    status: row.status as string,
    description: row.description as string | undefined,
    config: row.config ? JSON.parse(row.config as string) : undefined,
    lastSeenAt: row.last_seen_at as string | undefined,
    createdAt: row.created_at as string,
  }
}
