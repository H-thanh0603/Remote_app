import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { useTheme } from '../theme';
import { ScalePress, PulseIndicator } from './animations';
import type { Tool } from '@remote-app/shared';

interface Props {
  tool: Tool;
  onPress?: () => void;
}

const TOOL_ICONS: Record<string, string> = {
  openclaw: '🦞',
  hermes: '🪄',
  kiro: '⚡',
  antigravity: '🚀',
  codex: '💻',
  'claude-code': '🤖',
};

export function ToolCard({ tool, onPress }: Props) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const icon = TOOL_ICONS[tool.id] ?? '🔧';
  const isRunning = tool.status === 'running';

  const statusColor = {
    running: theme.colors.success,
    idle: theme.colors.idle,
    error: theme.colors.error,
    offline: theme.colors.border,
  }[tool.status] ?? theme.colors.idle;

  // Smooth color transition for status
  const colorAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: isRunning ? 1 : 0,
      duration: theme.animation.normal,
      useNativeDriver: false,
    }).start();
  }, [isRunning, colorAnim, theme.animation.normal]);

  const formatLastSeen = (ts?: string) => {
    if (!ts) return null;
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <>
      <ScalePress onPress={() => onPress ? onPress() : setExpanded(true)}>
        <View style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          theme.shadows.sm,
        ]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceLight }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: theme.colors.text }]}>{tool.name}</Text>
              {onPress && <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>›</Text>}
              <View style={styles.statusRow}>
                {isRunning && <PulseIndicator />}
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{tool.status}</Text>
                </View>
              </View>
            </View>
            {tool.lastSeenAt && (
              <Text style={[styles.lastActive, { color: theme.colors.textSecondary }]}>
                {formatLastSeen(tool.lastSeenAt)}
              </Text>
            )}
          </View>
        </View>
      </ScalePress>

      <Modal visible={expanded} transparent animationType="slide" onRequestClose={() => setExpanded(false)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setExpanded(false)} activeOpacity={1}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }, theme.shadows.lg]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalIcon}>{icon}</Text>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{tool.name}</Text>
              <View style={[styles.modalBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.modalBadgeText}>{tool.status}</Text>
              </View>
            </View>
            {tool.description && (
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{tool.description}</Text>
            )}
            <ScalePress onPress={() => setExpanded(false)}>
              <View style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceLight }]}>
                <Text style={[styles.closeText, { color: theme.colors.text }]}>Close</Text>
              </View>
            </ScalePress>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  lastActive: { fontSize: 12, marginTop: 3 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#94A3B8', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  modalIcon: { fontSize: 32, marginRight: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  modalBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  modalBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  closeBtn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  closeText: { fontWeight: '600', fontSize: 15 },
});
