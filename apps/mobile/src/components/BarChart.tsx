import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme';

interface BarChartProps {
  data: { date: string; count: number }[];
}

export function BarChart({ data }: BarChartProps) {
  const { theme } = useTheme();
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const anims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      60,
      anims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: (data[i]?.count ?? 0) / maxVal,
          duration: 500,
          useNativeDriver: false,
        })
      )
    ).start();
  }, [data]);

  return (
    <View style={styles.container}>
      {data.map((item, index) => (
        <View key={item.date} style={styles.barWrapper}>
          <Text style={[styles.value, { color: theme.colors.textSecondary }]}>
            {(data[index]?.count ?? 0) > 0 ? data[index]?.count : ''}
          </Text>
          <View style={[styles.barBg, { backgroundColor: theme.colors.border }]}>
            <Animated.View
              style={[
                styles.bar,
                {
                  backgroundColor: theme.colors.primary,
                  height: (anims[index] ?? new Animated.Value(0)).interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            {item.date.slice(5)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 },
  barWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  value: { fontSize: 10, fontWeight: '600' },
  barBg: { flex: 1, width: '100%', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  label: { fontSize: 10 },
});
