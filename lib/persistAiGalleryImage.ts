import { Platform } from 'react-native';
import { documentDirectory, makeDirectoryAsync, writeAsStringAsync } from 'expo-file-system/legacy';

function dataUrlToBase64(dataUrl: string): string {
  const i = dataUrl.indexOf(',');
  if (i === -1) throw new Error('Expected a data URL with a comma separator.');
  return dataUrl.slice(i + 1);
}

/** Keeps a stable copy for the gallery: file on disk (native) or the data URL on web. */
export async function persistOpenRouterDataUrlImage(dataUrl: string, fileId: string): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) {
    throw new Error('Expected an image data URL from the model.');
  }
  if (Platform.OS === 'web') {
    return dataUrl;
  }
  const root = documentDirectory;
  if (!root) throw new Error('Document directory is not available on this device.');
  const dir = `${root}stitchcraft-gallery/`;
  await makeDirectoryAsync(dir, { intermediates: true });
  const path = `${dir}${fileId}.png`;
  const b64 = dataUrlToBase64(dataUrl);
  await writeAsStringAsync(path, b64, { encoding: 'base64' });
  return path;
}
