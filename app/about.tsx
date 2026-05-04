import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCraftColors } from '@/hooks/useCraftColors';

export default function AboutScreen() {
  const c = useCraftColors();

  return (
    <>
      <Stack.Screen options={{ title: 'About' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: c.hero }]}>
            <Text style={styles.emoji} accessibilityLabel="">
              🧵
            </Text>
            <Text style={[styles.title, { color: c.text }]}>StitchCraft</Text>
            <Text style={[styles.tagline, { color: c.textMuted }]}>
              Your gentle companion for counted cross stitch — sketch ideas, follow the grid, and keep a little
              gallery of what you make.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.h2, { color: c.text }]}>Why we built this</Text>
            <Text style={[styles.p, { color: c.textMuted }]}>
              Cross stitch is slow, careful work. You deserve tools that feel calm and clear — not spreadsheets or
              scattered photos. StitchCraft brings your pattern, your progress, and your finished pieces into one
              place you can actually enjoy opening.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.h2, { color: c.text }]}>What you can do here</Text>
            <Text style={[styles.p, { color: c.textMuted }]}>
              • Paint your own charts with familiar thread colours{'\n'}• Tap stitches as you finish them{'\n'}•
              Turn a photo into a starter chart (then tweak it by hand){'\n'}• Save PDFs to print or share{'\n'}• Keep
              a simple archive of projects on your device
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.h2, { color: c.text }]}>Version</Text>
            <Text style={[styles.p, { color: c.textMuted }]}>Early access · 1.0 — we are still growing.</Text>
          </View>

          <Text style={[styles.footer, { color: c.textMuted }]}>
            Made with care for stitchers everywhere. Thank you for trying StitchCraft.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 40, paddingHorizontal: 20 },
  hero: {
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  tagline: { fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 8, maxWidth: 340 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    marginBottom: 14,
  },
  h2: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  p: { fontSize: 15, lineHeight: 24 },
  footer: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, paddingHorizontal: 12 },
});
