import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, ActionSheetIOS, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { copyToClipboard, shareText, shareMarkdown } from '../utils/share';
import { Toast } from './Toast';

interface ShareButtonProps {
  title: string;
  text: string;
  markdown?: string;
  color?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ title, text, markdown, color = '#a78bfa' }) => {
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  const showToast = (message: string) => setToast({ visible: true, message });
  const hideToast = () => setToast({ visible: false, message: '' });

  const handleShare = () => {
    const options = ['Copy to clipboard', 'Share as text', 'Export as Markdown', 'Cancel'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 3 },
        (index) => handleOption(index)
      );
    } else {
      Alert.alert('Share', 'Choose an option', [
        { text: 'Copy to clipboard', onPress: () => handleOption(0) },
        { text: 'Share as text', onPress: () => handleOption(1) },
        { text: 'Export as Markdown', onPress: () => handleOption(2) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleOption = async (index: number) => {
    try {
      if (index === 0) {
        await copyToClipboard(text);
        showToast('Copied!');
      } else if (index === 1) {
        await shareText(title, text);
      } else if (index === 2) {
        await shareMarkdown(title, markdown || text);
        showToast('Exported!');
      }
    } catch (e) {
      showToast('Failed to share');
    }
  };

  return (
    <>
      <TouchableOpacity onPress={handleShare} style={styles.btn}>
        <Ionicons name="share-outline" size={18} color={color} />
      </TouchableOpacity>
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />
    </>
  );
};

const styles = StyleSheet.create({
  btn: { padding: 6 },
});
