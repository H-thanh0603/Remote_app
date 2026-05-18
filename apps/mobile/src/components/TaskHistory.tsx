import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { theme } from '../theme';
import type { Task } from '@remote-app/shared';

interface TaskHistoryItemProps {
  task: Task;
}

function TaskHistoryItem({ task }: TaskHistoryItemProps) {
  const [expanded, setExpanded] = useState(false);

  const statusColor: Record<string, string> = {
    completed: theme.colors.success,
    failed: theme.colors.error,
    running: theme.colors.primary,
    pending: theme.colors.textSecondary,
    confirmed: theme.colors.primary,
    cancelled: theme.colors.textSecondary,
  };

  const statusIcon: Record<string, string> = {
    completed: '✅',
    failed: '❌',
    running: '⏳',
    pending: '🕐',
    confirmed: '🔄',
    cancelled: '🚫',
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.statusIcon}>{statusIcon[task.status] ?? '❓'}</Text>
        <View style={styles.itemInfo}>
          <Text style={styles.prompt} numberOfLines={expanded ? undefined : 2}>
            {task.prompt}
          </Text>
          <View style={styles.itemMeta}>
            {task.confirmedTool && <Text style={styles.metaChip}>🔧 {task.confirmedTool}</Text>}
            <Text style={[styles.metaChip, { color: statusColor[task.status] ?? theme.colors.textSecondary }]}>{task.status}</Text>
            <Text style={styles.metaChip}>🕐 {timeAgo(task.createdAt)}</Text>
          </View>
        </View>
      </View>
      {expanded && task.result && (
        <View style={styles.resultPreview}>
          <Text style={styles.resultText} numberOfLines={5}>{task.result}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface TaskHistoryProps {
  tasks: Task[];
}

export function TaskHistory({ tasks }: TaskHistoryProps) {
  if (tasks.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No tasks yet</Text>
        <Text style={styles.emptySubtext}>Your task history will appear here</Text>
      </View>
    );
  }

  return (
    <View>
      {tasks.map(task => (
        <TaskHistoryItem key={task.id} task={task} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statusIcon: { fontSize: 18 },
  itemInfo: { flex: 1 },
  prompt: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    lineHeight: 20,
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: theme.spacing.xs,
  },
  metaChip: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultPreview: {
    marginTop: theme.spacing.sm,
    backgroundColor: '#0d1117',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  resultText: {
    color: '#e6edf3',
    fontFamily: 'monospace',
    fontSize: theme.fontSize.xs,
  },
  empty: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl * 2,
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
  emptySubtext: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    marginTop: theme.spacing.sm,
  },
});
