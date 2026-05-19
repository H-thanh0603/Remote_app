import type { FastifyInstance } from 'fastify'
import { Errors } from '../utils/errors.js'
import { getBrain, resetBrain } from '../services/brain/index.js'
import type { BrainResponse } from '../services/brain/types.js'
import type { ApiResponse } from '@remote-app/shared'

interface ChatBody {
  message: string
  resetContext?: boolean
}

interface BrainStatusResponse {
  sessionId: string
  messageCount: number
  recentMessages: Array<{ role: string; content: string; timestamp: number }>
}

export async function brainRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/brain/chat — Main brain endpoint
  fastify.post<{ Body: ChatBody; Reply: ApiResponse<BrainResponse> }>(
    '/api/brain/chat',
    async (req, reply) => {
      const { message, resetContext: shouldReset } = req.body

      if (!message || message.trim().length === 0) {
        throw Errors.VALIDATION_ERROR('message is required')
      }
      if (message.length > 5000) {
        throw Errors.VALIDATION_ERROR('message too long (max 5000 chars)')
      }

      const brain = getBrain()

      // Reset context if requested
      if (shouldReset) {
        brain.resetContext()
      }

      const response = await brain.think(message.trim())

      return reply.code(200).send({ success: true, data: response })
    }
  )

  // GET /api/brain/status — Brain session info
  fastify.get<{ Reply: ApiResponse<BrainStatusResponse> }>(
    '/api/brain/status',
    async (_req, reply) => {
      const brain = getBrain()
      const ctx = brain.getContext()

      return reply.code(200).send({
        success: true,
        data: {
          sessionId: brain.getSessionId(),
          messageCount: ctx.getMessageCount(),
          recentMessages: ctx.getRecentContext(5).map(m => ({
            role: m.role,
            content: m.content.slice(0, 200),
            timestamp: m.timestamp,
          })),
        },
      })
    }
  )

  // POST /api/brain/reset — Reset brain context
  fastify.post<{ Reply: ApiResponse<{ sessionId: string }> }>(
    '/api/brain/reset',
    async (_req, reply) => {
      const brain = resetBrain()
      return reply.code(200).send({
        success: true,
        data: { sessionId: brain.getSessionId() },
      })
    }
  )
}
