import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface SlideUpProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export function SlideUp({ children, delay = 0, duration = 300 }: SlideUpProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay, duration]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
