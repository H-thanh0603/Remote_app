import type { FastifyInstance } from 'fastify'
import { Errors } from '../utils/errors.js'
import {
  createTask,
  getTaskById,
  getRecentTasks,
  searchTasks,
  getTaskStats,
  updateTaskStatus,
} from '../db/repositories/tasks.js'
import { getToolById } from '../db/repositories/tools.js'
import { routeTask } from '../services/router.js'
import { wsManager } from '../services/websocket.js'
import { notificationService } from '../services/index.js'
import { executionManager } from '../services/execution-manager.js'
import type { ApiResponse, Task } from '@remote-app/shared'

interface CreateTaskBody {
  prompt: string
}

interface ConfirmTaskBody {
  toolId: string
}

interface TaskParams {
  id: string
}

interface ListTasksQuery {
  limit?: string
  offset?: string
  status?: string
  tool?: string
  search?: string
  from?: string
  to?: string
  sort?: string
}

export async function taskRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/tasks — Create new task
  fastify.post<{ Body: CreateTaskBody; Reply: ApiResponse<Task & { suggestion: { toolId: string; confidence: number; reason: string }; autoConfirmed?: boolean }> }>(
    '/api/tasks',
    async (req, reply) => {
      const { prompt } = req.body

      if (!prompt || prompt.trim().length === 0) throw Errors.VALIDATION_ERROR('prompt is required')
      if (prompt.length > 2000) throw Errors.VALIDATION_ERROR('prompt too long (max 2000 chars)')

      // Get routing suggestion (LLM-based with keyword fallback)
      const suggestion = await routeTask(prompt.trim())

      // Create task in DB
      const task = createTask(prompt.trim(), suggestion.toolId)

      // Check auto-confirm preference
      const { getPreferencesInstance } = await import('../routes/preferences.js')
      const prefs = getPreferencesInstance()
      const shouldAutoConfirm = prefs.autoConfirm && suggestion.confidence >= prefs.autoConfirmThreshold

      // Broadcast WS events
      wsManager.broadcast('task:created', { task })
      wsManager.broadcast('task:routing_suggested', { taskId: task.id, suggestion })

      if (shouldAutoConfirm) {
        // Auto-confirm: update status and trigger execution
        updateTaskStatus(task.id, 'confirmed')
        const db = (await import('../db/index.js')).getDb()
        db.prepare('UPDATE tasks SET confirmed_tool = ? WHERE id = ?').run(suggestion.toolId, task.id)
        wsManager.broadcast('task:confirmed', { taskId: task.id, toolId: suggestion.toolId, autoConfirmed: true })
        setImmediate(() => {
          executionManager.executeTask(task.id).catch((err) => {
            console.error(`[execution] Auto-confirmed task ${task.id} failed:`, err)
          })
        })
      }

      return reply.code(201).send({
        success: true,
        data: {
          ...task,
          suggestion,
          autoConfirmed: shouldAutoConfirm,
        },
      })
    }
  )

  // GET /api/tasks/stats
  fastify.get<{ Reply: ApiResponse<ReturnType<typeof getTaskStats>> }>(
    '/api/tasks/stats',
    async (_req, reply) => {
      const stats = getTaskStats()
      return reply.code(200).send({ success: true, data: stats })
    }
  )

  // GET /api/tasks — List/search tasks
  fastify.get<{ Querystring: ListTasksQuery; Reply: ApiResponse<{ tasks: Task[]; total: number }> }>(
    '/api/tasks',
    async (req, reply) => {
      const { limit, offset, status, tool, search, from, to, sort } = req.query
      const parsedLimit = Math.min(parseInt(limit ?? '20', 10), 100)
      const parsedOffset = parseInt(offset ?? '0', 10)
      if (isNaN(parsedLimit) || parsedLimit < 1) throw Errors.VALIDATION_ERROR('Invalid limit')
      if (isNaN(parsedOffset) || parsedOffset < 0) throw Errors.VALIDATION_ERROR('Invalid offset')
      if (sort && !['asc', 'desc'].includes(sort)) throw Errors.VALIDATION_ERROR('sort must be asc or desc')

      const result = searchTasks({
        limit: parsedLimit,
        offset: parsedOffset,
        status,
        tool,
        search,
        from,
        to,
        sort: sort as 'asc' | 'desc' | undefined,
      })
      return reply.code(200).send({ success: true, data: result })
    }
  )

  // GET /api/tasks/:id — Get task details
  fastify.get<{ Params: TaskParams; Reply: ApiResponse<Task> }>(
    '/api/tasks/:id',
    async (req, reply) => {
      const task = getTaskById(req.params.id)
      if (!task) throw Errors.NOT_FOUND('Task not found')
      return reply.code(200).send({ success: true, data: task })
    }
  )

  // PUT /api/tasks/:id/confirm — Confirm tool choice
  fastify.put<{ Params: TaskParams; Body: ConfirmTaskBody; Reply: ApiResponse<Task> }>(
    '/api/tasks/:id/confirm',
    async (req, reply) => {
      const { id } = req.params
      const { toolId } = req.body

      if (!toolId) throw Errors.VALIDATION_ERROR('toolId is required')

      const task = getTaskById(id)
      if (!task) throw Errors.NOT_FOUND('Task not found')

      if (task.status === 'cancelled') throw Errors.VALIDATION_ERROR('Cannot confirm a cancelled task')

      updateTaskStatus(id, 'confirmed')

      // Update confirmed_tool in DB
      const { getDb } = await import('../db/index.js')
      const db = getDb()
      db.prepare('UPDATE tasks SET confirmed_tool = ? WHERE id = ?').run(toolId, id)

      const updated = getTaskById(id)!

      // Broadcast WS event
      wsManager.broadcast('task:confirmed', { taskId: id, toolId })

      // Execute async — don't await, return immediately
      setImmediate(() => {
        executionManager.executeTask(id).catch((err) => {
          console.error(`[execution] Task ${id} failed:`, err)
        })
      })

      return reply.code(200).send({ success: true, data: updated })
    }
  )

  // PUT /api/tasks/:id/cancel — Cancel task
  fastify.put<{ Params: TaskParams; Reply: ApiResponse<Task> }>(
    '/api/tasks/:id/cancel',
    async (req, reply) => {
      const { id } = req.params
      const task = getTaskById(id)

      if (!task) throw Errors.NOT_FOUND('Task not found')

      if (['completed', 'failed'].includes(task.status)) {
        throw Errors.VALIDATION_ERROR('Cannot cancel a completed or failed task')
      }

      updateTaskStatus(id, 'cancelled')
      const updated = getTaskById(id)!

      // Broadcast WS event
      wsManager.broadcast('task:failed', { taskId: id, error: 'Task cancelled by user' })

      // Notify task failed
      notificationService.notify('task:failed', { task: updated, error: 'Task cancelled by user' }).catch(() => {})

      return reply.code(200).send({ success: true, data: updated })
    }
  )
}
