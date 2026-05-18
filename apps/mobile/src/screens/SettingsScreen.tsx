import React, { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, Text, StyleSheet, Alert, ActivityIndicator, Linking, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SettingsSection } from '../components/SettingsSection'
import { SettingsItem } from '../components/SettingsItem'
import { settingsApi, type Settings } from '../services/settings'
import { useApi } from '../hooks/useApi'
import { useTheme } from '../theme'

interface UserPreferences {
  defaultTool: string | null
  autoConfirm: boolean
  autoConfirmThreshold: number
  theme: 'dark' | 'light'
  language: 'en' | 'vi'
  showTokenUsage: boolean
  showDuration: boolean
  telegramEnabled: boolean
  notifyOnComplete: boolean
  notifyOnFail: boolean
  notifyOnToolError: boolean
  historyRetentionDays: number
  autoDeleteOldTasks: boolean
}

const DEFAULT_PREFS: UserPreferences = {
  defaultTool: null,
  autoConfirm: false,
  autoConfirmThreshold: 0.9,
  theme: 'dark',
  language: 'vi',
  showTokenUsage: true,
  showDuration: true,
  telegramEnabled: false,
  notifyOnComplete: true,
  notifyOnFail: true,
  notifyOnToolError: true,
  historyRetentionDays: 30,
  autoDeleteOldTasks: false,
}

const TOOL_OPTIONS = [
  { label: 'Auto (AI decides)', value: null },
  { label: 'OpenClaw', value: 'openclaw' },
  { label: 'Hermes', value: 'hermes' },
  { label: 'Kiro', value: 'kiro' },
  { label: 'Antigravity', value: 'antigravity' },
  { label: 'Codex', value: 'codex' },
  { label: 'Claude Code', value: 'claude-code' },
]

const RETENTION_OPTIONS = [7, 30, 90, 365]

const DEFAULT_SETTINGS: Settings = {
  llm_base_url: '',
  llm_api_key: '',
  llm_model: 'gpt-4o-mini',
  telegram_bot_token: '',
  telegram_chat_id: '',
  telegram_enabled: 'false',
  notification_task_completed: 'true',
  notification_task_failed: 'true',
  notification_tool_error: 'false',
  theme: 'dark',
  language: 'en',
}

const LLM_MODELS = ['gpt-4o-mini', 'gpt-4o', 'claude-sonnet-4.6', 'claude-opus-4.6', 'deepseek-chat']

export function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme()
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [testingTelegram, setTestingTelegram] = useState(false)
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const { getPreferences, updatePreference, resetPreferences } = useApi()

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const [res, prefsData] = await Promise.all([
        settingsApi.getAll(),
        getPreferences(),
      ])
      if (res.success && res.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...res.data })
      }
      if (prefsData) setPrefs(prefsData)
      setServerStatus('online')
    } catch {
      setServerStatus('offline')
    } finally {
      setLoading(false)
    }
  }, [getPreferences])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const updatePref = useCallback(async (key: string, value: unknown) => {
    setSaving(key)
    const updated = await updatePreference(key, value)
    if (updated) setPrefs(updated as UserPreferences)
    setSaving(null)
  }, [updatePreference])

  const handleResetPrefs = useCallback(async () => {
    Alert.alert('Reset Preferences', 'Reset all preferences to defaults?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          const updated = await resetPreferences()
          if (updated) setPrefs(updated as UserPreferences)
        }
      },
    ])
  }, [resetPreferences])

  const updateSetting = useCallback(async (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaving(key)
    try {
      await settingsApi.update(key, value)
    } catch (err) {
      Alert.alert('Error', `Failed to save ${key}`)
      void loadSettings()
    } finally {
      setSaving(null)
    }
  }, [loadSettings])

  const handleValidate = async () => {
    setValidating(true)
    try {
      const res = await settingsApi.validateConnection()
      if (res.success && res.data) {
        const results = res.data
        const lines = Object.entries(results).map(
          ([k, v]) => `${v.ok ? '✅' : '❌'} ${k}: ${v.message}`
        )
        Alert.alert('Connection Test', lines.join('\n'))
      }
    } catch {
      Alert.alert('Error', 'Failed to validate connections')
    } finally {
      setValidating(false)
    }
  }

  const handleTestTelegram = async () => {
    setTestingTelegram(true)
    try {
      const res = await settingsApi.testTelegram()
      if (res.success) {
        Alert.alert('Success', 'Test message sent to Telegram!')
      } else {
        Alert.alert('Failed', 'Could not send test message. Check your bot token and chat ID.')
      }
    } catch {
      Alert.alert('Error', 'Failed to send test message')
    } finally {
      setTestingTelegram(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ backgroundColor: theme.colors.background }}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading settings...</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ backgroundColor: theme.colors.background }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>⚙️ Settings</Text>
        {saving && (
          <View style={styles.savingBadge}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.savingText, { color: theme.colors.textSecondary }]}>Saving...</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadSettings}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* 🤖 AI Configuration */}
        <SettingsSection title="🤖 AI Configuration">
          <SettingsItem
            type="text"
            label="LLM API URL"
            description="Base URL for your LLM API (e.g. http://127.0.0.1:20128/v1)"
            value={settings.llm_base_url}
            onChangeText={v => updateSetting('llm_base_url', v)}
            placeholder="http://127.0.0.1:20128/v1"
            keyboardType="url"
          />
          <SettingsItem
            type="text"
            label="API Key"
            description="Your LLM API key (stored securely)"
            value={settings.llm_api_key}
            onChangeText={v => updateSetting('llm_api_key', v)}
            placeholder="sk-..."
            secureTextEntry
          />
          <SettingsItem
            type="text"
            label="Default Model"
            description={`Current: ${settings.llm_model} | Options: ${LLM_MODELS.join(', ')}`}
            value={settings.llm_model}
            onChangeText={v => updateSetting('llm_model', v)}
            placeholder="gpt-4o-mini"
          />
          <SettingsItem
            type="button"
            label="Test Connection"
            description="Validate LLM and Telegram connections"
            onPress={handleValidate}
            loading={validating}
            isLast
          />
        </SettingsSection>

        {/* 📱 Telegram */}
        <SettingsSection title="📱 Telegram">
          <SettingsItem
            type="text"
            label="Bot Token"
            description="Your Telegram bot token from @BotFather"
            value={settings.telegram_bot_token}
            onChangeText={v => updateSetting('telegram_bot_token', v)}
            placeholder="123456:ABC-DEF..."
            secureTextEntry
          />
          <SettingsItem
            type="text"
            label="Chat ID"
            description="Your Telegram chat ID (e.g. 8511701523)"
            value={settings.telegram_chat_id}
            onChangeText={v => updateSetting('telegram_chat_id', v)}
            placeholder="8511701523"
            keyboardType="numeric"
          />
          <SettingsItem
            type="switch"
            label="Enable Notifications"
            description="Send task results to Telegram"
            value={settings.telegram_enabled === 'true'}
            onValueChange={v => updateSetting('telegram_enabled', v ? 'true' : 'false')}
          />
          <SettingsItem
            type="button"
            label="Send Test Message"
            description="Send a test notification to verify setup"
            onPress={handleTestTelegram}
            loading={testingTelegram}
            isLast
          />
        </SettingsSection>

        {/* 🔔 Notifications */}
        <SettingsSection title="🔔 Notifications">
          <SettingsItem
            type="switch"
            label="Task Completed"
            description="Notify when a task finishes successfully"
            value={settings.notification_task_completed === 'true'}
            onValueChange={v => updateSetting('notification_task_completed', v ? 'true' : 'false')}
          />
          <SettingsItem
            type="switch"
            label="Task Failed"
            description="Notify when a task encounters an error"
            value={settings.notification_task_failed === 'true'}
            onValueChange={v => updateSetting('notification_task_failed', v ? 'true' : 'false')}
          />
          <SettingsItem
            type="switch"
            label="Tool Errors"
            description="Notify when a tool goes offline or errors"
            value={settings.notification_tool_error === 'true'}
            onValueChange={v => updateSetting('notification_tool_error', v ? 'true' : 'false')}
            isLast
          />
        </SettingsSection>

        {/* 🤖 Routing */}
        <SettingsSection title="🤖 Routing">
          <SettingsItem
            type="info"
            label="Default Tool"
            value={TOOL_OPTIONS.find(t => t.value === prefs.defaultTool)?.label ?? 'Auto'}
            description="Tap to cycle through tools"
            onPress={() => {
              const idx = TOOL_OPTIONS.findIndex(t => t.value === prefs.defaultTool)
              const next = TOOL_OPTIONS[(idx + 1) % TOOL_OPTIONS.length]
              if (next) void updatePref('defaultTool', next.value)
            }}
          />
          <SettingsItem
            type="switch"
            label="Auto-Confirm"
            description="Skip suggestion card and execute immediately when confidence is high"
            value={prefs.autoConfirm}
            onValueChange={v => void updatePref('autoConfirm', v)}
          />
          <SettingsItem
            type="info"
            label="Auto-Confirm Threshold"
            value={`${Math.round(prefs.autoConfirmThreshold * 100)}%`}
            description="Tap to adjust (50% → 60% → 70% → 80% → 90% → 100%)"
            onPress={() => {
              const steps = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
              const idx = steps.indexOf(prefs.autoConfirmThreshold)
              const next = steps[(idx + 1) % steps.length]
              void updatePref('autoConfirmThreshold', next)
            }}
            isLast
          />
        </SettingsSection>

        {/* 📋 History */}
        <SettingsSection title="📋 History">
          <SettingsItem
            type="info"
            label="Retention Period"
            value={`${prefs.historyRetentionDays} days`}
            description="Tap to cycle: 7 → 30 → 90 → 365 days"
            onPress={() => {
              const idx = RETENTION_OPTIONS.indexOf(prefs.historyRetentionDays)
              const next = RETENTION_OPTIONS[(idx + 1) % RETENTION_OPTIONS.length]
              void updatePref('historyRetentionDays', next)
            }}
          />
          <SettingsItem
            type="switch"
            label="Auto-Delete Old Tasks"
            description="Automatically delete tasks older than retention period"
            value={prefs.autoDeleteOldTasks}
            onValueChange={v => void updatePref('autoDeleteOldTasks', v)}
          />
          <SettingsItem
            type="switch"
            label="Show Token Usage"
            description="Display token count in task results"
            value={prefs.showTokenUsage}
            onValueChange={v => void updatePref('showTokenUsage', v)}
          />
          <SettingsItem
            type="switch"
            label="Show Duration"
            description="Display execution time in task results"
            value={prefs.showDuration}
            onValueChange={v => void updatePref('showDuration', v)}
          />
          <SettingsItem
            type="button"
            label="Reset All Preferences"
            description="Restore all preferences to defaults"
            onPress={handleResetPrefs}
            isLast
          />
        </SettingsSection>

        {/* 🎨 Appearance */}
        <SettingsSection title="🎨 Appearance">
          <SettingsItem
            type="switch"
            label={isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
            description="Toggle dark/light theme instantly"
            value={isDark}
            onValueChange={() => toggleTheme()}
          />
          <SettingsItem
            type="switch"
            label="Vietnamese Language"
            description="Switch between English and Vietnamese"
            value={settings.language === 'vi'}
            onValueChange={v => updateSetting('language', v ? 'vi' : 'en')}
            isLast
          />
        </SettingsSection>

        {/* ℹ️ About */}
        <SettingsSection title="ℹ️ About">
          <SettingsItem
            type="info"
            label="Version"
            value="1.0.0-mvp"
          />
          <SettingsItem
            type="info"
            label="Server Status"
            value={serverStatus === 'online' ? '🟢 Online' : serverStatus === 'offline' ? '🔴 Offline' : '🟡 Checking...'}
          />
          <SettingsItem
            type="button"
            label="View on GitHub"
            description="github.com/H-thanh0603/Remote_app"
            onPress={() => Linking.openURL('https://github.com/H-thanh0603/Remote_app')}
            isLast
          />
        </SettingsSection>
      </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  savingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingText: {
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
})
