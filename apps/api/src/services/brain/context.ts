// ─── Context Manager ─────────────────────────────────────────────────────────
// Manages conversation history and provides relevant context to the brain.

import type { ConversationMessage } from './types.js'

const MAX_HISTORY = 50

export class ContextManager {
  private history: ConversationMessage[] = []
  private sessionId: string

  constructor(sessionId?: string) {
    this.sessionId = sessionId ?? crypto.randomUUID()
  }

  getSessionId(): string {
    return this.sessionId
  }

  addMessage(msg: Omit<ConversationMessage, 'id' | 'timestamp'>): ConversationMessage {
    const full: ConversationMessage = {
      ...msg,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    this.history.push(full)

    // Trim old messages
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(-MAX_HISTORY)
    }

    return full
  }

  getHistory(limit?: number): ConversationMessage[] {
    const n = limit ?? MAX_HISTORY
    return this.history.slice(-n)
  }

  getRecentContext(maxMessages = 10): ConversationMessage[] {
    return this.history.slice(-maxMessages)
  }

  /**
   * Build a condensed summary of recent context for LLM consumption
   */
  buildContextString(maxMessages = 8): string {
    const recent = this.getRecentContext(maxMessages)
    if (recent.length === 0) return '(No prior conversation)'

    return recent.map(m => {
      const role = m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Assistant' : 'System'
      const meta = m.metadata?.toolId ? ` [tool: ${m.metadata.toolId}]` : ''
      return `${role}${meta}: ${m.content}`
    }).join('\n')
  }

  clear(): void {
    this.history = []
  }

  getMessageCount(): number {
    return this.history.length
  }
}
