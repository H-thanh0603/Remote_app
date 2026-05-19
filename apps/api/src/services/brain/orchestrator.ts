// ─── Orchestrator ────────────────────────────────────────────────────────────
// Executes plans by dispatching steps to tools and managing dependencies.

import type { ExecutionPlan, TaskStep } from './types.js'
import { getAllTools } from '../../db/repositories/tools.js'
import { config } from '../../config.js'

export interface StepResult {
  stepId: string
  toolId: string
  success: boolean
  output: string
  durationMs: number
}

export class Orchestrator {
  private gatewayUrl: string
  private gatewayToken: string

  constructor() {
    this.gatewayUrl = config.openclawGatewayUrl
    this.gatewayToken = config.openclawGatewayToken
  }

  async executePlan(
    plan: ExecutionPlan,
    onStepUpdate?: (step: TaskStep, result?: StepResult) => void
  ): Promise<StepResult[]> {
    const results: StepResult[] = []
    const completedSteps = new Set<string>()

    switch (plan.strategy) {
      case 'single':
        return this.executeSequential(plan.steps, completedSteps, results, onStepUpdate)
      case 'sequential':
        return this.executeSequential(plan.steps, completedSteps, results, onStepUpdate)
      case 'parallel':
        return this.executeParallel(plan.steps, results, onStepUpdate)
      case 'mixed':
        return this.executeMixed(plan.steps, completedSteps, results, onStepUpdate)
      default:
        return this.executeSequential(plan.steps, completedSteps, results, onStepUpdate)
    }
  }

  private async executeSequential(
    steps: TaskStep[],
    completedSteps: Set<string>,
    results: StepResult[],
    onStepUpdate?: (step: TaskStep, result?: StepResult) => void
  ): Promise<StepResult[]> {
    for (const step of steps) {
      step.status = 'running'
      onStepUpdate?.(step)

      const result = await this.executeStep(step, results)
      results.push(result)
      completedSteps.add(step.id)

      step.status = result.success ? 'completed' : 'failed'
      step.result = result.output
      if (!result.success) step.error = result.output
      onStepUpdate?.(step, result)

      // Stop on failure
      if (!result.success) break
    }
    return results
  }

  private async executeParallel(
    steps: TaskStep[],
    results: StepResult[],
    onStepUpdate?: (step: TaskStep, result?: StepResult) => void
  ): Promise<StepResult[]> {
    steps.forEach(s => { s.status = 'running'; onStepUpdate?.(s) })

    const promises = steps.map(step => this.executeStep(step, []))
    const settled = await Promise.allSettled(promises)

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const outcome = settled[i]

      if (outcome.status === 'fulfilled') {
        results.push(outcome.value)
        step.status = outcome.value.success ? 'completed' : 'failed'
        step.result = outcome.value.output
        if (!outcome.value.success) step.error = outcome.value.output
        onStepUpdate?.(step, outcome.value)
      } else {
        const failResult: StepResult = {
          stepId: step.id,
          toolId: step.toolId,
          success: false,
          output: outcome.reason?.message ?? 'Unknown error',
          durationMs: 0,
        }
        results.push(failResult)
        step.status = 'failed'
        step.error = failResult.output
        onStepUpdate?.(step, failResult)
      }
    }
    return results
  }

  private async executeMixed(
    steps: TaskStep[],
    completedSteps: Set<string>,
    results: StepResult[],
    onStepUpdate?: (step: TaskStep, result?: StepResult) => void
  ): Promise<StepResult[]> {
    // Group steps by dependency layers
    const remaining = [...steps]

    while (remaining.length > 0) {
      // Find steps whose dependencies are all completed
      const ready = remaining.filter(s =>
        !s.dependsOn?.length || s.dependsOn.every(dep => completedSteps.has(dep))
      )

      if (ready.length === 0) {
        // Deadlock — force sequential
        console.warn('[orchestrator] Dependency deadlock, forcing sequential')
        return this.executeSequential(remaining, completedSteps, results, onStepUpdate)
      }

      // Execute ready steps in parallel
      if (ready.length === 1) {
        const step = ready[0]
        step.status = 'running'
        onStepUpdate?.(step)

        const result = await this.executeStep(step, results)
        results.push(result)
        completedSteps.add(step.id)
        step.status = result.success ? 'completed' : 'failed'
        step.result = result.output
        if (!result.success) step.error = result.output
        onStepUpdate?.(step, result)
      } else {
        ready.forEach(s => { s.status = 'running'; onStepUpdate?.(s) })
        const promises = ready.map(s => this.executeStep(s, results))
        const settled = await Promise.allSettled(promises)

        for (let i = 0; i < ready.length; i++) {
          const step = ready[i]
          const outcome = settled[i]
          if (outcome.status === 'fulfilled') {
            results.push(outcome.value)
            completedSteps.add(step.id)
            step.status = outcome.value.success ? 'completed' : 'failed'
            step.result = outcome.value.output
            onStepUpdate?.(step, outcome.value)
          } else {
            const fail: StepResult = { stepId: step.id, toolId: step.toolId, success: false, output: outcome.reason?.message ?? 'Error', durationMs: 0 }
            results.push(fail)
            completedSteps.add(step.id)
            step.status = 'failed'
            step.error = fail.output
            onStepUpdate?.(step, fail)
          }
        }
      }

      // Remove completed from remaining
      for (const s of ready) {
        const idx = remaining.indexOf(s)
        if (idx >= 0) remaining.splice(idx, 1)
      }
    }

    return results
  }

  private async executeStep(step: TaskStep, priorResults: StepResult[]): Promise<StepResult> {
    const start = Date.now()

    try {
      // Inject prior results into input if step references them
      let enrichedInput = step.input
      if (step.dependsOn?.length) {
        const deps = priorResults.filter(r => step.dependsOn!.includes(r.stepId) && r.success)
        if (deps.length > 0) {
          const context = deps.map(d => `[Result from ${d.stepId}]: ${d.output}`).join('\n')
          enrichedInput = `${step.input}\n\n--- Prior results ---\n${context}`
        }
      }

      const output = await this.dispatchToTool(step.toolId, enrichedInput)

      return {
        stepId: step.id,
        toolId: step.toolId,
        success: true,
        output,
        durationMs: Date.now() - start,
      }
    } catch (err) {
      return {
        stepId: step.id,
        toolId: step.toolId,
        success: false,
        output: (err as Error).message,
        durationMs: Date.now() - start,
      }
    }
  }

  private async dispatchToTool(toolId: string, input: string): Promise<string> {
    // Route to OpenClaw gateway for execution
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)

    try {
      // Use OpenClaw gateway sessions_spawn equivalent
      const res = await fetch(`${this.gatewayUrl}/api/sessions/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.gatewayToken}`,
        },
        body: JSON.stringify({
          agentId: this.mapToolToAgent(toolId),
          message: input,
          timeoutSeconds: 25,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        // Fallback: use LLM directly
        return this.fallbackLlmExecution(toolId, input)
      }

      const data = await res.json() as { reply?: string; result?: string }
      return data.reply ?? data.result ?? 'Task completed (no output)'
    } catch (err) {
      // Fallback to LLM simulation
      console.warn(`[orchestrator] Tool ${toolId} dispatch failed, using LLM fallback:`, (err as Error).message)
      return this.fallbackLlmExecution(toolId, input)
    } finally {
      clearTimeout(timeout)
    }
  }

  private mapToolToAgent(toolId: string): string {
    const map: Record<string, string> = {
      'openclaw': 'main',
      'hermes': 'research',
      'kiro': 'coding',
      'antigravity': 'coding',
      'codex': 'coding',
      'claude-code': 'coding',
    }
    return map[toolId] ?? 'main'
  }

  private async fallbackLlmExecution(toolId: string, input: string): Promise<string> {
    const { LlmService } = await import('../llm.js')
    const llm = new LlmService()

    const response = await llm.chat([
      { role: 'system', content: `You are ${toolId}, an AI tool. Execute the following task and provide a helpful response.` },
      { role: 'user', content: input },
    ], { maxTokens: 2000, temperature: 0.3 })

    return response
  }
}
