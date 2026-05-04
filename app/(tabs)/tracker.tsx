import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { PatternGrid } from '@/components/PatternGrid';
import { useProjects } from '@/context/ProjectsContext';
import { useCraftColors } from '@/hooks/useCraftColors';
import { projectStats } from '@/lib/grid';

export default function TrackerScreen() {
  const theme = useCraftColors();
  const {
    activeProject,
    toggleStitched,
    completeRectStitches,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useProjects();
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [rectMode, setRectMode] = useState(false);
  const [rectAnchor, setRectAnchor] = useState<{ x: number; y: number } | null>(null);

  if (!activeProject) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <Text style={styles.softEmoji}>✂️</Text>
        <Text style={[styles.title, { color: theme.text }]}>Nothing to track yet</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          Choose a project on the Welcome tab, add a little colour in Design, then hop back here to tap stitches as you
          finish them on fabric.
        </Text>
        <Pressable style={[styles.ctaOutline, { borderColor: theme.tint }]} onPress={() => router.push('/(tabs)')}>
          <Text style={[styles.ctaOutlineText, { color: theme.tint }]}>Back to Welcome</Text>
        </Pressable>
        <Pressable style={{ marginTop: 12 }} onPress={() => router.push('/help')}>
          <Text style={[styles.linkQuiet, { color: theme.link }]}>How tracking works</Text>
        </Pressable>
      </View>
    );
  }

  const stats = projectStats(activeProject);
  const colours = stats.byPaletteIndex.filter((row) => row.total > 0);

  const onCell = (x: number, y: number) => {
    if (rectMode) {
      if (!rectAnchor) {
        setRectAnchor({ x, y });
        return;
      }
      completeRectStitches(activeProject.id, rectAnchor.x, rectAnchor.y, x, y);
      setRectAnchor(null);
      return;
    }
    toggleStitched(activeProject.id, x, y);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <Pressable
          style={[styles.smallBtn, { borderColor: theme.cardBorder }, !canUndo && styles.disabled]}
          onPress={undo}
          disabled={!canUndo}>
          <Text style={[styles.smallBtnText, { color: theme.text }]}>Undo</Text>
        </Pressable>
        <Pressable
          style={[styles.smallBtn, { borderColor: theme.cardBorder }, !canRedo && styles.disabled]}
          onPress={redo}
          disabled={!canRedo}>
          <Text style={[styles.smallBtnText, { color: theme.text }]}>Redo</Text>
        </Pressable>
      </View>

      <Text style={[styles.header, { color: theme.text }]}>{activeProject.name}</Text>
      <View style={styles.statsRow}>
        <Text style={[styles.statMain, { color: theme.text }]}>
          {stats.stitched} of {stats.stitchable} stitches · {stats.percent}% gentle progress
        </Text>
      </View>
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: theme.text }]}>Dim finished stitches</Text>
        <Switch value={incompleteOnly} onValueChange={setIncompleteOnly} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: theme.text }]}>Mark a rectangle (two taps)</Text>
        <Switch
          value={rectMode}
          onValueChange={(v) => {
            setRectMode(v);
            setRectAnchor(null);
          }}
        />
      </View>
      {rectMode ? (
        <Text style={[styles.hint, { color: theme.textMuted }]}>
          {rectAnchor
            ? 'Tap the opposite corner — every stitch inside the box gets a happy check.'
            : 'Tap one corner of the area you just stitched.'}
        </Text>
      ) : null}
      {colours.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legend}>
          {colours.map((row) => {
            const swatch = activeProject.palette[row.index];
            const left = row.total - row.done;
            return (
              <View key={row.index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: swatch?.hex ?? '#ccc' }]} />
                <Text style={[styles.legendText, { color: theme.text }]}>
                  {swatch?.dmc ?? row.index}: {left} left
                </Text>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={[styles.hint, { color: theme.textMuted }]}>
          Add a little colour in Design first — then your threads will show up here.
        </Text>
      )}

      <View style={styles.gridWrap}>
        <PatternGrid
          project={activeProject}
          mode="track"
          cellSize={14}
          showIncompleteOnly={incompleteOnly}
          onCellPress={onCell}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 4 },
  empty: { flex: 1, padding: 28, justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  softEmoji: { fontSize: 48, textAlign: 'center' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  ctaOutline: {
    marginTop: 8,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ctaOutlineText: { fontWeight: '700', fontSize: 16 },
  linkQuiet: { textAlign: 'center', fontSize: 15, fontWeight: '600' },
  topBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 6,
    alignItems: 'center',
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  smallBtnText: { fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.35 },
  header: { fontSize: 20, fontWeight: '700', paddingHorizontal: 16 },
  statsRow: { paddingHorizontal: 16, marginTop: 6 },
  statMain: { fontSize: 16, fontWeight: '600' },
  toggleRow: {
    marginTop: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: { fontWeight: '600' },
  hint: { paddingHorizontal: 12, marginTop: 4, fontSize: 12, opacity: 0.75 },
  legend: { maxHeight: 44, paddingHorizontal: 12, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14, gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: '#888' },
  legendText: { fontSize: 12 },
  gridWrap: { flex: 1, paddingTop: 8 },
});
