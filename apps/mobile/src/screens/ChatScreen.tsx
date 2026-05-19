import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  Animated,
  TouchableOpacity,
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
import { api } from '../services/api';

let msgId = 0;
const nextId = () => `msg-${++msgId}-${Date.now()}`;

type MsgType = 'user' | 'system' | 'error' | 'suggestion' | 'result' | 'progress' | 'brain';

interface ChatMsg {
  id: string;
  type: MsgType;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

type ChatMode = 'brain' | 'task';

export function ChatScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ChatMode>('brain');
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: nextId(),
      type: 'system',
      content: '🧠 Brain mode active. Tôi sẽ phân tích, lập kế hoạch và điều phối AI tools cho bạn.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [brainStatus, setBrainStatus] = useState<string | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState<any>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [progressInfo, setProgressInfo] = useState<{ toolName: string; text?: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { loading, createTask, confirmTask, cancelTask } = useApi();
  const [brainLoading, setBrainLoading] = useState(false);
  const { connected, reconnecting, taskEvent, lastEvent } = useWebSocket();

  // Banner opacity for connection status
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!connected) {
      Animated.timing(bannerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(bannerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [connected, bannerOpacity]);

  // Handle brain WebSocket events
  useEffect(() => {
    if (!lastEvent) return;
    const { type } = lastEvent;
    if (type === 'brain:planning') setBrainStatus('🔍 Analyzing & planning...');
    else if (type === 'brain:executing') setBrainStatus('⚡ Executing plan...');
    else if (type === 'brain:synthesizing') setBrainStatus('✨ Synthesizing results...');
    else if (type === 'brain:step_update') setBrainStatus('🔄 Processing step...');
    else if (type === 'brain:complete') setBrainStatus(null);
  }, [lastEvent]);

  // Handle WebSocket task events (task mode)
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

  // ─── Brain Mode Send ────────────────────────────────────────────────────
  const handleBrainSend = useCallback(async (text: string) => {
    addMessage({ type: 'user', content: text, timestamp: new Date().toISOString() });
    setBrainLoading(true);
    setBrainStatus('🧠 Thinking...');

    try {
      const result = await api.brainChat(text);

      setBrainStatus(null);
      setBrainLoading(false);

      if (!result.success || !result.data) {
        addMessage({ type: 'error', content: '❌ Brain không phản hồi. Thử lại.', timestamp: new Date().toISOString() });
        return;
      }

      const { message, toolsUsed, confidence, reasoning, plan } = result.data;

      addMessage({
        type: 'brain',
        content: message,
        timestamp: new Date().toISOString(),
        metadata: {
          toolsUsed,
          confidence,
          reasoning,
          strategy: plan?.strategy,
          stepsCount: plan?.steps?.length,
        },
      });
    } catch (err) {
      setBrainStatus(null);
      setBrainLoading(false);
      addMessage({ type: 'error', content: '❌ Lỗi kết nối Brain.', timestamp: new Date().toISOString() });
    }
  }, [addMessage]);

  // ─── Task Mode Send ─────────────────────────────────────────────────────
  const handleTaskSend = useCallback(async (text: string) => {
    addMessage({ type: 'user', content: text, timestamp: new Date().toISOString() });
    addMessage({ type: 'system', content: '🔍 Analyzing...', timestamp: new Date().toISOString() });

    const result = await createTask(text);
    setMessages(prev => prev.filter(m => m.content !== '🔍 Analyzing...'));

    if (!result) {
      addMessage({ type: 'error', content: '❌ Không thể kết nối server.', timestamp: new Date().toISOString() });
      return;
    }

    if (result.autoConfirmed && result.task?.id) {
      setActiveTaskId(result.task.id);
      setProgressInfo({ toolName: result.suggestion?.toolId ?? 'AI Tool' });
      addMessage({
        type: 'system',
        content: `⚡ Auto-routed to ${result.suggestion?.toolId ?? 'AI Tool'} (${Math.round((result.suggestion?.confidence ?? 1) * 100)}%)`,
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

  const handleSend = useCallback((text: string) => {
    if (mode === 'brain') return handleBrainSend(text);
    return handleTaskSend(text);
  }, [mode, handleBrainSend, handleTaskSend]);

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

  const toggleMode = useCallback(() => {
    const newMode = mode === 'brain' ? 'task' : 'brain';
    setMode(newMode);
    addMessage({
      type: 'system',
      content: newMode === 'brain'
        ? '🧠 Brain mode — Tôi sẽ phân tích, lập kế hoạch và điều phối AI tools.'
        : '📋 Task mode — Gửi task → chọn tool → thực thi.',
      timestamp: new Date().toISOString(),
    });
  }, [mode, addMessage]);

  const renderMessage = (item: ChatMsg) => {
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
    if (item.type === 'brain') {
      return (
        <View key={item.id} style={[styles.brainMsg, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.brainContent, { color: theme.colors.text }]}>{item.content}</Text>
          {item.metadata && (
            <View style={styles.brainMeta}>
              {(item.metadata.toolsUsed as string[])?.length > 0 && (
                <Text style={[styles.metaText, { color: theme.colors.primary }]}>
                  🔧 {(item.metadata.toolsUsed as string[]).join(', ')}
                </Text>
              )}
              {item.metadata.confidence && (
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  📊 {Math.round((item.metadata.confidence as number) * 100)}% confidence
                </Text>
              )}
              {item.metadata.strategy && (
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                  📋 {item.metadata.strategy} ({item.metadata.stepsCount} steps)
                </Text>
              )}
              {item.metadata.reasoning && (
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                  💭 {item.metadata.reasoning as string}
                </Text>
              )}
            </View>
          )}
        </View>
      );
    }
    return <ChatMessage key={item.id} message={item as any} />;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      <Header title="AI Command Center" subtitle={connected ? '🟢 Connected' : '🔴 Disconnected'} />

      {/* Mode toggle */}
      <View style={[styles.modeBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'brain' && { backgroundColor: theme.colors.primary + '20' }]}
          onPress={() => mode !== 'brain' && toggleMode()}
        >
          <Text style={[styles.modeBtnText, { color: mode === 'brain' ? theme.colors.primary : theme.colors.textSecondary }]}>
            🧠 Brain
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'task' && { backgroundColor: theme.colors.primary + '20' }]}
          onPress={() => mode !== 'task' && toggleMode()}
        >
          <Text style={[styles.modeBtnText, { color: mode === 'task' ? theme.colors.primary : theme.colors.textSecondary }]}>
            📋 Task
          </Text>
        </TouchableOpacity>
      </View>

      {/* Brain status indicator */}
      {brainStatus && (
        <View style={[styles.brainStatusBar, { backgroundColor: theme.colors.primary + '15' }]}>
          <Text style={[styles.brainStatusText, { color: theme.colors.primary }]}>{brainStatus}</Text>
        </View>
      )}

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
            {messages.map(renderMessage)}

            {/* Progress indicator (task mode) */}
            {progressInfo && (
              <ProgressIndicator
                toolName={progressInfo.toolName}
                progressText={progressInfo.text}
                onCancel={handleCancel}
              />
            )}
          </View>
        </ScrollView>
        <ChatInput onSend={handleSend} loading={loading || brainLoading} />
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
  modeBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  brainStatusBar: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  brainStatusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  brainMsg: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  brainContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  brainMeta: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128,128,128,0.3)',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
});
