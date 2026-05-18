import type { FastifyInstance } from 'fastify'
import type { ApiResponse } from '@remote-app/shared'
import type { NotificationPreferences } from '../services/notifications.js'
import { notificationService } from '../services/index.js'

export async function notificationRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/notifications/settings
  fastify.get<{ Reply: ApiResponse<NotificationPreferences> }>(
    '/api/notifications/settings',
    async (_req, reply) => {
      const prefs = notificationService.getPreferences()
      return reply.code(200).send({ success: true, data: prefs })
    }
  )

  // PUT /api/notifications/settings
  fastify.put<{ Body: Partial<NotificationPreferences>; Reply: ApiResponse<NotificationPreferences> }>(
    '/api/notifications/settings',
    async (req, reply) => {
      await notificationService.setPreferences(req.body)
      const prefs = notificationService.getPreferences()
      return reply.code(200).send({ success: true, data: prefs })
    }
  )

  // POST /api/notifications/test
  fastify.post<{ Reply: ApiResponse<{ sent: boolean }> }>(
    '/api/notifications/test',
    async (_req, reply) => {
      const { telegramService } = await import('../services/index.js')
      if (!telegramService.isConfigured()) {
        return reply.code(400).send({
          success: false,
          error: 'Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env',
        })
      }

      const sent = await telegramService.sendMessage(
        '🤖 *AI Command Center*\n\nTest notification — Telegram is working\\!',
        'Markdown'
      )

      return reply.code(200).send({ success: true, data: { sent } })
    }
  )
}
