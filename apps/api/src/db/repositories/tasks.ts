import { getDb } from '../index.js'
import type { Task } from '@remote-app/shared'

export interface TaskFilters {
  limit?: number
  offset?: number
  status?: string
  tool?: string
  search?: string
  from?: string
  to?: string
  sort?: 'asc' | 'desc'
}

export interface TaskSearchResult {
  tasks: Task[]
  total: number
}

export function createTask(prompt: string, suggestedTool: string): Task {
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO tasks (id, prompt, suggested_tool, status, created_at)
    VALUES (?, ?, ?, 'pending', ?)
  `).run(id, prompt, suggestedTool, now)

  return getTaskById(id)!
}

export function getTaskById(id: string): Task | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? parseTaskRow(row) : null
}

export function updateTaskStatus(id: string, status: string, result?: string, error?: string): void {
  const db = getDb()
  const completedAt = ['completed', 'failed'].includes(status) ? new Date().toISOString() : null

  db.prepare(`
    UPDATE tasks SET
      status = ?,
      result = COALESCE(?, result),
      error = COALESCE(?, error),
      completed_at = COALESCE(?, completed_at)
    WHERE id = ?
  `).run(status, result ?? null, error ?? null, completedAt, id)
}

export function getRecentTasks(limit: number): Task[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?
  `).all(limit) as Record<string, unknown>[]
  return rows.map(parseTaskRow)
}

export function searchTasks(filters: TaskFilters): TaskSearchResult {
  const db = getDb()
  const {
    limit = 20,
    offset = 0,
    status,
    tool,
    search,
    from,
    to,
    sort = 'desc',
  } = filters

  const clampedLimit = Math.min(limit, 100)
  const conditions: string[] = []
  const params: unknown[] = []

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }
  if (tool) {
    conditions.push('(suggested_tool = ? OR confirmed_tool = ?)')
    params.push(tool, tool)
  }
  if (search) {
    conditions.push('(prompt LIKE ? OR result LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }
  if (from) {
    conditions.push('created_at >= ?')
    params.push(from)
  }
  if (to) {
    conditions.push('created_at <= ?')
    params.push(to)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const order = sort === 'asc' ? 'ASC' : 'DESC'

  const total = (db.prepare(`SELECT COUNT(*) as count FROM tasks ${where}`).get(...params) as { count: number }).count

  const rows = db.prepare(`
    SELECT * FROM tasks ${where}
    ORDER BY created_at ${order}
    LIMIT ? OFFSET ?
  `).all(...params, clampedLimit, offset) as Record<string, unknown>[]

  return { tasks: rows.map(parseTaskRow), total }
}

export function getTaskStats(): {
  total: number
  completed: number
  failed: number
  running: number
  byTool: Record<string, number>
  avgDuration: number
} {
  const db = getDb()

  const total = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }).count
  const completed = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get() as { count: number }).count
  const failed = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'failed'").get() as { count: number }).count
  const running = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'running'").get() as { count: number }).count

  const toolRows = db.prepare(`
    SELECT COALESCE(confirmed_tool, suggested_tool) as tool, COUNT(*) as count
    FROM tasks
    WHERE COALESCE(confirmed_tool, suggested_tool) IS NOT NULL
    GROUP BY tool
  `).all() as { tool: string; count: number }[]

  const byTool: Record<string, number> = {}
  for (const row of toolRows) {
    if (row.tool) byTool[row.tool] = row.count
  }

  const avgRow = db.prepare("SELECT AVG(duration_ms) as avg FROM tasks WHERE status = 'completed' AND duration_ms > 0").get() as { avg: number | null }
  const avgDuration = Math.round(avgRow.avg ?? 0)

  return { total, completed, failed, running, byTool, avgDuration }
}

function parseTaskRow(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    prompt: row.prompt as string,
    suggestedTool: row.suggested_tool as string | undefined,
    confirmedTool: row.confirmed_tool as string | undefined,
    status: row.status as Task['status'],
    result: row.result as string | undefined,
    error: row.error as string | undefined,
    tokensUsed: row.tokens_used as number,
    durationMs: row.duration_ms as number,
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string | undefined,
  }
}
