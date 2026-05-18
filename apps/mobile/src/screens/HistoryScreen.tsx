import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Header } from '../components/Header';
import { useApi } from '../hooks/useApi';
import type { Task as SharedTask } from '@remote-app/shared';

type StatusFilter = 'all' | 'completed' | 'failed' | 'running' | 'pending';
type DateFilter = 'today' | 'week' | 'month' | 'all';

interface Stats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  byTool: Record<string, number>;
  avgDuration: number;
}

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'completed', label: '✅ Xong' },
  { key: 'failed', label: '❌ Lỗi' },
  { key: 'running', label: '⚡ Đang chạy' },
  { key: 'pending', label: '⏳ Chờ' },
];

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần này' },
  { key: 'month', label: 'Tháng này' },
];

function getDateRange(filter: DateFilter): { from?: string; to?: string } {
  const now = new Date();
  if (filter === 'today') {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    return { from };
  }
  if (filter === 'week') {
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return { from };
  }
  if (filter === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return { from };
  }
  return {};
}

  function statusColor(status: string): string {
    switch (status) {
      case 'completed': return theme.colors.success;
      case 'failed': return theme.colors.error;
      case 'running': return theme.colors.primary;
      case 'cancelled': return theme.colors.textMuted;
      default: return theme.colors.textSecondary;
    }
  }

export function HistoryScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { searchTasks, getTaskStats } = useApi();

  const [tasks, setTasks] = useState<SharedTask[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const LIMIT = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStats = useCallback(async () => {
    const data = await getTaskStats();
    if (data) setStats(data);
  }, [getTaskStats]);

  const fetchTasks = useCallback(async (reset = false) => {
    setLoading(true);
    const currentOffset = reset ? 0 : offset;
    const { from, to } = getDateRange(dateFilter);

    const result = await searchTasks({
      limit: LIMIT,
      offset: currentOffset,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: debouncedSearch || undefined,
      from,
      to,
    });

    if (result) {
      setTotal(result.total);
      setTasks(prev => reset ? result.tasks : [...prev, ...result.tasks]);
      setHasMore(currentOffset + result.tasks.length < result.total);
      if (!reset) setOffset(currentOffset + result.tasks.length);
    }
    setLoading(false);
  }, [offset, statusFilter, debouncedSearch, dateFilter, searchTasks]);

  // Reset and refetch when filters change
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchTasks(true);
    fetchStats();
  }, [statusFilter, debouncedSearch, dateFilter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setOffset(0);
    setHasMore(true);
    await Promise.all([fetchTasks(true), fetchStats()]);
    setRefreshing(false);
  }, [fetchTasks, fetchStats]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) fetchTasks(false);
  }, [loading, hasMore, fetchTasks]);

  const renderTask = useCallback(({ item }: { item: SharedTask }) => {
    const expanded = expandedId === item.id;
    const tool = item.confirmedTool ?? item.suggestedTool ?? '?';
    const duration = item.durationMs ? `${(item.durationMs / 1000).toFixed(1)}s` : null;

    return (
      <TouchableOpacity
        style={[styles.taskCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={() => setExpandedId(expanded ? null : item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.taskHeader}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
          <Text style={[styles.taskPrompt, { color: theme.colors.text }]} numberOfLines={expanded ? undefined : 2}>
            {item.prompt}
          </Text>
        </View>
        <View style={styles.taskMeta}>
          <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>🔧 {tool}</Text>
          {duration && <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>⏱ {duration}</Text>}
          {item.tokensUsed ? <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>🪙 {item.tokensUsed}</Text> : null}
          <Text style={[styles.metaText, { color: statusColor(item.status) }]}>{item.status}</Text>
        </View>
        {expanded && (item.result || item.error) && (
          <View style={[styles.taskResult, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.resultText, { color: theme.colors.textSecondary }]} numberOfLines={10}>
              {item.result ?? item.error}
            </Text>
          </View>
        )}
        <Text style={[styles.taskDate, { color: theme.colors.textMuted }]}>
          {new Date(item.createdAt).toLocaleString('vi-VN')}
        </Text>
      </TouchableOpacity>
    );
  }, [expandedId, theme]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      <Header title="Lịch sử" subtitle={`${total} tasks`} />

      {stats && (
        <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Tổng</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Xong</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.error }]}>{stats.failed}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Lỗi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Thành công</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{(stats.avgDuration / 1000).toFixed(1)}s</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>TB thời gian</Text>
          </View>
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
          placeholder="🔍 Tìm kiếm task..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              statusFilter === f.key && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text style={[styles.chipText, { color: theme.colors.textSecondary },
              statusFilter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {DATE_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              dateFilter === f.key && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
            onPress={() => setDateFilter(f.key)}
          >
            <Text style={[styles.chipText, { color: theme.colors.textSecondary },
              dateFilter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task list */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
          if (isNearBottom) handleLoadMore();
        }}
        scrollEventThrottle={400}
      >
        {tasks.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Không có task nào</Text>
          </View>
        )}
        {tasks.map(item => renderTask({ item }))}
        {loading && <ActivityIndicator color={theme.colors.primary} style={{ margin: 16 }} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2 },
  searchContainer: { paddingHorizontal: 16, paddingTop: 8 },
  searchInput: {
    borderRadius: 12,
    padding: 8,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 4,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {},
  chipText: { fontSize: 12 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  listContent: { padding: 16, gap: 8 },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  taskPrompt: { flex: 1, fontSize: 14 },
  taskMeta: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 10 },
  taskResult: {
    marginTop: 8,
    borderRadius: 8,
    padding: 8,
  },
  resultText: { fontSize: 12, fontFamily: 'monospace' },
  taskDate: { fontSize: 10, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14 },
});
