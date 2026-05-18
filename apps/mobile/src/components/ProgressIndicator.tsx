import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  toolName: string;
  progressText?: string;
  onCancel?: () => void;
}

export function ProgressIndicator({ toolName, progressText, onCancel }: Props) {
  const { theme } = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, [dot1, dot2, dot3]);

  const formatElapsed = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.primary },
      theme.shadows.sm,
    ]}>
      <View style={styles.row}>
        <View style={styles.dots}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { backgroundColor: theme.colors.primary, opacity: dot }]}
            />
          ))}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.mainText, { color: theme.colors.text }]}>
            Running on <Text style={[styles.toolName, { color: theme.colors.primary }]}>{toolName}</Text>...
          </Text>
          {progressText && (
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>{progressText}</Text>
          )}
          <Text style={[styles.elapsed, { color: theme.colors.textMuted }]}>⏱ {formatElapsed(elapsed)}</Text>
        </View>
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.cancelBtn, { backgroundColor: theme.colors.surfaceLight }]}
            accessibilityLabel="Cancel task"
            accessibilityRole="button"
          >
            <Text style={[styles.cancelText, { color: theme.colors.error }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderLeftWidth: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  textContainer: { flex: 1 },
  mainText: { fontSize: 14, fontWeight: '500' },
  toolName: { fontWeight: '700' },
  progressText: { fontSize: 12, marginTop: 2 },
  elapsed: { fontSize: 11, marginTop: 4 },
  cancelBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 12, fontWeight: '700' },
});
