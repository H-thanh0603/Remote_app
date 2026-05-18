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

export function getToolStats(toolId: string) {
  const db = getDb()

  const totalTasks = (db.prepare('SELECT COUNT(*) as count FROM tasks WHERE tool_id = ?').get(toolId) as any)?.count ?? 0
  const completedTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE tool_id = ? AND status = 'completed'").get(toolId) as any)?.count ?? 0
  const failedTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE tool_id = ? AND status = 'failed'").get(toolId) as any)?.count ?? 0
  const successRate = totalTasks > 0 ? completedTasks / totalTasks : 0

  const avgDurationRow = db.prepare("SELECT AVG(duration_ms) as avg FROM tasks WHERE tool_id = ? AND status = 'completed' AND duration_ms IS NOT NULL").get(toolId) as any
  const avgDuration = avgDurationRow?.avg ?? 0

  const totalTokensRow = db.prepare('SELECT SUM(tokens_used) as total FROM tasks WHERE tool_id = ? AND tokens_used IS NOT NULL').get(toolId) as any
  const totalTokens = totalTokensRow?.total ?? 0

  const recentTasks = db.prepare('SELECT * FROM tasks WHERE tool_id = ? ORDER BY created_at DESC LIMIT 10').all(toolId) as any[]

  // Last 7 days usage
  const usageByDay = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM tasks
    WHERE tool_id = ? AND created_at >= date('now', '-6 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all(toolId) as { date: string; count: number }[]

  // Fill missing days
  const filledUsage: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const found = usageByDay.find(u => u.date === dateStr)
    filledUsage.push({ date: dateStr, count: found?.count ?? 0 })
  }

  return {
    totalTasks,
    completedTasks,
    failedTasks,
    successRate,
    avgDuration,
    totalTokens,
    recentTasks: recentTasks.map(t => ({
      id: t.id,
      prompt: t.prompt,
      status: t.status,
      createdAt: t.created_at,
    })),
    usageByDay: filledUsage,
  }
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
