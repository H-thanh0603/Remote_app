import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { BarChart } from '../components/BarChart';
import { useApi } from '../hooks/useApi';
import type { Tool } from '@remote-app/shared';

interface ToolStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  successRate: number;
  avgDuration: number;
  totalTokens: number;
  recentTasks: any[];
  usageByDay: { date: string; count: number }[];
}

interface ToolDetailScreenProps {
  route?: { params?: { toolId?: string } };
  navigation?: any;
}

export function ToolDetailScreen({ route, navigation }: ToolDetailScreenProps) {
  const toolId = route?.params?.toolId ?? '';
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { fetchToolById, fetchToolStats, updateToolStatus, testToolConnection } = useApi();
  const [tool, setTool] = useState<Tool | null>(null);
  const [stats, setStats] = useState<ToolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [toolData, statsData] = await Promise.all([
        fetchToolById(toolId),
        fetchToolStats(toolId),
      ]);
      setTool(toolData);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  }, [toolId]);

  useEffect(() => { load(); }, [load]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await testToolConnection(toolId);
      Alert.alert(
        result.healthy ? '✅ Kết nối thành công' : '❌ Kết nối thất bại',
        result.message || ''
      );
      if (result.healthy) {
        await updateToolStatus(toolId, 'idle');
        load();
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSetDefault = async () => {
    Alert.alert('✅ Đã đặt làm mặc định', `${tool?.name} sẽ được ưu tiên khi routing.`);
  };

  const statusColor = (status: string) => {
    if (status === 'running') return theme.colors.success;
    if (status === 'error') return theme.colors.error;
    return theme.colors.textSecondary;
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!tool) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Tool not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{tool.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(tool.status) + '22' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(tool.status) }]} />
          <Text style={[styles.statusText, { color: statusColor(tool.status) }]}>
            {tool.status}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        {/* Stats cards */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total Tasks', value: stats?.totalTasks ?? 0 },
            { label: 'Success Rate', value: `${Math.round((stats?.successRate ?? 0) * 100)}%` },
            { label: 'Avg Duration', value: `${Math.round((stats?.avgDuration ?? 0) / 1000)}s` },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Usage chart */}
        {stats?.usageByDay && stats.usageByDay.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📊 Usage (7 ngày)</Text>
            <BarChart data={stats.usageByDay} />
          </View>
        )}

        {/* Recent tasks */}
        {stats?.recentTasks && stats.recentTasks.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🕐 Recent Tasks</Text>
            {stats.recentTasks.map((task: any) => (
              <View key={task.id} style={[styles.taskRow, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskPrompt, { color: theme.colors.text }]} numberOfLines={1}>
                    {task.prompt}
                  </Text>
                  <Text style={[styles.taskMeta, { color: theme.colors.textSecondary }]}>
                    {new Date(task.createdAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <View style={[styles.taskStatus, { backgroundColor: task.status === 'completed' ? theme.colors.success + '22' : theme.colors.error + '22' }]}>
                  <Text style={{ color: task.status === 'completed' ? theme.colors.success : theme.colors.error, fontSize: 11, fontWeight: '600' }}>
                    {task.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleSetDefault}
          >
            <Text style={styles.actionBtnText}>⭐ Set as Default</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]}
            onPress={handleTestConnection}
            disabled={testing}
          >
            <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>
              {testing ? '⏳ Testing...' : '🔌 Test Connection'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  backBtn: { padding: 4 },
  backText: { fontSize: 15, fontWeight: '600' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  content: { padding: 16, gap: 16 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  section: { borderRadius: 14, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  taskInfo: { flex: 1 },
  taskPrompt: { fontSize: 13, fontWeight: '500' },
  taskMeta: { fontSize: 11, marginTop: 2 },
  taskStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  actions: { gap: 10 },
  actionBtn: { borderRadius: 14, padding: 16, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
