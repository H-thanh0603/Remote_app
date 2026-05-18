import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme';
import { SlideUp, ScalePress } from './animations';
import type { RoutingSuggestion as RoutingSuggestionType } from '@remote-app/shared';

interface Props {
  suggestion: RoutingSuggestionType;
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
  const { theme } = useTheme();
  const confidence = Math.round(suggestion.confidence * 100);
  const icon = TOOL_ICONS[suggestion.toolId] ?? '🔧';

  // Animated confidence bar
  const barWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: confidence,
      duration: theme.animation.slow,
      useNativeDriver: false,
    }).start();
  }, [confidence, barWidth, theme.animation.slow]);

  return (
    <SlideUp duration={300}>
      <View style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary },
        theme.shadows.md,
      ]}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>💡 Gợi ý tool</Text>
          <View style={[styles.confidenceBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.confidenceText, { color: '#fff' }]}>{confidence}%</Text>
          </View>
        </View>

        <View style={styles.toolRow}>
          <Text style={styles.toolIcon}>{icon}</Text>
          <Text style={[styles.toolName, { color: theme.colors.text }]}>{suggestion.toolId}</Text>
        </View>

        {suggestion.reason && (
          <Text style={[styles.reason, { color: theme.colors.textSecondary }]}>{suggestion.reason}</Text>
        )}

        {/* Animated confidence bar */}
        <View style={[styles.barBg, { backgroundColor: theme.colors.surfaceLight }]}>
          <Animated.View
            style={[
              styles.barFill,
              {
                backgroundColor: theme.colors.primary,
                width: barWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>

        <View style={styles.actions}>
          <ScalePress onPress={onConfirm}>
            <View style={[styles.btn, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.confirmText}>✓ Confirm</Text>
            </View>
          </ScalePress>
          <ScalePress onPress={onChange}>
            <View style={[styles.btn, { backgroundColor: theme.colors.surfaceLight }]}>
              <Text style={[styles.changeText, { color: theme.colors.textSecondary }]}>↻ Change</Text>
            </View>
          </ScalePress>
        </View>
      </View>
    </SlideUp>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 3,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600' },
  confidenceBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  confidenceText: { fontSize: 12, fontWeight: '700' },
  toolRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  toolIcon: { fontSize: 24, marginRight: 8 },
  toolName: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  reason: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  barBg: { height: 4, borderRadius: 2, marginBottom: 14, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  changeText: { fontWeight: '600', fontSize: 14 },
});
