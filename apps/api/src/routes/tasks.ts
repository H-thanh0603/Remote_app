import type { FastifyInstance } from 'fastify'
import {
  createTask,
  getTaskById,
  getRecentTasks,
  updateTaskStatus,
} from '../db/repositories/tasks.js'
import { routeTask } from '../services/router.js'
import { wsManager } from '../services/websocket.js'
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
}

export async function taskRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/tasks — Create new task
  fastify.post<{ Body: CreateTaskBody; Reply: ApiResponse<Task & { suggestion: { toolId: string; confidence: number; reason: string } }> }>(
    '/api/tasks',
    async (req, reply) => {
      const { prompt } = req.body

      if (!prompt || prompt.trim().length === 0) {
        return reply.code(400).send({ success: false, error: 'prompt is required' })
      }

      if (prompt.length > 2000) {
        return reply.code(400).send({ success: false, error: 'prompt too long (max 2000 chars)' })
      }

      // Get routing suggestion (LLM-based with keyword fallback)
      const suggestion = await routeTask(prompt.trim())

      // Create task in DB
      const task = createTask(prompt.trim(), suggestion.toolId)

      // Broadcast WS events
      wsManager.broadcast('task:created', { task })
      wsManager.broadcast('task:routing_suggested', { taskId: task.id, suggestion })

      return reply.code(201).send({
        success: true,
        data: {
          ...task,
          suggestion,
        },
      })
    }
  )

  // GET /api/tasks — List recent tasks
  fastify.get<{ Querystring: ListTasksQuery; Reply: ApiResponse<Task[]> }>(
    '/api/tasks',
    async (req, reply) => {
      const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100)
      if (isNaN(limit) || limit < 1) {
        return reply.code(400).send({ success: false, error: 'Invalid limit' })
      }
      const tasks = getRecentTasks(limit)
      return reply.code(200).send({ success: true, data: tasks })
    }
  )

  // GET /api/tasks/:id — Get task details
  fastify.get<{ Params: TaskParams; Reply: ApiResponse<Task> }>(
    '/api/tasks/:id',
    async (req, reply) => {
      const task = getTaskById(req.params.id)
      if (!task) {
        return reply.code(404).send({ success: false, error: 'Task not found' })
      }
      return reply.code(200).send({ success: true, data: task })
    }
  )

  // PUT /api/tasks/:id/confirm — Confirm tool choice
  fastify.put<{ Params: TaskParams; Body: ConfirmTaskBody; Reply: ApiResponse<Task> }>(
    '/api/tasks/:id/confirm',
    async (req, reply) => {
      const { id } = req.params
      const { toolId } = req.body

      if (!toolId) {
        return reply.code(400).send({ success: false, error: 'toolId is required' })
      }

      const task = getTaskById(id)
      if (!task) {
        return reply.code(404).send({ success: false, error: 'Task not found' })
      }

      if (task.status === 'cancelled') {
        return reply.code(400).send({ success: false, error: 'Cannot confirm a cancelled task' })
      }

      updateTaskStatus(id, 'confirmed')

      // Update confirmed_tool in DB
      const { getDb } = await import('../db/index.js')
      const db = getDb()
      db.prepare('UPDATE tasks SET confirmed_tool = ? WHERE id = ?').run(toolId, id)

      const updated = getTaskById(id)!

      // Broadcast WS event
      wsManager.broadcast('task:confirmed', { taskId: id, toolId })

      return reply.code(200).send({ success: true, data: updated })
    }
  )

  // PUT /api/tasks/:id/cancel — Cancel task
  fastify.put<{ Params: TaskParams; Reply: ApiResponse<Task> }>(
    '/api/tasks/:id/cancel',
    async (req, reply) => {
      const { id } = req.params
      const task = getTaskById(id)

      if (!task) {
        return reply.code(404).send({ success: false, error: 'Task not found' })
      }

      if (['completed', 'failed'].includes(task.status)) {
        return reply.code(400).send({ success: false, error: 'Cannot cancel a completed or failed task' })
      }

      updateTaskStatus(id, 'cancelled')
      const updated = getTaskById(id)!

      // Broadcast WS event
      wsManager.broadcast('task:failed', { taskId: id, error: 'Task cancelled by user' })

      return reply.code(200).send({ success: true, data: updated })
    }
  )
}
