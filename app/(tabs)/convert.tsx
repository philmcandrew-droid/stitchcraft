import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useProjects } from '@/context/ProjectsContext';
import { useCraftColors } from '@/hooks/useCraftColors';
import { buildDemoConversion } from '@/lib/convertDemo';
import { clamp } from '@/lib/grid';
import { cardShadowStyle } from '@/lib/shadowPlatform';
import { jpegFileUriToPattern } from '@/lib/photoToPattern';

const MIN_SIDE = 8;
const MAX_SIDE = 120;

export default function ConvertScreen() {
  const c = useCraftColors();
  const { createProject, importPattern } = useProjects();
  const [wStr, setWStr] = useState('48');
  const [hStr, setHStr] = useState('48');
  const [colourStr, setColourStr] = useState('12');
  const [busy, setBusy] = useState(false);

  const parsed = useMemo(() => {
    const w = clamp(parseInt(wStr, 10) || 48, MIN_SIDE, MAX_SIDE);
    const h = clamp(parseInt(hStr, 10) || 48, MIN_SIDE, MAX_SIDE);
    const colours = clamp(parseInt(colourStr, 10) || 12, 2, 48);
    return { w, h, colours };
  }, [wStr, hStr, colourStr]);

  const onPhoto = async () => {
    setBusy(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photos', 'We need access to your library to turn a picture into a chart.');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (picked.canceled || !picked.assets?.[0]?.uri) return;

      const asset = picked.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: Math.min(1200, asset.width ?? 1200) } }],
        { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG },
      );

      const { design, palette } = await jpegFileUriToPattern({
        uri: manipulated.uri,
        targetWidth: parsed.w,
        targetHeight: parsed.h,
        maxColours: parsed.colours,
      });
      const id = createProject(`From a photo · ${new Date().toLocaleDateString()}`, parsed.w, parsed.h);
      importPattern(id, parsed.w, parsed.h, design, palette);
    } catch (e) {
      Alert.alert('Something went wrong', e instanceof Error ? e.message : 'Could not read that JPEG.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.text }]}>Photo → chart</Text>
      <Text style={[styles.lead, { color: c.textMuted }]}>
        Choose a size and how many thread colours you want. You can start from a gentle demo, or a real photo — then
        open Design to nudge any squares that still look off.
      </Text>

      <View
        style={[
          styles.card,
          cardShadowStyle(c.shadow, { offsetY: 4, opacity: 0.1, radius: 12, elevation: 2 }),
          { backgroundColor: c.card, borderColor: c.cardBorder },
        ]}>
        <Text style={[styles.label, { color: c.text }]}>How wide should the chart be?</Text>
        <TextInput
          value={wStr}
          onChangeText={setWStr}
          keyboardType="number-pad"
          style={[styles.input, { color: c.text, borderColor: c.cardBorder, backgroundColor: c.background }]}
        />
        <Text style={[styles.label, { color: c.text, marginTop: 12 }]}>How tall?</Text>
        <TextInput
          value={hStr}
          onChangeText={setHStr}
          keyboardType="number-pad"
          style={[styles.input, { color: c.text, borderColor: c.cardBorder, backgroundColor: c.background }]}
        />
        <Text style={[styles.label, { color: c.text, marginTop: 12 }]}>How many colours?</Text>
        <TextInput
          value={colourStr}
          onChangeText={setColourStr}
          keyboardType="number-pad"
          style={[styles.input, { color: c.text, borderColor: c.cardBorder, backgroundColor: c.background }]}
        />
        <Text style={[styles.hint, { color: c.textMuted }]}>
          We will aim for {parsed.w} × {parsed.h} stitches and up to {parsed.colours} thread colours.
        </Text>
        <Pressable
          style={[styles.btn, { backgroundColor: c.tint }, busy && styles.btnDisabled]}
          disabled={busy}
          onPress={() => {
            const { design, palette } = buildDemoConversion(parsed.w, parsed.h, parsed.colours);
            const id = createProject(`Soft demo · ${new Date().toLocaleDateString()}`, parsed.w, parsed.h);
            importPattern(id, parsed.w, parsed.h, design, palette);
          }}>
          <Text style={styles.btnText}>Try a soft demo pattern</Text>
        </Pressable>
        <Pressable style={[styles.btnSecondary, { borderColor: c.tint }, busy && styles.btnDisabled]} disabled={busy} onPress={onPhoto}>
          {busy ? (
            <ActivityIndicator color={c.tint} />
          ) : (
            <Text style={[styles.btnSecondaryText, { color: c.tint }]}>Use a photo from my library</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  lead: { fontSize: 16, lineHeight: 24, marginTop: 10, marginBottom: 18 },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  label: { fontWeight: '600', fontSize: 15 },
  input: {
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 17,
  },
  hint: { fontSize: 14, lineHeight: 21, marginTop: 10 },
  btn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  btnSecondary: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnSecondaryText: { fontWeight: '700', fontSize: 16 },
});
