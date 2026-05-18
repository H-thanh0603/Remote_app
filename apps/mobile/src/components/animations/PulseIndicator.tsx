import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

export function PulseIndicator() {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.4, duration: 600, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [scale, opacity]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: theme.colors.success, transform: [{ scale }], opacity },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
