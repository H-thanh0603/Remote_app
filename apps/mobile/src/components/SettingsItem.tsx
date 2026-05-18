import React from 'react';
import {
  View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';

interface BaseProps {
  label: string;
  description?: string;
  isLast?: boolean;
}
interface TextInputProps extends BaseProps {
  type: 'text';
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'url' | 'numeric';
}
interface SwitchProps extends BaseProps {
  type: 'switch';
  value: boolean;
  onValueChange: (value: boolean) => void;
}
interface ButtonProps extends BaseProps {
  type: 'button';
  onPress: () => void;
  loading?: boolean;
  variant?: 'default' | 'danger' | 'success';
}
interface InfoProps extends BaseProps {
  type: 'info';
  value: string;
  onPress?: () => void;
}
type SettingsItemProps = TextInputProps | SwitchProps | ButtonProps | InfoProps;

export function SettingsItem(props: SettingsItemProps) {
  const { theme } = useTheme();
  const { label, description, isLast } = props;

  const borderStyle = !isLast ? { borderBottomWidth: 1, borderBottomColor: theme.colors.border } : {};

  const renderControl = () => {
    switch (props.type) {
      case 'text':
        return (
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
            value={props.value}
            onChangeText={props.onChangeText}
            placeholder={props.placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            secureTextEntry={props.secureTextEntry}
            autoCapitalize={props.autoCapitalize ?? 'none'}
            keyboardType={props.keyboardType ?? 'default'}
            autoCorrect={false}
          />
        );
      case 'switch':
        return (
          <Switch
            value={props.value}
            onValueChange={props.onValueChange}
            trackColor={{ false: theme.colors.surfaceLight, true: theme.colors.primary }}
            thumbColor={props.value ? '#fff' : theme.colors.textSecondary}
          />
        );
      case 'button':
        return (
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: props.variant === 'danger' ? theme.colors.error : props.variant === 'success' ? theme.colors.success : theme.colors.primary },
            ]}
            onPress={props.onPress}
            disabled={props.loading}
          >
            {props.loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.buttonText}>{label}</Text>
            }
          </TouchableOpacity>
        );
      case 'info':
        return props.onPress
          ? <TouchableOpacity onPress={props.onPress}><Text style={[styles.infoValue, { color: theme.colors.primary }]}>{props.value} ›</Text></TouchableOpacity>
          : <Text style={[styles.infoValue, { color: theme.colors.textSecondary }]}>{props.value}</Text>;
    }
  };

  if (props.type === 'text') {
    return (
      <View style={[styles.container, borderStyle]}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
          {description && <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{description}</Text>}
        </View>
        {renderControl()}
      </View>
    );
  }
  if (props.type === 'button') {
    return (
      <View style={[styles.container, styles.buttonContainer, borderStyle]}>
        {description && <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{description}</Text>}
        {renderControl()}
      </View>
    );
  }
  return (
    <View style={[styles.container, styles.row, borderStyle]}>
      <View style={styles.labelCol}>
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
        {description && <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{description}</Text>}
      </View>
      {renderControl()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  labelRow: { marginBottom: 8 },
  labelCol: { flex: 1, marginRight: 12 },
  label: { fontSize: 15, fontWeight: '500' },
  description: { fontSize: 12, marginTop: 2 },
  textInput: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 14, borderWidth: 1,
  },
  button: {
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8,
    alignItems: 'center', alignSelf: 'flex-start',
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  buttonContainer: { alignItems: 'flex-start' },
  infoValue: { fontSize: 14 },
});
