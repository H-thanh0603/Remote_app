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
    const timeout = setTimeout(() => controller.abort(), 60_000)

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

      const contentType = res.headers.get('content-type') ?? ''

      // Handle streaming response (SSE)
      if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
        const text = await res.text()
        let fullContent = ''
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break
          try {
            const chunk = JSON.parse(payload)
            const delta = chunk.choices?.[0]?.delta?.content
            if (delta) fullContent += delta
          } catch { /* skip malformed chunks */ }
        }
        return fullContent
      }

      // Handle normal JSON response
      const data = (await res.json()) as {
        choices: Array<{ message: { content: string }; delta?: { content: string } }>
      }

      return data.choices[0]?.message?.content ?? data.choices[0]?.delta?.content ?? ''
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
