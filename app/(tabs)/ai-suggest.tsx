import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useGallery } from '@/context/GalleryContext';
import { useCraftColors } from '@/hooks/useCraftColors';
import { generateCrossStitchPatternImage } from '@/lib/openRouterPatternImage';
import { cardShadowStyle } from '@/lib/shadowPlatform';
import type { GalleryImageEntry } from '@/lib/types';

export default function AiSuggestScreen() {
  const c = useCraftColors();
  const { addGeneratedPatternImage } = useGallery();
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<GalleryImageEntry | null>(null);

  const onGenerate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { imageDataUrl, caption } = await generateCrossStitchPatternImage(prompt);
      const entry = await addGeneratedPatternImage(imageDataUrl, prompt.trim() || caption);
      setLatest(entry);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }, [addGeneratedPatternImage, prompt]);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: c.text }]}>AI pattern inspiration</Text>
      <Text style={[styles.lead, { color: c.textMuted }]}>
        Describe a motif, season, or vibe. We will ask OpenRouter for a square reference image — not a counted chart,
        but something you can keep beside your project. Each new image is saved to your Gallery automatically.
      </Text>

      <View
        style={[
          styles.card,
          cardShadowStyle(c.shadow, { offsetY: 4, opacity: 0.1, radius: 12, elevation: 2 }),
          { backgroundColor: c.card, borderColor: c.cardBorder },
        ]}>
        <Text style={[styles.label, { color: c.text }]}>What should we imagine?</Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="e.g. Blue hydrangeas in a cream pitcher, soft cottage light"
          placeholderTextColor={c.textMuted}
          multiline
          style={[
            styles.input,
            { color: c.text, borderColor: c.cardBorder, backgroundColor: c.background },
          ]}
        />
        <Pressable
          style={[styles.primary, { backgroundColor: c.tint }, busy && styles.primaryDisabled]}
          onPress={onGenerate}
          disabled={busy || !prompt.trim()}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Generate & save to gallery</Text>
          )}
        </Pressable>
        {error ? <Text style={[styles.err, { color: c.danger }]}>{error}</Text> : null}
      </View>

      {latest ? (
        <View style={styles.previewBlock}>
          <Text style={[styles.section, { color: c.text }]}>Latest (also on Gallery)</Text>
          <Image source={{ uri: latest.uri }} style={styles.previewImg} resizeMode="cover" accessibilityLabel="Generated pattern inspiration" />
          <Text style={[styles.caption, { color: c.textMuted }]} numberOfLines={4}>
            {latest.prompt}
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/gallery')} style={[styles.linkBtn, { borderColor: c.tint }]}>
            <Text style={[styles.linkBtnText, { color: c.tint }]}>Open gallery</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  lead: { fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 18 },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  label: { fontWeight: '600', marginBottom: 8 },
  input: {
    minHeight: 100,
    textAlignVertical: 'top',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    fontSize: 16,
    lineHeight: 22,
  },
  primary: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryDisabled: { opacity: 0.55 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  err: { marginTop: 12, fontSize: 14, lineHeight: 20 },
  previewBlock: { marginTop: 24 },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  previewImg: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 360,
    alignSelf: 'center',
    borderRadius: 16,
    backgroundColor: '#e8e8e8',
  },
  caption: { marginTop: 10, fontSize: 14, lineHeight: 20 },
  linkBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  linkBtnText: { fontWeight: '700', fontSize: 15 },
});
