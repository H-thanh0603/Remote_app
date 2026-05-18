import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SettingsSection({ title, children, style }: SettingsSectionProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>{title}</Text>
      <View style={[styles.content, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  content: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
});
