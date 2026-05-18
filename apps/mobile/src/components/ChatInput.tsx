import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  onSend: (text: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, loading = false, disabled = false }: Props) {
  const { theme } = useTheme();
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || loading || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const canSend = !!text.trim() && !loading && !disabled;

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
      theme.shadows.sm,
    ]}>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.colors.surfaceLight, color: theme.colors.text },
        ]}
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
        style={[
          styles.sendButton,
          { backgroundColor: canSend ? theme.colors.primary : theme.colors.surfaceLight },
        ]}
        onPress={handleSend}
        disabled={!canSend}
        accessibilityLabel="Send message"
        accessibilityRole="button"
      >
        {loading
          ? <ActivityIndicator size="small" color={theme.colors.text} />
          : <Text style={[styles.sendIcon, { color: canSend ? '#fff' : theme.colors.textSecondary }]}>➤</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 120,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { fontSize: 18 },
});
