import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { theme } from '../theme'

interface SettingsSectionProps {
  title: string
  children: React.ReactNode
  style?: ViewStyle
}

export function SettingsSection({ title, children, style }: SettingsSectionProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.surfaceLight,
  },
})
