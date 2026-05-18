import type { ToolExecutor, ExecutionResult, ExecutionOptions } from './base.js'
import { getConfig } from '../../config.js'

const SYSTEM_PROMPTS: Record<string, string> = {
  openclaw: 'You are OpenClaw, a multi-agent AI assistant specialized in automation, multi-agent orchestration, and developer workflows. Help the user accomplish their task efficiently.',
  hermes: 'You are Hermes, a Python-focused AI agent specialized in scripting, data processing, and backend development. Provide clean, well-documented Python solutions.',
  kiro: 'You are Kiro, an AWS cloud development assistant specialized in serverless, infrastructure-as-code, and cloud-native architectures. Help design and implement AWS solutions.',
  antigravity: "You are Antigravity, Google's autonomous coding agent specialized in complex software engineering tasks, architecture design, and full-stack development.",
  codex: "You are Codex, OpenAI's coding CLI specialized in code generation, refactoring, and debugging across all programming languages.",
  'claude-code': "You are Claude Code, Anthropic's coding assistant specialized in thoughtful, well-reasoned code solutions with strong emphasis on correctness and maintainability.",
}

const DEFAULT_MODELS: Record<string, string> = {
  openclaw: 'kr/claude-sonnet-4.6',
  hermes: 'ds/deepseek-v4-flash',
  kiro: 'kr/claude-sonnet-4.6',
  antigravity: 'kr/claude-opus-4.6',
  codex: 'cx/gpt-5.5',
  'claude-code': 'kr/claude-sonnet-4.6',
}

export class LlmExecutor implements ToolExecutor {
  toolId: string

  constructor(toolId: string) {
    this.toolId = toolId
  }

  async execute(prompt: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    const start = Date.now()
    const config = getConfig()
    const timeout = options.timeout ?? 60000
    const maxTokens = options.maxTokens ?? 4096
    const temperature = options.temperature ?? 0.7

    const systemPrompt = SYSTEM_PROMPTS[this.toolId] ?? `You are ${this.toolId}, an AI coding assistant. Help the user accomplish their task.`
    const model = DEFAULT_MODELS[this.toolId] ?? 'kr/claude-sonnet-4.6'

    options.onProgress?.(`Starting ${this.toolId} execution...`)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(`${config.llmBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.llmApiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          max_tokens: maxTokens,
          temperature,
          stream: false,
        }),
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!response.ok) {
        const err = await response.text()
        return {
          success: false,
          output: `LLM API error (${response.status}): ${err}`,
          durationMs: Date.now() - start,
        }
      }

      const data = await response.json() as any
      const output = data.choices?.[0]?.message?.content ?? ''
      const tokensUsed = data.usage?.total_tokens

      options.onProgress?.(`${this.toolId} completed.`)

      return {
        success: true,
        output,
        tokensUsed,
        durationMs: Date.now() - start,
        metadata: { model, toolId: this.toolId },
      }
    } catch (err: any) {
      clearTimeout(timer)
      const isTimeout = err?.name === 'AbortError'
      return {
        success: false,
        output: isTimeout ? `Execution timed out after ${timeout}ms` : `Execution error: ${err?.message ?? err}`,
        durationMs: Date.now() - start,
      }
    }
  }

  async checkHealth(): Promise<boolean> {
    const config = getConfig()
    try {
      const response = await fetch(`${config.llmBaseUrl}/models`, {
        headers: { Authorization: `Bearer ${config.llmApiKey}` },
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch {
      return false
    }
  }
}
