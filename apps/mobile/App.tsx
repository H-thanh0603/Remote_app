import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native'

export default function App(): React.JSX.Element {
  const [input, setInput] = React.useState('')

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚡ AI Command Center</Text>
        <Text style={styles.headerSubtitle}>Your AI fleet, one interface</Text>
      </View>

      {/* Chat area placeholder */}
      <View style={styles.chatArea}>
        <Text style={styles.placeholder}>
          Describe your task and I'll route it to the best AI tool...
        </Text>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="What do you need help with?"
          placeholderTextColor="#555"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          disabled={!input.trim()}
          onPress={() => setInput('')}
        >
          <Text style={styles.sendButtonText}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  chatArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholder: {
    color: '#444',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2a2a2a',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
})
