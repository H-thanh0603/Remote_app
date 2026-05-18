import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { ChatInput } from '../components/ChatInput';
import { ChatMessage } from '../components/ChatMessage';
import { RoutingSuggestion } from '../components/RoutingSuggestion';
import { ResultMessage } from '../components/ResultMessage';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { Header } from '../components/Header';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';

let msgId = 0;
const nextId = () => `msg-${++msgId}-${Date.now()}`;

type MsgType = 'user' | 'system' | 'error' | 'suggestion' | 'result' | 'progress';

interface ChatMsg {
  id: string;
  type: MsgType;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function ChatScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: nextId(),
      type: 'system',
      content: '👋 Xin chào! Mô tả task của bạn và tôi sẽ gợi ý AI tool phù hợp nhất.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState<any>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [progressInfo, setProgressInfo] = useState<{ toolName: string; text?: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { loading, createTask, confirmTask, cancelTask } = useApi();
  const { connected, reconnecting, taskEvent } = useWebSocket();

  // Banner opacity for connection status
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!connected) {
      Animated.timing(bannerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(bannerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [connected, bannerOpacity]);

  // Handle WebSocket task events
  useEffect(() => {
    if (!taskEvent || taskEvent.taskId !== activeTaskId) return;

    switch (taskEvent.type) {
      case 'started':
        setProgressInfo({ toolName: taskEvent.toolName ?? 'AI Tool' });
        break;
      case 'progress':
        setProgressInfo(prev => prev ? { ...prev, text: taskEvent.progressText } : null);
        break;
      case 'completed':
        setProgressInfo(null);
        setActiveTaskId(null);
        setMessages(prev => [
          ...prev.filter(m => m.type !== 'progress'),
          {
            id: nextId(),
            type: 'result',
            content: taskEvent.result ?? '',
            timestamp: new Date().toISOString(),
            metadata: {
              toolName: taskEvent.toolName,
              duration: taskEvent.duration,
              tokensUsed: taskEvent.tokensUsed,
            },
          },
        ]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        break;
      case 'failed':
        setProgressInfo(null);
        setActiveTaskId(null);
        addMessage({
          type: 'error',
          content: `❌ Task failed: ${taskEvent.error ?? 'Unknown error'}`,
          timestamp: new Date().toISOString(),
        });
        break;
    }
  }, [taskEvent, activeTaskId]);

  const addMessage = useCallback((msg: Omit<ChatMsg, 'id'>) => {
    const newMsg = { ...msg, id: nextId() };
    setMessages(prev => [...prev, newMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    return newMsg;
  }, []);

  const handleSend = useCallback(async (text: string) => {
    addMessage({ type: 'user', content: text, timestamp: new Date().toISOString() });
    addMessage({ type: 'system', content: '🔍 Analyzing...', timestamp: new Date().toISOString() });

    const result = await createTask(text);
    setMessages(prev => prev.filter(m => m.content !== '🔍 Analyzing...'));

    if (!result) {
      addMessage({ type: 'error', content: '❌ Không thể kết nối server. Vui lòng thử lại.', timestamp: new Date().toISOString() });
      return;
    }

    // Auto-confirmed: skip suggestion card, go straight to execution
    if (result.autoConfirmed && result.task?.id) {
      setActiveTaskId(result.task.id);
      setProgressInfo({ toolName: result.suggestion?.toolId ?? 'AI Tool' });
      addMessage({
        type: 'system',
        content: `⚡ Auto-routed to ${result.suggestion?.toolId ?? 'AI Tool'} (confidence: ${Math.round((result.suggestion?.confidence ?? 1) * 100)}%)`,
        timestamp: new Date().toISOString(),
      });
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
    const taskId = pendingTaskId;
    const suggestion = pendingSuggestion;
    setPendingSuggestion(null);
    setPendingTaskId(null);
    setActiveTaskId(taskId);
    setProgressInfo({ toolName: suggestion.toolId });

    const result = await confirmTask(taskId, suggestion.toolId);
    if (!result) {
      setProgressInfo(null);
      setActiveTaskId(null);
      addMessage({ type: 'error', content: '❌ Không thể confirm task.', timestamp: new Date().toISOString() });
    }
  }, [pendingTaskId, pendingSuggestion, addMessage, confirmTask]);

  const handleChange = useCallback(() => {
    setPendingSuggestion(null);
    setPendingTaskId(null);
    addMessage({ type: 'system', content: '↻ Hãy mô tả lại task hoặc chỉ định tool cụ thể.', timestamp: new Date().toISOString() });
  }, [addMessage]);

  const handleCancel = useCallback(async () => {
    if (!activeTaskId) return;
    await cancelTask(activeTaskId);
    setProgressInfo(null);
    setActiveTaskId(null);
    addMessage({ type: 'system', content: '🚫 Task đã bị hủy.', timestamp: new Date().toISOString() });
  }, [activeTaskId, cancelTask, addMessage]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      <Header title="AI Command Center" subtitle={connected ? '🟢 Connected' : '🔴 Disconnected'} />

      {/* Connection banner */}
      <Animated.View style={[styles.banner, { opacity: bannerOpacity, backgroundColor: theme.colors.error }]}>
        <Text style={styles.bannerText}>
          {reconnecting ? '🔄 Reconnecting...' : '⚠️ Connection lost'}
        </Text>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}
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
                    suggestion={item.metadata.suggestion as any}
                    onConfirm={handleConfirm}
                    onChange={handleChange}
                  />
                );
              }
              if (item.type === 'result') {
                return (
                  <ResultMessage
                    key={item.id}
                    content={item.content}
                    toolName={item.metadata?.toolName as string}
                    duration={item.metadata?.duration as number}
                    tokensUsed={item.metadata?.tokensUsed as number}
                  />
                );
              }
              return <ChatMessage key={item.id} message={item as any} />;
            })}

            {/* Progress indicator */}
            {progressInfo && (
              <ProgressIndicator
                toolName={progressInfo.toolName}
                progressText={progressInfo.text}
                onCancel={handleCancel}
              />
            )}
          </View>
        </ScrollView>
        <ChatInput onSend={handleSend} loading={loading} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  listContent: { paddingVertical: 16 },
  banner: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  bannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
