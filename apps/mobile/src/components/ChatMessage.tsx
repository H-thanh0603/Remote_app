import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { SlideUp } from './animations';
import type { ChatMessageData } from '../types';

interface Props {
  message: ChatMessageData;
  delay?: number;
}

export function ChatMessage({ message, delay = 0 }: Props) {
  const { theme } = useTheme();
  const isUser = message.type === 'user';

  return (
    <SlideUp delay={delay} duration={250}>
      <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser
            ? { backgroundColor: theme.colors.primary, borderBottomRightRadius: theme.borderRadius.sm }
            : { backgroundColor: theme.colors.surface, borderBottomLeftRadius: theme.borderRadius.sm },
          theme.shadows.sm,
        ]}>
          <Text style={[styles.text, { color: theme.colors.text }]}>{message.content}</Text>
          <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </SlideUp>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    marginHorizontal: 16,
  },
  userContainer: { justifyContent: 'flex-end' },
  assistantContainer: { justifyContent: 'flex-start' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatarText: { fontSize: 16 },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  text: { fontSize: 14, lineHeight: 20 },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});
