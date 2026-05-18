import type { Task, Tool } from '@remote-app/shared'

// Escape special Markdown v1 characters
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
}

function truncate(text: string, max = 200): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '…'
}

export class TelegramService {
  private botToken: string
  private chatId: string
  private enabled: boolean
  private lastSentAt = 0
  private readonly minIntervalMs = 1000 // max 1 msg/sec

  constructor(botTokenOrConfig: string | { botToken: string; chatId: string }) {
    if (typeof botTokenOrConfig === 'string') {
      this.botToken = botTokenOrConfig
      this.chatId = ''
      this.enabled = Boolean(botTokenOrConfig)
    } else {
      this.botToken = botTokenOrConfig.botToken
      this.chatId = botTokenOrConfig.chatId
      this.enabled = Boolean(botTokenOrConfig.botToken && botTokenOrConfig.chatId)
    }
  }

  isConfigured(): boolean {
    return this.enabled
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastSentAt
    if (elapsed < this.minIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed))
    }
    this.lastSentAt = Date.now()
  }

  async validateConnection(): Promise<boolean> {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/getMe`
      const res = await fetch(url)
      const data = await res.json() as { ok: boolean }
      return data.ok === true
    } catch {
      return false
    }
  }

  async sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'Markdown'): Promise<boolean> {
    if (!this.enabled) {
      console.warn('[Telegram] Not configured — skipping message')
      return false
    }

    await this.rateLimit()

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: parseMode,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error(`[Telegram] sendMessage failed: ${res.status} ${err}`)
        return false
      }

      return true
    } catch (err) {
      console.error('[Telegram] sendMessage error:', err)
      return false
    }
  }

  async notifyTaskCompleted(task: Task, tool: Tool): Promise<void> {
    const duration = task.completedAt && task.createdAt
      ? new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()
      : task.durationMs ?? 0

    const prompt = escapeMarkdown(truncate(task.prompt, 150))
    const toolName = escapeMarkdown(tool.name)
    const result = task.result ? escapeMarkdown(truncate(task.result, 300)) : '_No result_'

    const text = [
      '✅ *Task Completed*',
      '',
      `📝 *Prompt:* ${prompt}`,
      `🔧 *Tool:* ${toolName}`,
      `⏱ *Duration:* ${duration}ms`,
      '',
      '*Result:*',
      result,
    ].join('\n')

    await this.sendMessage(text)
  }

  async notifyTaskFailed(task: Task, error: string): Promise<void> {
    const prompt = escapeMarkdown(truncate(task.prompt, 150))
    const errMsg = escapeMarkdown(truncate(error, 200))

    const text = [
      '❌ *Task Failed*',
      '',
      `📝 *Prompt:* ${prompt}`,
      `⚠️ *Error:* ${errMsg}`,
    ].join('\n')

    await this.sendMessage(text)
  }

  async notifyToolStatusChange(tool: Tool, oldStatus: string, newStatus: string): Promise<void> {
    const toolName = escapeMarkdown(tool.name)
    const text = [
      '🔄 *Tool Status Changed*',
      '',
      `🔧 *${toolName}*: ${oldStatus} → ${newStatus}`,
    ].join('\n')

    await this.sendMessage(text)
  }
}
