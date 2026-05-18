import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ONBOARDING_KEY = '@remote_app_onboarding_completed';

const TOOLS = [
  { name: 'OpenClaw', desc: 'Multi-agent AI IDE với 400+ skills' },
  { name: 'Hermes', desc: 'Python-based AI agent framework' },
  { name: 'Kiro', desc: 'AWS AI IDE cho cloud development' },
  { name: 'Antigravity', desc: 'Google coding agent tự động' },
  { name: 'Codex', desc: 'OpenAI CLI coding assistant' },
  { name: 'Claude Code', desc: 'Anthropic terminal coding agent' },
];

interface SlideProps {
  theme: any;
}

function Slide1({ theme }: SlideProps) {
  return (
    <View style={styles.slide}>
      <Text style={styles.emoji}>🚀</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>AI Command Center</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Điều phối tất cả AI tools từ một nơi duy nhất
      </Text>
    </View>
  );
}

function Slide2({ theme }: SlideProps) {
  return (
    <View style={styles.slide}>
      <Text style={styles.emoji}>💬</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>Chat-first</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Mô tả task → App gợi ý tool phù hợp → Confirm → Xong!
      </Text>
      <View style={[styles.stepsContainer, { backgroundColor: theme.colors.surface }]}>
        {[
          { step: '1', label: 'Mô tả task', icon: '✍️' },
          { step: '2', label: 'App gợi ý tool', icon: '🤖' },
          { step: '3', label: 'Confirm & Done', icon: '✅' },
        ].map((item) => (
          <View key={item.step} style={styles.stepRow}>
            <Text style={styles.stepIcon}>{item.icon}</Text>
            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>
                Bước {item.step}
              </Text>
              <Text style={[styles.stepLabel, { color: theme.colors.text }]}>
                {item.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function Slide3({ theme }: SlideProps) {
  return (
    <View style={styles.slide}>
      <Text style={styles.emoji}>🔧</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>6 AI Tools</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        OpenClaw • Hermes • Kiro • Antigravity • Codex • Claude Code
      </Text>
      <View style={styles.toolsGrid}>
        {TOOLS.map((tool) => (
          <View
            key={tool.name}
            style={[styles.toolChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Text style={[styles.toolName, { color: theme.colors.primary }]}>{tool.name}</Text>
            <Text style={[styles.toolDesc, { color: theme.colors.textSecondary }]}>{tool.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface Slide4Props extends SlideProps {
  apiUrl: string;
  setApiUrl: (v: string) => void;
  onTestConnection: () => void;
  connectionStatus: 'idle' | 'testing' | 'ok' | 'error';
}

function Slide4({ theme, apiUrl, setApiUrl, onTestConnection, connectionStatus }: Slide4Props) {
  return (
    <View style={styles.slide}>
      <Text style={styles.emoji}>⚙️</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>Cấu hình nhanh</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Nhập địa chỉ API server để bắt đầu
      </Text>
      <View style={styles.setupContainer}>
        <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>API Server URL</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="http://localhost:3001"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
          onPress={onTestConnection}
          disabled={connectionStatus === 'testing'}
        >
          <Text style={styles.testButtonText}>
            {connectionStatus === 'testing'
              ? '⏳ Đang kiểm tra...'
              : connectionStatus === 'ok'
              ? '✅ Kết nối thành công!'
              : connectionStatus === 'error'
              ? '❌ Thử lại'
              : '🔌 Test Connection'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [apiUrl, setApiUrl] = useState('http://localhost:3001');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');

  const totalPages = 4;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const goToNext = () => {
    if (currentPage < totalPages - 1) {
      scrollRef.current?.scrollTo({ x: (currentPage + 1) * SCREEN_WIDTH, animated: true });
      setCurrentPage(currentPage + 1);
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    try {
      const res = await fetch(`${apiUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        setConnectionStatus('ok');
        await AsyncStorage.setItem('@remote_app_api_url', apiUrl);
      } else {
        setConnectionStatus('error');
      }
    } catch {
      setConnectionStatus('error');
    }
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    if (apiUrl !== 'http://localhost:3001') {
      await AsyncStorage.setItem('@remote_app_api_url', apiUrl);
    }
    onComplete();
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const slides = [
    <Slide1 theme={theme} />,
    <Slide2 theme={theme} />,
    <Slide3 theme={theme} />,
    <Slide4
      theme={theme}
      apiUrl={apiUrl}
      setApiUrl={setApiUrl}
      onTestConnection={handleTestConnection}
      connectionStatus={connectionStatus}
    />,
  ];

  const isLastPage = currentPage === totalPages - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Skip button */}
      {!isLastPage && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>Bỏ qua</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.flex}
      >
        {slides.map((slide, index) => (
          <View key={index} style={{ width: SCREEN_WIDTH, flex: 1 }}>
            {slide}
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentPage ? theme.colors.primary : theme.colors.border,
                width: index === currentPage ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom buttons */}
      <View style={[styles.bottomButtons, { paddingHorizontal: 24 }]}>
        {isLastPage ? (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleComplete}
            >
              <Text style={styles.primaryButtonText}>Bắt đầu! 🚀</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipLinkButton} onPress={handleSkip}>
              <Text style={[styles.skipLinkText, { color: theme.colors.textSecondary }]}>
                Bỏ qua cấu hình
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={goToNext}
          >
            <Text style={styles.primaryButtonText}>Tiếp theo →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  skipButton: { position: 'absolute', top: 56, right: 24, zIndex: 10, padding: 8 },
  skipText: { fontSize: 14 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 40 },
  emoji: { fontSize: 72, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  stepsContainer: { width: '100%', borderRadius: 16, padding: 16, gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: { fontSize: 28 },
  stepTextContainer: { flex: 1 },
  stepNumber: { fontSize: 12, fontWeight: '600' },
  stepLabel: { fontSize: 15, fontWeight: '500' },
  toolsGrid: { width: '100%', gap: 8 },
  toolChip: { borderRadius: 12, padding: 12, borderWidth: 1 },
  toolName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  toolDesc: { fontSize: 12 },
  setupContainer: { width: '100%', gap: 12 },
  inputLabel: { fontSize: 13, fontWeight: '500' },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15 },
  testButton: { borderRadius: 12, padding: 14, alignItems: 'center' },
  testButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  bottomButtons: { paddingBottom: 24, gap: 8 },
  primaryButton: { borderRadius: 14, padding: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipLinkButton: { alignItems: 'center', padding: 8 },
  skipLinkText: { fontSize: 14 },
});
