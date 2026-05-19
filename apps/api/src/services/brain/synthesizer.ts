// ─── Synthesizer ─────────────────────────────────────────────────────────────
// Combines results from multiple steps into a coherent response for the user.

import type { ExecutionPlan, BrainResponse } from './types.js'
import type { StepResult } from './orchestrator.js'
import { LlmService } from '../llm.js'
import { config } from '../../config.js'

const SYNTHESIS_PROMPT = `You are the synthesis layer of an AI Command Center.
You receive results from one or more AI tools that executed parts of a user's request.
Your job: combine these results into a single, coherent, helpful response for the user.

Rules:
- Be concise but complete
- If a step failed, acknowledge it and explain what happened
- If all steps succeeded, present a unified answer
- Use the user's language (Vietnamese if they wrote in Vietnamese)
- Don't mention internal tool names unless relevant to the user
- Format nicely with markdown when helpful

User's original request: {{REQUEST}}
Execution plan: {{PLAN}}
`

export class Synthesizer {
  private llm: LlmService

  constructor() {
    this.llm = new LlmService({
      baseUrl: config.llm.baseUrl,
      apiKey: config.llm.apiKey,
      model: config.llm.model,
    })
  }

  async synthesize(
    userMessage: string,
    plan: ExecutionPlan,
    results: StepResult[]
  ): Promise<BrainResponse> {
    const toolsUsed = [...new Set(results.map(r => r.toolId))]
    const allSuccess = results.every(r => r.success)
    const totalConfidence = allSuccess ? 0.9 : 0.5

    // Single step with success → return directly (no extra LLM call)
    if (results.length === 1 && results[0].success) {
      return {
        message: results[0].output,
        plan,
        toolsUsed,
        confidence: 0.9,
        reasoning: plan.reasoning,
      }
    }

    // Multi-step or failure → synthesize with LLM
    const resultsText = results.map(r => {
      const status = r.success ? '✅' : '❌'
      const step = plan.steps.find(s => s.id === r.stepId)
      return `${status} Step "${step?.action ?? r.stepId}" (${r.toolId}, ${r.durationMs}ms):\n${r.output}`
    }).join('\n\n---\n\n')

    const planSummary = plan.steps.map(s =>
      `${s.id}: ${s.action} → ${s.toolId} [${s.status}]`
    ).join('\n')

    try {
      const systemPrompt = SYNTHESIS_PROMPT
        .replace('{{REQUEST}}', userMessage)
        .replace('{{PLAN}}', planSummary)

      const response = await this.llm.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Results:\n\n${resultsText}` },
      ], { maxTokens: 2000, temperature: 0.3 })

      return {
        message: response,
        plan,
        toolsUsed,
        confidence: totalConfidence,
        reasoning: plan.reasoning,
      }
    } catch (err) {
      // Fallback: just concatenate results
      console.warn('[synthesizer] Synthesis failed, using raw results:', (err as Error).message)
      const fallback = results.map(r => {
        const step = plan.steps.find(s => s.id === r.stepId)
        return `**${step?.action ?? r.stepId}** (${r.toolId}):\n${r.output}`
      }).join('\n\n')

      return {
        message: fallback,
        plan,
        toolsUsed,
        confidence: 0.4,
        reasoning: plan.reasoning,
      }
    }
  }

  /**
   * Quick response without plan execution (for direct answers)
   */
  directResponse(message: string): BrainResponse {
    return {
      message,
      toolsUsed: [],
      confidence: 0.85,
    }
  }
}
