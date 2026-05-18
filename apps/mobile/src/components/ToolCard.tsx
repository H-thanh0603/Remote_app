import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { theme } from '../theme';
import type { Tool } from '@remote-app/shared';

interface Props {
  tool: Tool;
}

const TOOL_ICONS: Record<string, string> = {
  openclaw: '🦞',
  hermes: '🪄',
  kiro: '⚡',
  antigravity: '🚀',
  codex: '💻',
  'claude-code': '🤖',
};

const STATUS_COLORS: Record<string, string> = {
  running: theme.colors.success,
  idle: theme.colors.idle,
  error: theme.colors.error,
  offline: '#1E293B',
};

export function ToolCard({ tool }: Props) {
  const [expanded, setExpanded] = useState(false);
  const icon = TOOL_ICONS[tool.id] ?? '🔧';
  const statusColor = STATUS_COLORS[tool.status] ?? theme.colors.idle;

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpanded(true)}
        accessibilityLabel={`${tool.name} - ${tool.status}`}
        accessibilityRole="button"
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{tool.name}</Text>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          </View>
          <Text style={styles.status}>{tool.status}</Text>
          {tool.lastSeenAt && (
            <Text style={styles.lastActive}>
              Last: {new Date(tool.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={expanded}
        transparent
        animationType="slide"
        onRequestClose={() => setExpanded(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setExpanded(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalIcon}>{icon}</Text>
              <Text style={styles.modalTitle}>{tool.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusBadgeText}>{tool.status}</Text>
              </View>
            </View>
            {tool.description && (
              <Text style={styles.description}>{tool.description}</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setExpanded(false)}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  status: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  lastActive: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalIcon: { fontSize: 32, marginRight: theme.spacing.md },
  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  closeButton: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  closeText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: theme.fontSize.md,
  },
});
