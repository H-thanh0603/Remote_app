import { getDb } from '../index.js'
import type { Task } from '@remote-app/shared'

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
