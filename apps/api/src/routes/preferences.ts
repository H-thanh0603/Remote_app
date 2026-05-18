import type { FastifyInstance } from 'fastify'
import { Errors } from '../utils/errors.js'
import { getDb } from '../db/index.js'
import type { ApiResponse } from '@remote-app/shared'

export interface UserPreferences {
  // Routing
  defaultTool: string | null
  autoConfirm: boolean
  autoConfirmThreshold: number

  // Display
  theme: 'dark' | 'light'
  language: 'en' | 'vi'
  showTokenUsage: boolean
  showDuration: boolean

  // Notifications
  telegramEnabled: boolean
  notifyOnComplete: boolean
  notifyOnFail: boolean
  notifyOnToolError: boolean

  // History
  historyRetentionDays: number
  autoDeleteOldTasks: boolean
}

const DEFAULTS: UserPreferences = {
  defaultTool: null,
  autoConfirm: false,
  autoConfirmThreshold: 0.9,
  theme: 'dark',
  language: 'vi',
  showTokenUsage: true,
  showDuration: true,
  telegramEnabled: false,
  notifyOnComplete: true,
  notifyOnFail: true,
  notifyOnToolError: true,
  historyRetentionDays: 30,
  autoDeleteOldTasks: false,
}

function getPreferences(): UserPreferences {
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM user_preferences').all() as { key: string; value: string }[]
  const prefs = { ...DEFAULTS }
  for (const row of rows) {
    const key = row.key as keyof UserPreferences
    if (key in DEFAULTS) {
      const defaultVal = DEFAULTS[key]
      if (typeof defaultVal === 'boolean') {
        (prefs as Record<string, unknown>)[key] = row.value === 'true'
      } else if (typeof defaultVal === 'number') {
        (prefs as Record<string, unknown>)[key] = parseFloat(row.value)
      } else {
        (prefs as Record<string, unknown>)[key] = row.value === 'null' ? null : row.value
      }
    }
  }
  return prefs
}

function setPreference(key: string, value: unknown): void {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO user_preferences (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, String(value), now)
}

function resetPreferences(): void {
  const db = getDb()
  db.prepare('DELETE FROM user_preferences').run()
}

export function getPreferencesInstance(): UserPreferences {
  return getPreferences()
}

export async function preferencesRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/preferences
  fastify.get<{ Reply: ApiResponse<UserPreferences> }>(
    '/api/preferences',
    async (_req, reply) => {
      const prefs = getPreferences()
      return reply.code(200).send({ success: true, data: prefs })
    }
  )

  // PUT /api/preferences
  fastify.put<{ Body: { key: string; value: unknown }; Reply: ApiResponse<UserPreferences> }>(
    '/api/preferences',
    async (req, reply) => {
      const { key, value } = req.body
      if (!key) throw Errors.VALIDATION_ERROR('key is required')
      if (!(key in DEFAULTS)) throw Errors.VALIDATION_ERROR(`Unknown preference key: ${key}`)

      // Validate value types
      const defaultVal = DEFAULTS[key as keyof UserPreferences]
      if (typeof defaultVal === 'boolean' && typeof value !== 'boolean') {
        throw Errors.VALIDATION_ERROR(`${key} must be a boolean`)
      }
      if (typeof defaultVal === 'number') {
        const num = Number(value)
        if (isNaN(num)) throw Errors.VALIDATION_ERROR(`${key} must be a number`)
        if (key === 'autoConfirmThreshold' && (num < 0.5 || num > 1.0)) {
          throw Errors.VALIDATION_ERROR('autoConfirmThreshold must be between 0.5 and 1.0')
        }
        if (key === 'historyRetentionDays' && ![7, 30, 90, 365].includes(num)) {
          throw Errors.VALIDATION_ERROR('historyRetentionDays must be 7, 30, 90, or 365')
        }
      }
      if (key === 'theme' && !['dark', 'light'].includes(value as string)) {
        throw Errors.VALIDATION_ERROR('theme must be dark or light')
      }
      if (key === 'language' && !['en', 'vi'].includes(value as string)) {
        throw Errors.VALIDATION_ERROR('language must be en or vi')
      }

      setPreference(key, value)
      const updated = getPreferences()
      return reply.code(200).send({ success: true, data: updated })
    }
  )

  // POST /api/preferences/reset
  fastify.post<{ Reply: ApiResponse<UserPreferences> }>(
    '/api/preferences/reset',
    async (_req, reply) => {
      resetPreferences()
      return reply.code(200).send({ success: true, data: { ...DEFAULTS } })
    }
  )
}
