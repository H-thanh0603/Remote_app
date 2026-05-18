import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env file manually (no dotenv dependency needed for simple cases)
function loadEnv(): void {
  const envPath = join(__dirname, '..', '.env')
  if (!existsSync(envPath)) return

  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnv()

export interface AppConfig {
  port: number
  llmBaseUrl: string
  llmApiKey: string
  executionTimeout: number
  openclawGatewayUrl: string
  openclawGatewayToken: string
  llm: {
    baseUrl: string
    apiKey: string
    model: string
  }
  telegram: {
    botToken: string
    chatId: string
  }
}

let _config: AppConfig | null = null

export function getConfig(): AppConfig {
  if (_config) return _config
  _config = {
    port: parseInt(process.env['PORT'] ?? '3001', 10),
    llmBaseUrl: process.env['LLM_BASE_URL'] ?? 'http://127.0.0.1:20128/v1',
    llmApiKey: process.env['LLM_API_KEY'] ?? '',
    executionTimeout: parseInt(process.env['EXECUTION_TIMEOUT'] ?? '60000', 10),
    openclawGatewayUrl: process.env['OPENCLAW_GATEWAY_URL'] ?? 'http://127.0.0.1:18789',
    openclawGatewayToken: process.env['OPENCLAW_GATEWAY_TOKEN'] ?? '',
    llm: {
      baseUrl: process.env['LLM_BASE_URL'] ?? 'http://127.0.0.1:20128/v1',
      apiKey: process.env['LLM_API_KEY'] ?? '',
      model: process.env['LLM_MODEL'] ?? 'kr/claude-sonnet-4.6',
    },
    telegram: {
      botToken: process.env['TELEGRAM_BOT_TOKEN'] ?? '',
      chatId: process.env['TELEGRAM_CHAT_ID'] ?? '',
    },
  }
  return _config
}

export const config: AppConfig = new Proxy({} as AppConfig, {
  get(_target, prop) {
    return getConfig()[prop as keyof AppConfig]
  },
})
