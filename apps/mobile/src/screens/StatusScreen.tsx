import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { ToolCard } from '../components/ToolCard';
import { Header } from '../components/Header';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Tool } from '@remote-app/shared';

interface StatusScreenProps {
  navigation?: any;
}

function PulseDot({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [active, scale]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { transform: [{ scale }] },
        { backgroundColor: active ? theme.colors.success : theme.colors.textSecondary },
      ]}
    />
  );
}

export function StatusScreen({ navigation }: StatusScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [tools, setTools] = useState<Tool[]>([]);
  const { fetchTools } = useApi();
  const { connected, tools: wsTools } = useWebSocket();

  const loadTools = useCallback(async () => {
    const data = await fetchTools();
    if (data.length > 0) setTools(data);
  }, [fetchTools]);

  useEffect(() => { loadTools(); }, [loadTools]);

  // Real-time update via WebSocket — no pull-to-refresh needed
  useEffect(() => {
    if (wsTools.length > 0) setTools(wsTools);
  }, [wsTools]);

  const runningCount = tools.filter(t => t.status === 'running').length;
  const idleCount = tools.filter(t => t.status === 'idle').length;
  const errorCount = tools.filter(t => t.status === 'error').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      <Header title="Tool Status" subtitle={connected ? '🟢 Live' : '🔴 Disconnected'} />
      <View style={[styles.summary, { backgroundColor: theme.colors.surface, ...theme.shadows.sm }]}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryRow}>
            <PulseDot active={runningCount > 0} />
            <Text style={[styles.summaryCount, { color: theme.colors.success }]}>{runningCount}</Text>
          </View>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Running</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: theme.colors.textSecondary }]}>{idleCount}</Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Idle</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: theme.colors.error }]}>{errorCount}</Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Error</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: theme.colors.text }]}>{tools.length}</Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total</Text>
        </View>
      </View>
      <ScrollView style={styles.flex}>
        <View style={styles.listContent}>
          {tools.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>No tools found</Text>
            </View>
          ) : (
            tools.map(tool => <ToolCard key={tool.id} tool={tool} onPress={() => navigation?.navigate('ToolDetail', { toolId: tool.id })} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  summary: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryCount: { fontSize: 24, fontWeight: '700' },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  summaryDivider: { width: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  listContent: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 64 },
  emptyText: { fontSize: 16, fontWeight: '600' },
});
