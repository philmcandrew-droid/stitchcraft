import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CraftColorScheme } from '@/constants/Colors';
import { useCraftColors } from '@/hooks/useCraftColors';

type BlockProps = { title: string; body: string; c: CraftColorScheme };

function HelpBlock({ title, body, c }: BlockProps) {
  return (
    <View style={[styles.block, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <Text style={[styles.blockTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.blockBody, { color: c.textMuted }]}>{body}</Text>
    </View>
  );
}

export default function HelpScreen() {
  const c = useCraftColors();

  return (
    <>
      <Stack.Screen options={{ title: 'Help' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.intro, { color: c.textMuted }]}>
            Short answers to the things we hear most. Tap the tabs at the bottom to move around the app anytime.
          </Text>

          <HelpBlock
            c={c}
            title="Start here"
            body="On the home screen, give your piece a name and pick how many stitches wide and tall your grid should be — that’s the size of your pattern, not your fabric. Tap “Start this project” and we’ll open it for you. You can always switch projects later from your list."
          />
          <HelpBlock
            c={c}
            title="Draw or paint a pattern"
            body="Open the Designer tab. Choose a thread colour along the bottom, then tap squares on the grid to paint. Use the eraser switch to clear squares. Turn on “Rectangle fill” to tap two corners and fill a whole area at once. Undo and redo are at the top if you change your mind."
          />
          <HelpBlock
            c={c}
            title="Track your stitching"
            body="Open the Tracker tab. Each coloured square is one stitch on your chart. Tap to mark it done — tap again if you need to undo one stitch. “Rectangle mark” works like rectangle fill: two taps mark a whole block complete. The bar at the top shows how far along you are."
          />
          <HelpBlock
            c={c}
            title="Turn a photo into a chart"
            body="Open Convert. Pick a size and how many colours you’d like, then try “Photo → chart” with a clear, well-lit picture. The app suggests a chart you can refine in the Designer — it’s a starting point, not magic, so a little hand-tweaking is normal."
          />
          <HelpBlock
            c={c}
            title="Save or share a PDF"
            body="In the Designer, tap PDF when you have a project open. You can share the file to email, print, or save to your files — whatever feels easiest."
          />
          <HelpBlock
            c={c}
            title="Where is my work saved?"
            body="Right now everything lives on this phone or tablet. The slim bar under the tabs explains optional sync if your maker adds it later — you don’t need to do anything for day-to-day stitching."
          />
          <HelpBlock
            c={c}
            title="Big patterns feel slow"
            body="Very large charts take more patience to scroll. If things feel heavy, try a slightly smaller size for your next project — you can always zoom and pan, but smaller grids are kinder to older devices."
          />

          <Text style={[styles.outro, { color: c.textMuted }]}>
            Still stuck? Check About for the big picture, or ask a friend who’s good with phones — we’re working on
            in-app tips next.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  intro: { fontSize: 15, lineHeight: 24, marginBottom: 18 },
  block: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 12,
  },
  blockTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  blockBody: { fontSize: 15, lineHeight: 24 },
  outro: { fontSize: 14, lineHeight: 22, marginTop: 8, textAlign: 'center' },
});
