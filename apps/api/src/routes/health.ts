import type { FastifyInstance } from 'fastify'
import { getDb } from '../db/index.js'
import type { ApiResponse } from '@remote-app/shared'

interface HealthData {
  status: string
  uptime: number
  version: string
  dbStatus: string
}

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Reply: ApiResponse<HealthData> }>('/api/health', async (_req, reply) => {
    let dbStatus = 'ok'
    try {
      const db = getDb()
      db.prepare('SELECT 1').get()
    } catch {
      dbStatus = 'error'
    }

    return reply.code(200).send({
      success: true,
      data: {
        status: 'ok',
        uptime: process.uptime(),
        version: '1.0.0',
        dbStatus,
      },
    })
  })
}
