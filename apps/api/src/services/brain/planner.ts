// ─── Planner ─────────────────────────────────────────────────────────────────
// Analyzes user intent and creates execution plans.

import type { ExecutionPlan, TaskStep, ToolContext } from './types.js'
import { LlmService } from '../llm.js'
import { config } from '../../config.js'

const PLANNER_SYSTEM = `You are the Brain of an AI Command Center that orchestrates multiple AI tools.
Your job: analyze the user's request, understand their intent, and create an execution plan.

Available tools:
{{TOOLS}}

Conversation context:
{{CONTEXT}}

Instructions:
1. Understand what the user wants to achieve (not just what they said)
2. Decide if this needs one tool or multiple tools
3. If multi-step, determine dependencies between steps
4. Consider tool strengths — route to the best tool for each sub-task

Respond in JSON only:
{
  "intent": "What the user actually wants to achieve",
  "reasoning": "Your thought process for choosing this approach",
  "strategy": "single|sequential|parallel|mixed",
  "steps": [
    {
      "id": "step_1",
      "toolId": "tool-id",
      "action": "What this step does",
      "input": "The actual prompt/instruction to send to the tool",
      "dependsOn": []
    }
  ],
  "directResponse": null or "string if you can answer directly without tools"
}

Rules:
- If the user is just chatting/asking a question you can answer → set directResponse and empty steps
- If the task is simple (one tool) → single step
- If complex → break into logical steps with dependencies
- "dependsOn" references step ids that must complete first
- Keep steps minimal — don't over-engineer simple tasks
- For coding tasks: prefer antigravity (complex) or codex (quick)
- For research: prefer hermes
- For cloud/AWS: prefer kiro
- For multi-agent workflows: prefer openclaw
- For code review/TS/JS: prefer claude-code`

export class Planner {
  private llm: LlmService

  constructor() {
    this.llm = new LlmService({
      baseUrl: config.llm.baseUrl,
      apiKey: config.llm.apiKey,
      model: config.llm.model,
    })
  }

  async createPlan(
    userMessage: string,
    tools: ToolContext[],
    conversationContext: string
  ): Promise<{ plan: ExecutionPlan | null; directResponse: string | null }> {
    const toolsDesc = tools.map(t =>
      `- ${t.id} (${t.name}): ${t.capabilities} [status: ${t.status}]`
    ).join('\n')

    const systemPrompt = PLANNER_SYSTEM
      .replace('{{TOOLS}}', toolsDesc)
      .replace('{{CONTEXT}}', conversationContext || '(New conversation)')

    try {
      const response = await this.llm.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ], { maxTokens: 1000, temperature: 0.2 })

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.warn('[planner] Could not parse LLM response:', response)
        return { plan: null, directResponse: null }
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        intent: string
        reasoning: string
        strategy: 'single' | 'sequential' | 'parallel' | 'mixed'
        steps: Array<{ id: string; toolId: string; action: string; input: string; dependsOn?: string[] }>
        directResponse?: string | null
      }

      // Direct response — no tools needed
      if (parsed.directResponse) {
        return { plan: null, directResponse: parsed.directResponse }
      }

      // Build execution plan
      const steps: TaskStep[] = parsed.steps.map(s => ({
        id: s.id,
        toolId: s.toolId,
        action: s.action,
        input: s.input,
        dependsOn: s.dependsOn ?? [],
        status: 'pending' as const,
      }))

      const plan: ExecutionPlan = {
        id: crypto.randomUUID(),
        intent: parsed.intent,
        reasoning: parsed.reasoning,
        steps,
        strategy: parsed.strategy ?? 'single',
        createdAt: Date.now(),
      }

      console.log(`[planner] Created plan: ${plan.strategy} with ${steps.length} step(s)`)
      return { plan, directResponse: null }
    } catch (err) {
      console.error('[planner] Planning failed:', (err as Error).message)
      return { plan: null, directResponse: null }
    }
  }
}
