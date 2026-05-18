import { TelegramService } from './telegram.js'
import { NotificationService } from './notifications.js'
import { config } from '../config.js'

export const telegramService = new TelegramService({
  botToken: config.telegram.botToken,
  chatId: config.telegram.chatId,
})

export const notificationService = new NotificationService(telegramService)

// Load preferences from DB on startup
notificationService.loadPreferences().catch((err) => {
  console.warn('[Notifications] Failed to load preferences:', err)
})
