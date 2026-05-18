import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { ChatScreen } from './src/screens/ChatScreen';
import { StatusScreen } from './src/screens/StatusScreen';
import { theme } from './src/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.surfaceLight,
              borderTopWidth: 1,
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textSecondary,
          }}
        >
          <Tab.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              tabBarLabel: 'Chat',
              tabBarIcon: ({ color }) => (
                <Text style={{ fontSize: 20, color }}>💬</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Status"
            component={StatusScreen}
            options={{
              tabBarLabel: 'Status',
              tabBarIcon: ({ color }) => (
                <Text style={{ fontSize: 20, color }}>📊</Text>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
