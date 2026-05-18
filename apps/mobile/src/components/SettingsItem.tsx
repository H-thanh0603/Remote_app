import React from 'react'
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { theme } from '../theme'

interface BaseProps {
  label: string
  description?: string
  isLast?: boolean
}

interface TextInputProps extends BaseProps {
  type: 'text'
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  keyboardType?: 'default' | 'url' | 'numeric'
}

interface SwitchProps extends BaseProps {
  type: 'switch'
  value: boolean
  onValueChange: (value: boolean) => void
}

interface ButtonProps extends BaseProps {
  type: 'button'
  onPress: () => void
  loading?: boolean
  variant?: 'default' | 'danger' | 'success'
}

interface InfoProps extends BaseProps {
  type: 'info'
  value: string
}

type SettingsItemProps = TextInputProps | SwitchProps | ButtonProps | InfoProps

export function SettingsItem(props: SettingsItemProps) {
  const { label, description, isLast } = props

  const renderControl = () => {
    switch (props.type) {
      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            value={props.value}
            onChangeText={props.onChangeText}
            placeholder={props.placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            secureTextEntry={props.secureTextEntry}
            autoCapitalize={props.autoCapitalize ?? 'none'}
            keyboardType={props.keyboardType ?? 'default'}
            autoCorrect={false}
          />
        )
      case 'switch':
        return (
          <Switch
            value={props.value}
            onValueChange={props.onValueChange}
            trackColor={{ false: theme.colors.surfaceLight, true: theme.colors.primary }}
            thumbColor={props.value ? '#fff' : theme.colors.textSecondary}
          />
        )
      case 'button':
        return (
          <TouchableOpacity
            style={[
              styles.button,
              props.variant === 'danger' && styles.buttonDanger,
              props.variant === 'success' && styles.buttonSuccess,
            ]}
            onPress={props.onPress}
            disabled={props.loading}
          >
            {props.loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{label}</Text>
            )}
          </TouchableOpacity>
        )
      case 'info':
        return <Text style={styles.infoValue}>{props.value}</Text>
    }
  }

  if (props.type === 'text') {
    return (
      <View style={[styles.container, !isLast && styles.border]}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
        {renderControl()}
      </View>
    )
  }

  if (props.type === 'button') {
    return (
      <View style={[styles.container, styles.buttonContainer, !isLast && styles.border]}>
        {description && <Text style={styles.description}>{description}</Text>}
        {renderControl()}
      </View>
    )
  }

  return (
    <View style={[styles.container, styles.row, !isLast && styles.border]}>
      <View style={styles.labelCol}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      {renderControl()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLight,
  },
  labelRow: {
    marginBottom: 8,
  },
  labelCol: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  textInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: theme.colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.colors.surfaceLight,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  buttonDanger: {
    backgroundColor: theme.colors.error,
  },
  buttonSuccess: {
    backgroundColor: theme.colors.success,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    alignItems: 'flex-start',
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
})
