// ─── Brain Types ─────────────────────────────────────────────────────────────

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: {
    toolId?: string
    taskId?: string
    planId?: string
  }
}

export interface TaskStep {
  id: string
  toolId: string
  action: string
  input: string
  dependsOn?: string[]  // step ids this depends on
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  error?: string
}

export interface ExecutionPlan {
  id: string
  intent: string
  reasoning: string
  steps: TaskStep[]
  strategy: 'single' | 'sequential' | 'parallel' | 'mixed'
  createdAt: number
}

export interface BrainResponse {
  message: string
  plan?: ExecutionPlan
  toolsUsed: string[]
  confidence: number
  reasoning?: string
}

export interface ToolContext {
  id: string
  name: string
  type: string
  status: string
  capabilities: string
}

export interface BrainConfig {
  maxHistoryMessages: number
  planningModel: string
  executionModel: string
  synthesisModel: string
  maxRetries: number
  enableReasoning: boolean
}
