import type { FastifyInstance } from 'fastify'
import { getAllTools, getToolById, updateToolStatus } from '../db/repositories/tools.js'
import { wsManager } from '../services/websocket.js'
import type { ApiResponse, Tool } from '@remote-app/shared'

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
      if (!tool) {
        return reply.code(404).send({ success: false, error: 'Tool not found' })
      }
      return reply.code(200).send({ success: true, data: tool })
    }
  )

  // PUT /api/tools/:id/status — Update tool status
  fastify.put<{ Params: ToolParams; Body: UpdateStatusBody; Reply: ApiResponse<Tool> }>(
    '/api/tools/:id/status',
    async (req, reply) => {
      const { id } = req.params
      const { status } = req.body

      if (!status) {
        return reply.code(400).send({ success: false, error: 'status is required' })
      }

      const validStatuses = ['running', 'idle', 'error', 'offline']
      if (!validStatuses.includes(status)) {
        return reply.code(400).send({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        })
      }

      const tool = getToolById(id)
      if (!tool) {
        return reply.code(404).send({ success: false, error: 'Tool not found' })
      }

      const oldStatus = tool.status
      updateToolStatus(id, status)
      const updated = getToolById(id)!

      // Broadcast WS event
      wsManager.broadcast('tool:status_changed', { toolId: id, oldStatus, newStatus: status })

      return reply.code(200).send({ success: true, data: updated })
    }
  )
}
