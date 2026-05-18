import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatScreen } from './src/screens/ChatScreen';
import { StatusScreen } from './src/screens/StatusScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ToolDetailScreen } from './src/screens/ToolDetailScreen';
import { OnboardingScreen, ONBOARDING_KEY } from './src/screens/onboarding/OnboardingScreen';
import { ThemeProvider, useTheme } from './src/theme';

const Tab = createBottomTabNavigator();
const StatusStack = createNativeStackNavigator();

function StatusStackNavigator() {
  return (
    <StatusStack.Navigator screenOptions={{ headerShown: false }}>
      <StatusStack.Screen name="StatusMain" component={StatusScreen} />
      <StatusStack.Screen name="ToolDetail" component={ToolDetailScreen} />
    </StatusStack.Navigator>
  );
}

function AppNavigator() {
  const { theme, isDark } = useTheme();

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: theme.colors.background, card: theme.colors.surface, border: theme.colors.border } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.colors.background, card: theme.colors.surface, border: theme.colors.border } };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
        }}
      >
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{ tabBarLabel: 'Chat', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💬</Text> }}
        />
        <Tab.Screen
          name="Status"
          component={StatusStackNavigator}
          options={{ tabBarLabel: 'Status', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔧</Text> }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{ tabBarLabel: 'History', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text> }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarLabel: 'Settings', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  if (onboardingDone === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!onboardingDone) {
    return <OnboardingScreen onComplete={() => setOnboardingDone(true)} />;
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
