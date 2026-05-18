import type { FastifyInstance } from 'fastify'
import { getAllTools, getToolById, updateToolStatus, getToolStats } from '../db/repositories/tools.js'
import { wsManager } from '../services/websocket.js'
import { notificationService } from '../services/index.js'
import { executionManager } from '../services/execution-manager.js'
import type { ApiResponse, Tool } from '@remote-app/shared'
import { Errors } from '../utils/errors.js'

interface UpdateStatusBody {
  status: string
}

interface ToolParams {
  id: string
}

export async function toolRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/tools — List all tools
  fastify.get<{ Reply: ApiResponse<Tool[]> }>('/api/tools', async (_req, reply) => {
    const tools = getAllTools()
    return reply.code(200).send({ success: true, data: tools })
  })

  // GET /api/tools/:id — Get single tool
  fastify.get<{ Params: ToolParams; Reply: ApiResponse<Tool> }>(
    '/api/tools/:id',
    async (req, reply) => {
      const tool = getToolById(req.params.id)
      if (!tool) throw Errors.NOT_FOUND('Tool not found')
      return reply.code(200).send({ success: true, data: tool })
    }
  )

  // PUT /api/tools/:id/status — Update tool status
  fastify.put<{ Params: ToolParams; Body: UpdateStatusBody; Reply: ApiResponse<Tool> }>(
    '/api/tools/:id/status',
    async (req, reply) => {
      const { id } = req.params
      const { status } = req.body

      if (!status) throw Errors.VALIDATION_ERROR('status is required')

      const validStatuses = ['running', 'idle', 'error', 'offline']
      if (!validStatuses.includes(status)) {
        throw Errors.VALIDATION_ERROR(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
      }

      const tool = getToolById(id)
      if (!tool) throw Errors.NOT_FOUND('Tool not found')

      const oldStatus = tool.status
      updateToolStatus(id, status)
      const updated = getToolById(id)!

      // Broadcast WS event
      wsManager.broadcast('tool:status_changed', { toolId: id, oldStatus, newStatus: status })

      // Notify tool status change
      if (status === 'error') {
        notificationService.notify('tool:error', { tool: updated, oldStatus, newStatus: status }).catch(() => {})
      } else {
        notificationService.notify('tool:status_changed', { tool: updated, oldStatus, newStatus: status }).catch(() => {})
      }

      return reply.code(200).send({ success: true, data: updated })
    }
  )

  // GET /api/tools/:id/stats — Get tool stats
  fastify.get<{ Params: ToolParams }>(
    '/api/tools/:id/stats',
    async (req, reply) => {
      const tool = getToolById(req.params.id)
      if (!tool) throw Errors.NOT_FOUND('Tool not found')
      const stats = getToolStats(req.params.id)
      return reply.code(200).send({ success: true, data: stats })
    }
  )

  // GET /api/tools/:id/health — Check tool executor health
  fastify.get<{ Params: ToolParams; Reply: ApiResponse<{ healthy: boolean }> }>(
    '/api/tools/:id/health',
    async (req, reply) => {
      const { id } = req.params
      const tool = getToolById(id)
      if (!tool) throw Errors.NOT_FOUND('Tool not found')
      const healthResults = await executionManager.checkAllHealth()
      const healthy = healthResults[id] ?? false
      const newStatus = healthy ? 'idle' : 'offline'
      if (tool.status !== 'running') {
        updateToolStatus(id, newStatus)
        wsManager.broadcast('tool:status_changed', { toolId: id, oldStatus: tool.status, newStatus })
      }
      return reply.code(200).send({ success: true, data: { healthy } })
    }
  )
}
