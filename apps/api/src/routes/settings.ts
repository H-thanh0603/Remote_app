import type { FastifyInstance } from 'fastify'
import { getPreference, setPreference, getAllPreferences } from '../db/repositories/preferences.js'
import { LlmService } from '../services/llm.js'
import { TelegramService } from '../services/telegram.js'
import { getConfig } from '../config.js'

const SETTINGS_KEYS = [
  'llm_base_url',
  'llm_api_key',
  'llm_model',
  'telegram_bot_token',
  'telegram_chat_id',
  'telegram_enabled',
  'notification_task_completed',
  'notification_task_failed',
  'notification_tool_error',
  'theme',
  'language',
] as const

const MASKED_KEYS = ['llm_api_key', 'telegram_bot_token']

function maskValue(key: string, value: string): string {
  if (MASKED_KEYS.includes(key) && value.length > 4) {
    return '*'.repeat(value.length - 4) + value.slice(-4)
  }
  return value
}

export async function settingsRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/settings — get all settings
  fastify.get('/api/settings', async (_req, reply) => {
    const all = getAllPreferences()
    const result: Record<string, string> = {}

    for (const key of SETTINGS_KEYS) {
      const raw = all[key] ?? getDefaultValue(key)
      result[key] = maskValue(key, raw)
    }

    return reply.send({ success: true, data: result })
  })

  // PUT /api/settings — update a setting
  fastify.put<{
    Body: { key: string; value: string }
  }>('/api/settings', {
    schema: {
      body: {
        type: 'object',
        required: ['key', 'value'],
        properties: {
          key: { type: 'string' },
          value: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { key, value } = req.body

    if (!SETTINGS_KEYS.includes(key as typeof SETTINGS_KEYS[number])) {
      return reply.code(400).send({ success: false, error: `Invalid setting key: ${key}` })
    }

    // Validate value
    const validationError = validateSetting(key, value)
    if (validationError) {
      return reply.code(400).send({ success: false, error: validationError })
    }

    setPreference(key, value)
    return reply.send({ success: true, data: { key, value: maskValue(key, value) } })
  })

  // POST /api/settings/validate — validate API key/connection
  fastify.post('/api/settings/validate', async (_req, reply) => {
    const results: Record<string, { ok: boolean; message: string }> = {}

    // Validate LLM connection
    try {
      const baseUrl = getPreference('llm_base_url') ?? getConfig().llmBaseUrl
      const apiKey = getPreference('llm_api_key') ?? getConfig().llmApiKey
      const model = getPreference('llm_model') ?? getConfig().llm.model

      if (baseUrl && apiKey) {
        const llm = new LlmService({ baseUrl, apiKey, model: model ?? 'gpt-4o-mini' })
        const ok = await llm.healthCheck()
        results.llm = { ok, message: ok ? 'LLM connection successful' : 'LLM connection failed' }
      } else {
        results.llm = { ok: false, message: 'LLM base URL or API key not configured' }
      }
    } catch (err) {
      results.llm = { ok: false, message: `LLM error: ${err instanceof Error ? err.message : 'Unknown error'}` }
    }

    // Validate Telegram connection
    try {
      const botToken = getPreference('telegram_bot_token')
      const chatId = getPreference('telegram_chat_id')

      if (botToken && chatId) {
        const telegram = new TelegramService(botToken)
        const ok = await telegram.validateConnection()
        results.telegram = { ok, message: ok ? 'Telegram connection successful' : 'Telegram bot token invalid' }
      } else {
        results.telegram = { ok: false, message: 'Telegram bot token or chat ID not configured' }
      }
    } catch (err) {
      results.telegram = { ok: false, message: `Telegram error: ${err instanceof Error ? err.message : 'Unknown error'}` }
    }

    return reply.send({ success: true, data: results })
  })
}

function getDefaultValue(key: string): string {
  const defaults: Record<string, string> = {
    llm_base_url: '',
    llm_api_key: '',
    llm_model: 'gpt-4o-mini',
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_enabled: 'false',
    notification_task_completed: 'true',
    notification_task_failed: 'true',
    notification_tool_error: 'false',
    theme: 'dark',
    language: 'en',
  }
  return defaults[key] ?? ''
}

function validateSetting(key: string, value: string): string | null {
  switch (key) {
    case 'llm_base_url':
      if (value && !value.startsWith('http')) {
        return 'LLM base URL must start with http:// or https://'
      }
      break
    case 'telegram_enabled':
    case 'notification_task_completed':
    case 'notification_task_failed':
    case 'notification_tool_error':
      if (!['true', 'false'].includes(value)) {
        return `${key} must be 'true' or 'false'`
      }
      break
    case 'theme':
      if (!['dark', 'light'].includes(value)) {
        return "theme must be 'dark' or 'light'"
      }
      break
    case 'language':
      if (!['en', 'vi'].includes(value)) {
        return "language must be 'en' or 'vi'"
      }
      break
  }
  return null
}
