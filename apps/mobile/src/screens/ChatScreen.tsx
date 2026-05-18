import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { ChatInput } from '../components/ChatInput';
import { ChatMessage } from '../components/ChatMessage';
import { RoutingSuggestion } from '../components/RoutingSuggestion';
import { Header } from '../components/Header';
import { useApi } from '../hooks/useApi';
import type { ChatMessageData } from '../types';

let msgId = 0;
const nextId = () => `msg-${++msgId}-${Date.now()}`;

export function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: nextId(),
      type: 'system',
      content: '👋 Xin chào! Mô tả task của bạn và tôi sẽ gợi ý AI tool phù hợp nhất.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { loading, createTask, confirmTask } = useApi();

  const addMessage = useCallback((msg: Omit<ChatMessageData, 'id'>) => {
    const newMsg = { ...msg, id: nextId() };
    setMessages(prev => [...prev, newMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return newMsg;
  }, []);

  const handleSend = useCallback(async (text: string) => {
    addMessage({ type: 'user', content: text, timestamp: new Date().toISOString() });
    const result = await createTask(text);
    if (!result) {
      addMessage({ type: 'error', content: '❌ Không thể kết nối server. Vui lòng thử lại.', timestamp: new Date().toISOString() });
      return;
    }
    if (result.suggestion) {
      setPendingTaskId(result.task?.id ?? null);
      setPendingSuggestion(result.suggestion);
      addMessage({
        type: 'suggestion',
        content: '',
        timestamp: new Date().toISOString(),
        metadata: { taskId: result.task?.id, suggestion: result.suggestion },
      });
    }
  }, [addMessage, createTask]);

  const handleConfirm = useCallback(async () => {
    if (!pendingTaskId || !pendingSuggestion) return;
    const suggestion = pendingSuggestion;
    setPendingSuggestion(null);
    addMessage({ type: 'system', content: '⏳ Task đang chạy...', timestamp: new Date().toISOString() });
    const result = await confirmTask(pendingTaskId, suggestion.toolId);
    setPendingTaskId(null);
    if (result) {
      addMessage({ type: 'result', content: `✅ Task đã được giao cho **${suggestion.toolId}**. Đang xử lý...`, timestamp: new Date().toISOString() });
    } else {
      addMessage({ type: 'error', content: '❌ Không thể confirm task.', timestamp: new Date().toISOString() });
    }
  }, [pendingTaskId, pendingSuggestion, addMessage, confirmTask]);

  const handleChange = useCallback(() => {
    setPendingSuggestion(null);
    setPendingTaskId(null);
    addMessage({ type: 'system', content: '↻ Hãy mô tả lại task hoặc chỉ định tool cụ thể bạn muốn dùng.', timestamp: new Date().toISOString() });
  }, [addMessage]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="AI Command Center" subtitle="Chat-first AI dispatcher" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.listContent}>
            {messages.map(item => {
              if (item.type === 'suggestion' && item.metadata?.suggestion && pendingSuggestion) {
                return (
                  <RoutingSuggestion
                    key={item.id}
                    suggestion={item.metadata.suggestion}
                    onConfirm={handleConfirm}
                    onChange={handleChange}
                  />
                );
              }
              return <ChatMessage key={item.id} message={item} />;
            })}
          </View>
        </ScrollView>
        <ChatInput onSend={handleSend} loading={loading} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  listContent: { paddingVertical: theme.spacing.md },
});
