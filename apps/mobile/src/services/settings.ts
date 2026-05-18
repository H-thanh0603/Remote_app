import { api } from './api'

export interface Settings {
  llm_base_url: string
  llm_api_key: string
  llm_model: string
  telegram_bot_token: string
  telegram_chat_id: string
  telegram_enabled: string
  notification_task_completed: string
  notification_task_failed: string
  notification_tool_error: string
  theme: string
  language: string
}

export const settingsApi = {
  getAll: () => api.get<Settings>('/settings'),
  update: (key: string, value: string) => api.put<{ key: string; value: string }>('/settings', { key, value }),
  validateConnection: () => api.post<Record<string, { ok: boolean; message: string }>>('/settings/validate', {}),
  testTelegram: () => api.post<{ success: boolean }>('/notifications/test', {}),
}
