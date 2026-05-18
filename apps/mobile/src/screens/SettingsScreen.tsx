import React, { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, Text, StyleSheet, Alert, ActivityIndicator, Linking, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SettingsSection } from '../components/SettingsSection'
import { SettingsItem } from '../components/SettingsItem'
import { settingsApi, type Settings } from '../services/settings'
import { theme } from '../theme'

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
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [testingTelegram, setTestingTelegram] = useState(false)
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await settingsApi.getAll()
      if (res.success && res.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...res.data })
      }
      setServerStatus('online')
    } catch {
      setServerStatus('offline')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

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
      <SafeAreaView edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading settings...</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top', 'bottom']}>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
        {saving && (
          <View style={styles.savingBadge}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.savingText}>Saving...</Text>
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

        {/* 🎨 Appearance */}
        <SettingsSection title="🎨 Appearance">
          <SettingsItem
            type="switch"
            label="Dark Mode"
            description="Toggle dark/light theme"
            value={settings.theme === 'dark'}
            onValueChange={v => updateSetting('theme', v ? 'dark' : 'light')}
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
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  savingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
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
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
})
