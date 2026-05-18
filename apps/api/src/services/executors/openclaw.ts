import type { ToolExecutor, ExecutionResult, ExecutionOptions } from './base.js'
import { LlmExecutor } from './llm-executor.js'
import { getConfig } from '../../config.js'

export class OpenClawExecutor implements ToolExecutor {
  toolId = 'openclaw'
  private llmFallback: LlmExecutor

  constructor() {
    this.llmFallback = new LlmExecutor('openclaw')
  }

  async execute(prompt: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    const start = Date.now()
    const config = getConfig()

    // Try OpenClaw Gateway first
    if (config.openclawGatewayUrl && config.openclawGatewayToken) {
      options.onProgress?.('Connecting to OpenClaw Gateway...')
      try {
        const response = await fetch(`${config.openclawGatewayUrl}/api/agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.openclawGatewayToken}`,
          },
          body: JSON.stringify({ message: prompt }),
          signal: AbortSignal.timeout(options.timeout ?? 60000),
        })

        if (response.ok) {
          const data = await response.json() as any
          options.onProgress?.('OpenClaw Gateway responded.')
          return {
            success: true,
            output: data.reply ?? data.message ?? JSON.stringify(data),
            durationMs: Date.now() - start,
            metadata: { source: 'openclaw-gateway' },
          }
        }
      } catch {
        options.onProgress?.('OpenClaw Gateway unavailable, falling back to LLM...')
      }
    }

    // Fallback to LLM with OpenClaw system prompt
    return this.llmFallback.execute(prompt, options)
  }

  async checkHealth(): Promise<boolean> {
    const config = getConfig()
    if (config.openclawGatewayUrl && config.openclawGatewayToken) {
      try {
        const response = await fetch(`${config.openclawGatewayUrl}/health`, {
          signal: AbortSignal.timeout(5000),
        })
        if (response.ok) return true
      } catch {}
    }
    return this.llmFallback.checkHealth()
  }
}
