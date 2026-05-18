import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';

interface Props {
  onSend: (text: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, loading = false, disabled = false }: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || loading || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Mô tả task của bạn..."
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        maxLength={1000}
        editable={!loading && !disabled}
        onSubmitEditing={handleSend}
      />
      <TouchableOpacity
        style={[styles.sendButton, (!text.trim() || loading || disabled) && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!text.trim() || loading || disabled}
        accessibilityLabel="Send message"
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.text} />
        ) : (
          <Text style={styles.sendIcon}>➤</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceLight,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    maxHeight: 120,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surfaceLight,
  },
  sendIcon: {
    color: theme.colors.text,
    fontSize: 18,
  },
});
