import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import type { RoutingSuggestion } from '@remote-app/shared';

interface Props {
  suggestion: RoutingSuggestion;
  onConfirm: () => void;
  onChange: () => void;
}

const TOOL_ICONS: Record<string, string> = {
  openclaw: '🦞',
  hermes: '🪄',
  kiro: '⚡',
  antigravity: '🚀',
  codex: '💻',
  'claude-code': '🤖',
};

export function RoutingSuggestion({ suggestion, onConfirm, onChange }: Props) {
  const confidence = Math.round(suggestion.confidence * 100);
  const icon = TOOL_ICONS[suggestion.toolId] ?? '🔧';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>💡 Gợi ý tool</Text>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>{confidence}%</Text>
        </View>
      </View>

      <View style={styles.toolRow}>
        <Text style={styles.toolIcon}>{icon}</Text>
        <Text style={styles.toolName}>{suggestion.toolId}</Text>
      </View>

      {suggestion.reason && (
        <Text style={styles.reason}>{suggestion.reason}</Text>
      )}

      {/* Confidence bar */}
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${confidence}%` as any }]} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={onConfirm}
          accessibilityLabel="Confirm tool suggestion"
          accessibilityRole="button"
        >
          <Text style={styles.confirmText}>✓ Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.changeButton]}
          onPress={onChange}
          accessibilityLabel="Change tool"
          accessibilityRole="button"
        >
          <Text style={styles.changeText}>↻ Change</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  confidenceBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  confidenceText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  toolIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  toolName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  reason: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  barContainer: {
    height: 4,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 2,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  changeButton: {
    backgroundColor: theme.colors.surfaceLight,
  },
  confirmText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: theme.fontSize.md,
  },
  changeText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: theme.fontSize.md,
  },
});
