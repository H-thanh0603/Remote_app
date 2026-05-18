import { config } from '../config.js'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmConfig {
  baseUrl: string
  apiKey: string
  model: string
}

export class LlmService {
  private cfg: LlmConfig

  constructor(cfg?: LlmConfig) {
    this.cfg = cfg ?? {
      baseUrl: config.llm.baseUrl,
      apiKey: config.llm.apiKey,
      model: config.llm.model,
    }
  }

  async chat(
    messages: ChatMessage[],
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: this.cfg.model,
          messages,
          max_tokens: options?.maxTokens ?? 256,
          temperature: options?.temperature ?? 0.2,
          stream: false,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`LLM API error ${res.status}: ${err}`)
      }

      const data = (await res.json()) as {
        choices: Array<{ message: { content: string } }>
      }

      return data.choices[0]?.message?.content ?? ''
    } finally {
      clearTimeout(timeout)
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.chat([{ role: 'user', content: 'ping' }], { maxTokens: 5 })
      return true
    } catch {
      return false
    }
  }
}

export const llmService = new LlmService()
