import type { Task, Tool } from '@remote-app/shared'
import { TelegramService } from './telegram.js'
import { getDb } from '../db/index.js'

export interface NotificationPreferences {
  taskCompleted: boolean
  taskFailed: boolean
  toolError: boolean
  toolStatusChange: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  taskCompleted: true,
  taskFailed: true,
  toolError: true,
  toolStatusChange: false,
}

export class NotificationService {
  private telegram: TelegramService
  private preferences: NotificationPreferences = { ...DEFAULT_PREFERENCES }

  constructor(telegram: TelegramService) {
    this.telegram = telegram
  }

  async loadPreferences(): Promise<void> {
    try {
      const db = getDb()
      const rows = db
        .prepare('SELECT key, value FROM user_preferences WHERE key LIKE ?')
        .all('notify_%') as { key: string; value: string }[]

      for (const row of rows) {
        const field = row.key.replace('notify_', '') as keyof NotificationPreferences
        if (field in this.preferences) {
          this.preferences[field] = row.value === 'true'
        }
      }
    } catch {
      // DB not ready yet — use defaults
    }
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences }
  }

  async setPreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...prefs }

    try {
      const db = getDb()
      const stmt = db.prepare(
        'INSERT OR REPLACE INTO user_preferences (key, value, updated_at) VALUES (?, ?, ?)'
      )
      const now = new Date().toISOString()
      for (const [key, value] of Object.entries(prefs)) {
        stmt.run(`notify_${key}`, String(value), now)
      }
    } catch (err) {
      console.error('[Notifications] Failed to persist preferences:', err)
    }
  }

  async notify(event: string, data: Record<string, unknown>): Promise<void> {
    if (!this.telegram.isConfigured()) return

    switch (event) {
      case 'task:completed':
        if (this.preferences.taskCompleted) {
          await this.telegram.notifyTaskCompleted(data['task'] as Task, data['tool'] as Tool)
        }
        break

      case 'task:failed':
        if (this.preferences.taskFailed) {
          await this.telegram.notifyTaskFailed(data['task'] as Task, data['error'] as string)
        }
        break

      case 'tool:error':
        if (this.preferences.toolError) {
          await this.telegram.notifyToolStatusChange(
            data['tool'] as Tool,
            data['oldStatus'] as string,
            'error'
          )
        }
        break

      case 'tool:status_changed':
        if (this.preferences.toolStatusChange) {
          await this.telegram.notifyToolStatusChange(
            data['tool'] as Tool,
            data['oldStatus'] as string,
            data['newStatus'] as string
          )
        }
        break

      default:
        break
    }
  }
}
