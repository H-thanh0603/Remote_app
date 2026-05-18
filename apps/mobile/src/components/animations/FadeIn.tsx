import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export function FadeIn({ children, delay = 0, duration = 300 }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [opacity, delay, duration]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
