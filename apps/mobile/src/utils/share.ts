import { Share, Clipboard } from 'react-native';

export async function shareText(title: string, message: string): Promise<void> {
  await Share.share({ title, message });
}

export async function copyToClipboard(text: string): Promise<void> {
  Clipboard.setString(text);
}

export async function shareMarkdown(title: string, content: string): Promise<void> {
  await Share.share({ title, message: content });
}
