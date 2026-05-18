import type { ToolExecutor, ExecutionResult } from './executors/base.js'
import { LlmExecutor } from './executors/llm-executor.js'
import { OpenClawExecutor } from './executors/openclaw.js'
import { CliExecutor } from './executors/cli-executor.js'
import { getTaskById, updateTaskStatus } from '../db/repositories/tasks.js'
import { getToolById, updateToolStatus } from '../db/repositories/tools.js'
import { getDb } from '../db/index.js'
import { wsManager } from './websocket.js'
import { notificationService } from './index.js'

class ExecutionManager {
  private executors: Map<string, ToolExecutor> = new Map()
  private activeExecutions: Map<string, AbortController> = new Map()

  constructor() {
    // Register default executors
    this.registerExecutor(new OpenClawExecutor())
    this.registerExecutor(new LlmExecutor('hermes'))
    this.registerExecutor(new LlmExecutor('kiro'))
    this.registerExecutor(new LlmExecutor('antigravity'))
    this.registerExecutor(new LlmExecutor('codex'))
    this.registerExecutor(new LlmExecutor('claude-code'))
    this.registerExecutor(new CliExecutor('cli-generic', 'cli'))
  }

  registerExecutor(executor: ToolExecutor): void {
    this.executors.set(executor.toolId, executor)
  }

  async executeTask(taskId: string): Promise<ExecutionResult> {
    const start = Date.now()

    // 1. Get task from DB
    const task = getTaskById(taskId)
    if (!task) {
      return { success: false, output: 'Task not found', durationMs: 0 }
    }

    // 2. Get confirmed tool
    const db = getDb()
    const row = db.prepare('SELECT confirmed_tool FROM tasks WHERE id = ?').get(taskId) as any
    const toolId = row?.confirmed_tool ?? task.suggestedTool
    if (!toolId) {
      return { success: false, output: 'No tool confirmed for this task', durationMs: 0 }
    }

    // 3. Find executor
    const executor = this.executors.get(toolId) ?? this.executors.get('hermes')!
    const tool = getToolById(toolId)

    // 4. Update task status to running
    updateTaskStatus(taskId, 'running')

    // 5. Broadcast task:started
    wsManager.broadcast('task:started', { taskId, toolId })

    // 6. Execute with progress callbacks
    const abortController = new AbortController()
    this.activeExecutions.set(taskId, abortController)

    let result: ExecutionResult
    try {
      result = await executor.execute(task.prompt, {
        timeout: 60000,
        onProgress: (message: string) => {
          wsManager.broadcast('task:progress', { taskId, message })
        },
      })
    } catch (err: any) {
      result = {
        success: false,
        output: `Execution error: ${err?.message ?? err}`,
        durationMs: Date.now() - start,
      }
    } finally {
      this.activeExecutions.delete(taskId)
    }

    // 7. Update task with result
    const newStatus = result.success ? 'completed' : 'failed'
    updateTaskStatus(taskId, newStatus)
    db.prepare('UPDATE tasks SET result = ?, tokens_used = ? WHERE id = ?').run(
      result.output,
      result.tokensUsed ?? null,
      taskId
    )

    const updatedTask = getTaskById(taskId)!

    // 8. Broadcast task:completed or task:failed
    if (result.success) {
      wsManager.broadcast('task:completed', { taskId, result })
    } else {
      wsManager.broadcast('task:failed', { taskId, error: result.output })
    }

    // 9. Send Telegram notification
    if (tool) {
      const event = result.success ? 'task:completed' : 'task:failed'
      notificationService.notify(event, {
        task: updatedTask,
        tool,
        error: result.success ? undefined : result.output,
      }).catch(() => {})
    }

    return result
  }

  async cancelExecution(taskId: string): Promise<void> {
    const controller = this.activeExecutions.get(taskId)
    if (controller) {
      controller.abort()
      this.activeExecutions.delete(taskId)
    }
    updateTaskStatus(taskId, 'cancelled')
    wsManager.broadcast('task:failed', { taskId, error: 'Cancelled by user' })
  }

  getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions.keys())
  }

  async checkAllHealth(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    await Promise.all(
      Array.from(this.executors.entries()).map(async ([toolId, executor]) => {
        results[toolId] = await executor.checkHealth()
      })
    )
    return results
  }
}

export const executionManager = new ExecutionManager()
