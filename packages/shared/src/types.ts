export type ToolStatus = 'running' | 'idle' | 'error' | 'offline'
export type TaskStatus = 'pending' | 'confirmed' | 'running' | 'completed' | 'failed'

export interface Tool {
  id: string
  name: string
  type: string
  status: string
  description?: string
  config?: Record<string, unknown>
  lastSeenAt?: string
  createdAt: string
}

export interface Task {
  id: string
  prompt: string
  suggestedTool?: string
  confirmedTool?: string
  status: TaskStatus
  result?: string
  error?: string
  tokensUsed: number
  durationMs: number
  createdAt: string
  completedAt?: string
}

export interface TaskHistory {
  id: string
  taskId: string
  event: string
  data?: string
  createdAt: string
}

export interface UserPreference {
  key: string
  value: string
  updatedAt: string
}

export interface RoutingSuggestion {
  toolId: string
  confidence: number
  reason: string
}

export interface WebSocketMessage {
  type: 'task_update' | 'tool_status' | 'ack' | 'error'
  payload: unknown
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
