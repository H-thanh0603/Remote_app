import AsyncStorage from '@react-native-async-storage/async-storage'

const DEFAULT_API_BASE = 'http://localhost:3001/api'

async function getApiBase(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem('api_base_url')
    return stored ?? DEFAULT_API_BASE
  } catch {
    return DEFAULT_API_BASE
  }
}

export async function setApiBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem('api_base_url', url)
}

async function request<T>(path: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
  const base = await getApiBase()
  try {
    const res = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    return await res.json()
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

  // Brain
  brainChat: (message: string, resetContext?: boolean) =>
    request<{ message: string; plan?: any; toolsUsed: string[]; confidence: number; reasoning?: string }>(
      '/brain/chat', { method: 'POST', body: JSON.stringify({ message, resetContext }) }
    ),
  brainStatus: () => request('/brain/status'),
  brainReset: () => request('/brain/reset', { method: 'POST' }),

  // Legacy methods
  getTools: () => request('/tools'),
  getTool: (id: string) => request(`/tools/${id}`),
  updateToolStatus: (id: string, status: string) =>
    request(`/tools/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  createTask: (prompt: string) =>
    request('/tasks', { method: 'POST', body: JSON.stringify({ prompt }) }),
  confirmTask: (taskId: string, toolId: string) =>
    request(`/tasks/${taskId}/confirm`, { method: 'PUT', body: JSON.stringify({ toolId }) }),
  cancelTask: (taskId: string) =>
    request(`/tasks/${taskId}/cancel`, { method: 'PUT' }),
  getTasks: () => request('/tasks'),
  getHealth: () => request('/health'),
}
