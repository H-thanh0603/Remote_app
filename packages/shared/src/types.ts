export type ToolStatus = 'running' | 'idle' | 'error' | 'offline'
export type TaskStatus = 'pending' | 'confirmed' | 'running' | 'completed' | 'failed'

export interface Tool {
  id: string
  name: string
  status: ToolStatus
  description: string
}

export interface Task {
  id: string
  prompt: string
  suggestedTool: string
  status: TaskStatus
  result?: string
  createdAt: string
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
