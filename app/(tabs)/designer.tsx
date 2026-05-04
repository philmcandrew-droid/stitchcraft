import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { PatternGrid } from '@/components/PatternGrid';
import { useProjects } from '@/context/ProjectsContext';
import { useCraftColors } from '@/hooks/useCraftColors';
import { exportHtmlToPdfAndShare } from '@/lib/exportPdf';
import { buildPatternPdfHtml } from '@/lib/pdfHtml';
import { MASTER_PALETTE } from '@/lib/dmcPalette';

export default function DesignerScreen() {
  const c = useCraftColors();
  const {
    activeProject,
    paintCell,
    fillRectDesign,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useProjects();
  const [masterIdx, setMasterIdx] = useState(0);
  const [eraser, setEraser] = useState(false);
  const [rectMode, setRectMode] = useState(false);
  const [rectAnchor, setRectAnchor] = useState<{ x: number; y: number } | null>(null);
  const [exporting, setExporting] = useState(false);

  if (!activeProject) {
    return (
      <View style={[styles.empty, { backgroundColor: c.background }]}>
        <Text style={styles.softEmoji}>🎨</Text>
        <Text style={[styles.title, { color: c.text }]}>Pick something to paint</Text>
        <Text style={[styles.body, { color: c.textMuted }]}>
          On the Welcome tab, start a new piece or tap “Work on this” beside a saved one. Then come back here — your
          threads and grid will be waiting.
        </Text>
        <Pressable style={[styles.ctaOutline, { borderColor: c.tint }]} onPress={() => router.push('/(tabs)')}>
          <Text style={[styles.ctaOutlineText, { color: c.tint }]}>Back to Welcome</Text>
        </Pressable>
        <Pressable style={{ marginTop: 12 }} onPress={() => router.push('/help')}>
          <Text style={[styles.linkQuiet, { color: c.link }]}>How drawing works</Text>
        </Pressable>
      </View>
    );
  }

  const onCell = (x: number, y: number) => {
    if (rectMode) {
      if (!rectAnchor) {
        setRectAnchor({ x, y });
        return;
      }
      fillRectDesign(activeProject.id, rectAnchor.x, rectAnchor.y, x, y, masterIdx, eraser ? { erase: true } : undefined);
      setRectAnchor(null);
      return;
    }
    paintCell(activeProject.id, x, y, masterIdx, eraser ? { erase: true } : undefined);
  };

  const onExportPdf = async () => {
    setExporting(true);
    try {
      const html = buildPatternPdfHtml(activeProject);
      await exportHtmlToPdfAndShare(html, `${activeProject.name}.pdf`);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable
            style={[styles.smallBtn, { borderColor: c.cardBorder }, !canUndo && styles.disabled]}
            onPress={undo}
            disabled={!canUndo}>
            <Text style={[styles.smallBtnText, { color: c.text }]}>Undo</Text>
          </Pressable>
          <Pressable
            style={[styles.smallBtn, { borderColor: c.cardBorder }, !canRedo && styles.disabled]}
            onPress={redo}
            disabled={!canRedo}>
            <Text style={[styles.smallBtnText, { color: c.text }]}>Redo</Text>
          </Pressable>
        </View>
        <Pressable style={[styles.smallBtnAccent, { backgroundColor: c.tint }]} onPress={onExportPdf} disabled={exporting}>
          <Text style={styles.smallBtnTextLight}>{exporting ? 'PDF…' : 'Save PDF'}</Text>
        </Pressable>
      </View>

      <Text style={[styles.header, { color: c.text }]}>{activeProject.name}</Text>
      <Text style={[styles.meta, { color: c.textMuted }]}>
        {activeProject.width} × {activeProject.height} stitches · {activeProject.palette.length} colours in your key
      </Text>

      <View style={[styles.toolbar, { borderBottomColor: c.cardBorder }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.toolbarLabel, { color: c.text }]}>Paint a rectangle (two taps)</Text>
          <Switch
            value={rectMode}
            onValueChange={(v) => {
              setRectMode(v);
              setRectAnchor(null);
            }}
          />
        </View>
        {rectMode ? (
          <Text style={[styles.hint, { color: c.textMuted }]}>
            {rectAnchor ? 'Now tap the opposite corner — we fill or erase everything inside the box.' : 'Tap one corner of the area you want to fill.'}
          </Text>
        ) : null}
        <View style={styles.rowBetween}>
          <Text style={[styles.toolbarLabel, { color: c.text }]}>Eraser</Text>
          <Switch value={eraser} onValueChange={setEraser} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {MASTER_PALETTE.map((t, i) => {
            const selected = !eraser && i === masterIdx;
            return (
              <Pressable
                key={t.dmc}
                onPress={() => {
                  setEraser(false);
                  setMasterIdx(i);
                }}
                style={[styles.swatch, { backgroundColor: t.hex }, selected && styles.swatchSelected]}
              />
            );
          })}
        </ScrollView>
        <Text style={[styles.swatchCaption, { color: c.textMuted }]}>
          {!eraser
            ? `${MASTER_PALETTE[masterIdx]?.dmc} — ${MASTER_PALETTE[masterIdx]?.name ?? ''}`
            : 'Erase stitches'}
        </Text>
      </View>

      <View style={styles.gridWrap}>
        <PatternGrid project={activeProject} mode="design" cellSize={14} onCellPress={onCell} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  topBarLeft: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  smallBtnAccent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  smallBtnText: { fontWeight: '700', fontSize: 14 },
  smallBtnTextLight: { fontWeight: '700', fontSize: 13, color: '#fff' },
  disabled: { opacity: 0.35 },
  header: { fontSize: 20, fontWeight: '700', paddingHorizontal: 16 },
  meta: { fontSize: 14, paddingHorizontal: 16, marginBottom: 8 },
  toolbar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toolbarLabel: { fontWeight: '600' },
  hint: { fontSize: 12, opacity: 0.75 },
  strip: { gap: 8, paddingVertical: 4, alignItems: 'center' },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
  },
  swatchSelected: { borderWidth: 3, borderColor: '#111' },
  swatchCaption: { fontSize: 12, opacity: 0.75 },
  gridWrap: { flex: 1, paddingTop: 8 },
});
