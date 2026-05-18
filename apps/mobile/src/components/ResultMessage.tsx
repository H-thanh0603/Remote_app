import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  StyleSheet,
} from 'react-native';
import { theme } from '../theme';

interface ResultMessageProps {
  content: string;
  toolName?: string;
  duration?: number;
  tokensUsed?: number;
}

const PREVIEW_LENGTH = 500;

export function ResultMessage({ content, toolName, duration, tokensUsed }: ResultMessageProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isLong = content.length > PREVIEW_LENGTH;
  const displayContent = isLong && !expanded ? content.slice(0, PREVIEW_LENGTH) + '...' : content;

  const handleCopy = () => {
    Clipboard.setString(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      {/* Metadata */}
      <View style={styles.meta}>
        {toolName && <Text style={styles.metaText}>🔧 {toolName}</Text>}
        {duration !== undefined && <Text style={styles.metaText}>⏱ {(duration / 1000).toFixed(1)}s</Text>}
        {tokensUsed !== undefined && <Text style={styles.metaText}>🪙 {tokensUsed} tokens</Text>}
      </View>

      {/* Code block */}
      <View style={styles.codeBlock}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={styles.codeText}>{displayContent}</Text>
        </ScrollView>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {isLong && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.actionBtn}>
            <Text style={styles.actionText}>{expanded ? 'Show less' : 'Show more'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleCopy} style={styles.actionBtn}>
          <Text style={styles.actionText}>{copied ? '✅ Copied!' : '📋 Copy'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceLight,
  },
  metaText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },
  codeBlock: {
    backgroundColor: '#0d1117',
    padding: theme.spacing.md,
    maxHeight: 300,
  },
  codeText: {
    color: '#e6edf3',
    fontFamily: 'monospace',
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceLight,
  },
  actionText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
});
