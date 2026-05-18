import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { ToolCard } from '../components/ToolCard';
import { Header } from '../components/Header';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Tool } from '@remote-app/shared';

export function StatusScreen() {
  const insets = useSafeAreaInsets();
  const [tools, setTools] = useState<Tool[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { fetchTools } = useApi();
  const { connected, tools: wsTools } = useWebSocket();

  const loadTools = useCallback(async () => {
    const data = await fetchTools();
    if (data.length > 0) setTools(data);
  }, [fetchTools]);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  useEffect(() => {
    if (wsTools.length > 0) setTools(wsTools);
  }, [wsTools]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTools();
    setRefreshing(false);
  }, [loadTools]);

  const runningCount = tools.filter(t => t.status === 'running').length;
  const idleCount = tools.filter(t => t.status === 'idle').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Tool Status"
        subtitle={connected ? '🟢 Connected' : '🔴 Disconnected'}
      />
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: theme.colors.success }]}>{runningCount}</Text>
          <Text style={styles.summaryLabel}>Running</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: theme.colors.idle }]}>{idleCount}</Text>
          <Text style={styles.summaryLabel}>Idle</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: theme.colors.text }]}>{tools.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>
      <ScrollView
        style={styles.flex}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.listContent}>
          {tools.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No tools found</Text>
              <Text style={styles.emptySubtext}>Pull to refresh</Text>
            </View>
          ) : (
            tools.map(tool => <ToolCard key={tool.id} tool={tool} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  summary: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: theme.fontSize.xxl, fontWeight: '700' },
  summaryLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: theme.colors.surfaceLight },
  listContent: { padding: theme.spacing.md },
  empty: { alignItems: 'center', paddingTop: theme.spacing.xl * 2 },
  emptyText: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: '600' },
  emptySubtext: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, marginTop: theme.spacing.sm },
});
