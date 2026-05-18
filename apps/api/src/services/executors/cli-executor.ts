import type { ToolExecutor, ExecutionResult, ExecutionOptions } from './base.js'

// Stub CLI executor for future use when tools have CLI interfaces
export class CliExecutor implements ToolExecutor {
  toolId: string
  private cliCommand: string

  constructor(toolId: string, cliCommand: string) {
    this.toolId = toolId
    this.cliCommand = cliCommand
  }

  async execute(prompt: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    const start = Date.now()
    // Stub: CLI execution not yet implemented
    options.onProgress?.(`CLI executor for ${this.toolId} is not yet implemented`)
    return {
      success: false,
      output: `CLI executor for ${this.toolId} (${this.cliCommand}) is not yet implemented. Use LLM executor instead.`,
      durationMs: Date.now() - start,
      metadata: { toolId: this.toolId, cliCommand: this.cliCommand },
    }
  }

  async checkHealth(): Promise<boolean> {
    // Stub: always return false until implemented
    return false
  }
}
