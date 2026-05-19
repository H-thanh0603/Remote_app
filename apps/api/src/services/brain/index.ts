// ─── Brain Service ───────────────────────────────────────────────────────────
// The central orchestration layer — the "real brain" of AI Command Center.
// Flow: User message → Context → Plan → Execute → Synthesize → Response

import type { BrainResponse, BrainConfig, ToolContext } from './types.js'
import { ContextManager } from './context.js'
import { Planner } from './planner.js'
import { Orchestrator } from './orchestrator.js'
import { Synthesizer } from './synthesizer.js'
import { getAllTools } from '../../db/repositories/tools.js'
import { wsManager } from '../websocket.js'

export class Brain {
  private context: ContextManager
  private planner: Planner
  private orchestrator: Orchestrator
  private synthesizer: Synthesizer
  private config: BrainConfig

  constructor(config?: Partial<BrainConfig>) {
    this.config = {
      maxHistoryMessages: 20,
      planningModel: 'kr/claude-sonnet-4.6',
      executionModel: 'kr/claude-sonnet-4.6',
      synthesisModel: 'kr/claude-sonnet-4.6',
      maxRetries: 2,
      enableReasoning: true,
      ...config,
    }

    this.context = new ContextManager()
    this.planner = new Planner()
    this.orchestrator = new Orchestrator()
    this.synthesizer = new Synthesizer()
  }

  /**
   * Main entry point — process a user message through the full brain pipeline.
   */
  async think(userMessage: string): Promise<BrainResponse> {
    console.log(`[brain] Processing: "${userMessage.slice(0, 80)}..."`)

    // 1. Add to context
    this.context.addMessage({ role: 'user', content: userMessage })

    // 2. Gather tool context
    const tools = this.getToolContext()

    // 3. Build conversation context
    const conversationContext = this.context.buildContextString(this.config.maxHistoryMessages)

    // 4. Plan
    wsManager.broadcast('brain:planning' as any, { message: userMessage })
    const { plan, directResponse } = await this.planner.createPlan(
      userMessage,
      tools,
      conversationContext
    )

    // Direct response — no tools needed
    if (directResponse) {
      console.log('[brain] Direct response (no tools needed)')
      const response = this.synthesizer.directResponse(directResponse)
      this.context.addMessage({ role: 'assistant', content: response.message })
      wsManager.broadcast('brain:complete' as any, { response })
      return response
    }

    // No plan could be created — fallback
    if (!plan) {
      console.warn('[brain] No plan created, using fallback')
      const fallback: BrainResponse = {
        message: 'Tôi không thể xử lý yêu cầu này. Vui lòng thử lại với mô tả rõ hơn.',
        toolsUsed: [],
        confidence: 0.2,
      }
      this.context.addMessage({ role: 'assistant', content: fallback.message })
      return fallback
    }

    // 5. Execute plan
    console.log(`[brain] Executing plan: ${plan.strategy} (${plan.steps.length} steps)`)
    wsManager.broadcast('brain:executing' as any, { plan })

    const results = await this.orchestrator.executePlan(plan, (step, result) => {
      wsManager.broadcast('brain:step_update' as any, { step, result })
    })

    // 6. Synthesize results
    wsManager.broadcast('brain:synthesizing' as any, { results })
    const response = await this.synthesizer.synthesize(userMessage, plan, results)

    // 7. Store response in context
    this.context.addMessage({
      role: 'assistant',
      content: response.message,
      metadata: { planId: plan.id },
    })

    console.log(`[brain] Complete. Tools used: ${response.toolsUsed.join(', ')}. Confidence: ${response.confidence}`)
    wsManager.broadcast('brain:complete' as any, { response })

    return response
  }

  /**
   * Get current tool states as context for the planner
   */
  private getToolContext(): ToolContext[] {
    const tools = getAllTools()
    return tools.map(t => ({
      id: t.id,
      name: t.name,
      type: t.type ?? 'unknown',
      status: t.status ?? 'unknown',
      capabilities: this.getToolCapabilities(t.id),
    }))
  }

  private getToolCapabilities(toolId: string): string {
    const caps: Record<string, string> = {
      'openclaw': 'Multi-agent AI assistant. Chat, automation, multi-step workflows, file management, scheduling, 400+ skills',
      'hermes': 'Python AI agent. Research, data analysis, web scraping, automation scripts',
      'kiro': 'AWS AI IDE. Cloud development, full-stack apps, serverless, infrastructure',
      'antigravity': 'Google coding agent. Complex architecture, large codebases, debugging, design',
      'codex': 'OpenAI CLI agent. Quick code generation, refactoring, CLI tools, scripts',
      'claude-code': 'Anthropic CLI agent. TypeScript/JavaScript, code review, documentation, optimization',
    }
    return caps[toolId] ?? 'General AI tool'
  }

  // ─── Public utilities ────────────────────────────────────────────────────

  getContext(): ContextManager {
    return this.context
  }

  getSessionId(): string {
    return this.context.getSessionId()
  }

  resetContext(): void {
    this.context.clear()
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let _brain: Brain | null = null

export function getBrain(): Brain {
  if (!_brain) {
    _brain = new Brain()
  }
  return _brain
}

export function resetBrain(): Brain {
  _brain = new Brain()
  return _brain
}
