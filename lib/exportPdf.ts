import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export async function exportHtmlToPdfAndShare(html: string, fileName: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html });

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.open(uri, '_blank', 'noopener,noreferrer');
    }
    return uri;
  }

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: fileName,
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
}
