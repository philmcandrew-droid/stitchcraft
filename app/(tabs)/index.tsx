import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CraftColorScheme } from '@/constants/Colors';
import { useProjects } from '@/context/ProjectsContext';
import { useCraftColors } from '@/hooks/useCraftColors';
import { clamp, projectStats } from '@/lib/grid';
import { cardShadowStyle } from '@/lib/shadowPlatform';
import type { Project } from '@/lib/types';

const MIN_SIDE = 8;
const MAX_SIDE = 120;

type QuickProps = {
  c: CraftColorScheme;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
};

function QuickCard({ c, icon, title, subtitle, onPress }: QuickProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickCard,
        cardShadowStyle(c.shadow, { offsetY: 4, opacity: 0.12, radius: 10, elevation: 2 }),
        {
          backgroundColor: c.card,
          borderColor: c.cardBorder,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View style={[styles.quickIconWrap, { backgroundColor: c.surfaceSoft }]}>
        <FontAwesome name={icon} size={22} color={c.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.quickTitle, { color: c.text }]}>{title}</Text>
        <Text style={[styles.quickSub, { color: c.textMuted }]}>{subtitle}</Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color={c.textMuted} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const c = useCraftColors();
  const { ready, projects, activeProjectId, activeProject, createProject, setActiveProject, deleteProject } =
    useProjects();
  const [name, setName] = useState('');
  const [wStr, setWStr] = useState('32');
  const [hStr, setHStr] = useState('32');

  const parsed = useMemo(() => {
    const w = clamp(parseInt(wStr, 10) || 32, MIN_SIDE, MAX_SIDE);
    const h = clamp(parseInt(hStr, 10) || 32, MIN_SIDE, MAX_SIDE);
    return { w, h };
  }, [wStr, hStr]);

  const applyPreset = useCallback((w: number, h: number) => {
    setWStr(String(w));
    setHStr(String(h));
  }, []);

  const onCreate = useCallback(() => {
    const label = name.trim() || 'Untitled piece';
    createProject(label, parsed.w, parsed.h);
    setName('');
  }, [createProject, name, parsed.h, parsed.w]);

  const renderProject = useCallback(
    ({ item }: { item: Project }) => {
      const stats = projectStats(item);
      const active = item.id === activeProjectId;
      return (
        <View
          style={[
            styles.projectCard,
            cardShadowStyle(c.shadow, { offsetY: 3, opacity: 0.08, radius: 8, elevation: 2 }),
            {
              backgroundColor: c.card,
              borderColor: active ? c.tint : c.cardBorder,
              borderWidth: active ? 2 : StyleSheet.hairlineWidth,
            },
          ]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.projectName, { color: c.text }]}>{item.name}</Text>
            <Text style={[styles.projectMeta, { color: c.textMuted }]}>
              Chart {item.width} × {item.height} stitches · {stats.percent}% complete
            </Text>
          </View>
          <View style={styles.projectActions}>
            {!active ? (
              <Pressable
                style={[styles.softBtn, { borderColor: c.tint }]}
                onPress={() => setActiveProject(item.id)}
                accessibilityLabel={`Make ${item.name} the piece you are working on`}>
                <Text style={[styles.softBtnText, { color: c.tint }]}>Work on this</Text>
              </Pressable>
            ) : (
              <View style={[styles.activePill, { backgroundColor: c.surfaceSoft }]}>
                <Text style={[styles.activePillText, { color: c.tint }]}>In progress</Text>
              </View>
            )}
            <Pressable
              hitSlop={12}
              onPress={() => {
                Alert.alert(
                  'Remove this project?',
                  `“${item.name}” will disappear from this device. This cannot be undone.`,
                  [
                    { text: 'Keep it', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => deleteProject(item.id) },
                  ],
                );
              }}
              accessibilityLabel={`Remove project ${item.name}`}>
              <FontAwesome name="trash-o" size={20} color={c.textMuted} />
            </Pressable>
          </View>
        </View>
      );
    },
    [activeProjectId, c, deleteProject, setActiveProject],
  );

  const header = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <View style={[styles.hero, { backgroundColor: c.hero }]}>
          <Text style={styles.heroEmoji} accessibilityLabel="">
            🧵
          </Text>
          <Text style={[styles.heroTitle, { color: c.text }]}>Welcome in</Text>
          <Text style={[styles.heroLead, { color: c.textMuted }]}>
            A quiet place to sketch charts, tick off stitches, and remember what you made — without spreadsheets or
            jargon.
          </Text>
          <View style={styles.pillRow}>
            <Pressable
              style={[styles.pill, { backgroundColor: c.card, borderColor: c.cardBorder }]}
              onPress={() => router.push('/about')}>
              <Text style={[styles.pillText, { color: c.text }]}>About</Text>
            </Pressable>
            <Pressable
              style={[styles.pill, { backgroundColor: c.card, borderColor: c.cardBorder }]}
              onPress={() => router.push('/help')}>
              <Text style={[styles.pillText, { color: c.text }]}>Help</Text>
            </Pressable>
          </View>
        </View>

        {activeProject ? (
          <View style={[styles.spotlight, { backgroundColor: c.card, borderColor: c.tint }]}>
            <Text style={[styles.spotlightLabel, { color: c.textMuted }]}>You are stitching</Text>
            <Text style={[styles.spotlightTitle, { color: c.text }]}>{activeProject.name}</Text>
            <View style={styles.spotlightRow}>
              <Pressable
                style={[styles.primaryMini, { backgroundColor: c.tint }]}
                onPress={() => router.push('/(tabs)/designer')}>
                <Text style={styles.primaryMiniText}>Open chart</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryMini, { borderColor: c.tint }]}
                onPress={() => router.push('/(tabs)/tracker')}>
                <Text style={[styles.secondaryMiniText, { color: c.tint }]}>Track stitches</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: c.text }]}>What would you like to do?</Text>
        <QuickCard
          c={c}
          icon="paint-brush"
          title="Draw a chart"
          subtitle="Pick colours and tap the grid like paint-by-number."
          onPress={() => router.push('/(tabs)/designer')}
        />
        <QuickCard
          c={c}
          icon="th"
          title="Mark your progress"
          subtitle="Tap each stitch as you finish it on fabric."
          onPress={() => router.push('/(tabs)/tracker')}
        />
        <QuickCard
          c={c}
          icon="magic"
          title="Photo to chart"
          subtitle="Start from a picture, then nudge the colours by hand."
          onPress={() => router.push('/(tabs)/convert')}
        />
        <QuickCard
          c={c}
          icon="picture-o"
          title="Gallery"
          subtitle="Browse everything you have saved here."
          onPress={() => router.push('/(tabs)/gallery')}
        />
        <QuickCard
          c={c}
          icon="lightbulb-o"
          title="AI inspiration"
          subtitle="Sketch a motif in words — we save the picture to your gallery."
          onPress={() => router.push('/(tabs)/ai-suggest')}
        />

        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 8 }]}>Start a new piece</Text>
        <View
          style={[
            styles.formCard,
            cardShadowStyle(c.shadow, { offsetY: 6, opacity: 0.08, radius: 14, elevation: 3 }),
            { backgroundColor: c.card, borderColor: c.cardBorder },
          ]}>
          <Text style={[styles.formLabel, { color: c.text }]}>Name (optional)</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Spring roses for Mum"
            placeholderTextColor={c.textMuted}
            style={[styles.input, { color: c.text, borderColor: c.cardBorder, backgroundColor: c.background }]}
          />
          <Text style={[styles.formLabel, { color: c.text, marginTop: 12 }]}>Chart size — how many stitches wide and tall</Text>
          <Text style={[styles.formHint, { color: c.textMuted }]}>
            Think of this as the size of your counted pattern, not your hoop. Smaller charts feel smoother on older
            phones (up to {MAX_SIDE} each way).
          </Text>
          <View style={styles.presetRow}>
            {[
              { label: 'Small', w: 24, h: 24 },
              { label: 'Medium', w: 32, h: 32 },
              { label: 'Large', w: 48, h: 48 },
            ].map((p) => (
              <Pressable
                key={p.label}
                onPress={() => applyPreset(p.w, p.h)}
                style={[styles.preset, { borderColor: c.cardBorder, backgroundColor: c.surfaceSoft }]}>
                <Text style={[styles.presetLabel, { color: c.text }]}>{p.label}</Text>
                <Text style={[styles.presetDims, { color: c.textMuted }]}>
                  {p.w}×{p.h}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.miniLab, { color: c.textMuted }]}>Wide</Text>
              <TextInput
                value={wStr}
                onChangeText={setWStr}
                keyboardType="number-pad"
                style={[styles.input, { color: c.text, borderColor: c.cardBorder, backgroundColor: c.background }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.miniLab, { color: c.textMuted }]}>Tall</Text>
              <TextInput
                value={hStr}
                onChangeText={setHStr}
                keyboardType="number-pad"
                style={[styles.input, { color: c.text, borderColor: c.cardBorder, backgroundColor: c.background }]}
              />
            </View>
          </View>
          <Pressable style={[styles.heroCta, { backgroundColor: c.tint }]} onPress={onCreate}>
            <Text style={styles.heroCtaText}>Start this project</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Your saved pieces</Text>
        {projects.length === 0 ? (
          <Text style={[styles.emptyHint, { color: c.textMuted }]}>
            When you start a project, it will appear here. Nothing to tidy up yet.
          </Text>
        ) : null}
      </View>
    ),
    [activeProject, applyPreset, c, hStr, name, onCreate, projects.length, wStr],
  );

  if (!ready) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: c.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={c.tint} />
        <Text style={[styles.loadingText, { color: c.textMuted }]}>Gathering your studio…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderItem={renderProject}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 36 },
  headerBlock: { paddingBottom: 8 },
  hero: {
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 44, marginBottom: 6 },
  heroTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  heroLead: { fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 10, maxWidth: 340 },
  pillRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillText: { fontSize: 15, fontWeight: '600' },
  spotlight: {
    borderRadius: 18,
    borderWidth: 2,
    padding: 16,
    marginBottom: 20,
  },
  spotlightLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  spotlightTitle: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  spotlightRow: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  primaryMini: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
  primaryMiniText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryMini: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryMiniText: { fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, marginTop: 4 },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontSize: 17, fontWeight: '700' },
  quickSub: { fontSize: 14, lineHeight: 20, marginTop: 2, flexShrink: 1 },
  formCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    marginBottom: 22,
  },
  formLabel: { fontSize: 16, fontWeight: '600' },
  formHint: { fontSize: 14, lineHeight: 21, marginTop: 6 },
  input: {
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 17,
  },
  presetRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  preset: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    alignItems: 'center',
  },
  presetLabel: { fontSize: 14, fontWeight: '700' },
  presetDims: { fontSize: 12, marginTop: 2 },
  rowInputs: { flexDirection: 'row', gap: 12, marginTop: 12 },
  miniLab: { fontSize: 12, marginBottom: 4, fontWeight: '600' },
  heroCta: {
    marginTop: 18,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  heroCtaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  emptyHint: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
  },
  projectName: { fontSize: 18, fontWeight: '700' },
  projectMeta: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  projectActions: { alignItems: 'flex-end', gap: 10 },
  softBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  softBtnText: { fontWeight: '700', fontSize: 14 },
  activePill: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  activePillText: { fontWeight: '700', fontSize: 13 },
});
