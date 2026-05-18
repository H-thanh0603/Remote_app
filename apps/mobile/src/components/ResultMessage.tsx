import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface ResultMessageProps {
  content: string;
  toolName?: string;
  duration?: number;
  tokensUsed?: number;
}

const PREVIEW_LENGTH = 500;

export function ResultMessage({ content, toolName, duration, tokensUsed }: ResultMessageProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isLong = content.length > PREVIEW_LENGTH;
  const displayContent = isLong && !expanded ? content.slice(0, PREVIEW_LENGTH) + '...' : content;

  const handleCopy = async () => {
    try {
      // Use Clipboard from @react-native-clipboard/clipboard if available, fallback gracefully
      const { default: Clipboard } = await import('@react-native-clipboard/clipboard');
      Clipboard.setString(content);
    } catch {
      // Clipboard not available — silent fail
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.success },
      theme.shadows.sm,
    ]}>
      <View style={[styles.meta, { backgroundColor: theme.colors.surfaceLight }]}>
        {toolName && <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>🔧 {toolName}</Text>}
        {duration !== undefined && <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>⏱ {(duration / 1000).toFixed(1)}s</Text>}
        {tokensUsed !== undefined && <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>🪙 {tokensUsed} tokens</Text>}
      </View>
      <View style={styles.codeBlock}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={styles.codeText}>{displayContent}</Text>
        </ScrollView>
      </View>
      <View style={[styles.actions, { backgroundColor: theme.colors.surface }]}>
        {isLong && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)} style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceLight }]}>
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>{expanded ? 'Show less' : 'Show more'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleCopy} style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceLight }]}>
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>{copied ? '✅ Copied!' : '📋 Copy'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    borderLeftWidth: 3,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
  },
  metaText: { fontSize: 10 },
  codeBlock: {
    backgroundColor: '#0d1117',
    padding: 16,
    maxHeight: 300,
  },
  codeText: {
    color: '#e6edf3',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 8,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionText: { fontSize: 10, fontWeight: '600' },
});
