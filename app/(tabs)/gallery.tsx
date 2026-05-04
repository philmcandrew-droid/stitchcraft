import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { CraftColorScheme } from '@/constants/Colors';
import { useGallery } from '@/context/GalleryContext';
import { useProjects } from '@/context/ProjectsContext';
import { useCraftColors } from '@/hooks/useCraftColors';
import { projectStats } from '@/lib/grid';
import { cardShadowStyle } from '@/lib/shadowPlatform';
import type { GalleryImageEntry } from '@/lib/types';

export default function GalleryScreen() {
  const c = useCraftColors();
  const { ready, projects, activeProjectId, setActiveProject } = useProjects();
  const { ready: galleryReady, galleryImages, removeGalleryImage } = useGallery();

  if (!ready || !galleryReady) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.tint} />
        <Text style={[styles.loading, { color: c.textMuted }]}>Opening your shelf…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <Text style={[styles.heading, { color: c.text }]}>Your gallery</Text>
      <Text style={[styles.sub, { color: c.textMuted }]}>
        AI inspirations stay up top; chart projects are below. Tap a project card to pick it up for tracking.
      </Text>

      {galleryImages.length > 0 ? (
        <View style={styles.aiBlock}>
          <Text style={[styles.aiHeading, { color: c.text }]}>AI pattern moods</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aiStrip}>
            {galleryImages.map((img) => (
              <AiThumb key={img.id} img={img} c={c} onRemove={() => removeGalleryImage(img.id)} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          projects.length > 0 ? (
            <Text style={[styles.sectionCharts, { color: c.text }]}>Chart projects</Text>
          ) : galleryImages.length > 0 ? (
            <Text style={[styles.sectionCharts, { color: c.textMuted }]}>No chart projects yet</Text>
          ) : null
        }
        ListEmptyComponent={
          galleryImages.length === 0 ? (
            <Text style={[styles.muted, { color: c.textMuted }]}>
              Nothing saved yet. When you start a piece on the Welcome tab, it will land here. Use the AI tab to stash
              reference images beside your stitching.
            </Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item: p }) => {
          const stats = projectStats(p);
          const active = p.id === activeProjectId;
          return (
            <Pressable
              style={[
                styles.card,
                cardShadowStyle(c.shadow, { offsetY: 3, opacity: 0.08, radius: 8, elevation: 2 }),
                {
                  backgroundColor: c.card,
                  borderColor: active ? c.tint : c.cardBorder,
                  borderWidth: active ? 2 : StyleSheet.hairlineWidth,
                },
              ]}
              onPress={() => {
                setActiveProject(p.id);
                router.push('/(tabs)/tracker');
              }}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{p.name}</Text>
              <Text style={[styles.muted, { color: c.textMuted }]}>
                Chart {p.width} × {p.height} · {stats.percent}% complete
              </Text>
              {active ? (
                <View style={[styles.tag, { backgroundColor: c.surfaceSoft }]}>
                  <Text style={[styles.tagText, { color: c.tint }]}>Currently in your hands</Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function AiThumb({
  img,
  c,
  onRemove,
}: {
  img: GalleryImageEntry;
  c: CraftColorScheme;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.aiThumbWrap, { borderColor: c.cardBorder, backgroundColor: c.card }]}>
      <Image source={{ uri: img.uri }} style={styles.aiThumbImg} resizeMode="cover" accessibilityLabel="AI inspiration" />
      <Pressable
        hitSlop={10}
        style={styles.aiTrash}
        onPress={() => {
          Alert.alert('Remove this image?', 'It will disappear from this device.', [
            { text: 'Keep', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: onRemove },
          ]);
        }}
        accessibilityLabel="Remove AI image">
        <Text style={[styles.aiTrashText, { color: c.danger }]}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loading: { fontSize: 16 },
  heading: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  sub: { fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 12 },
  aiBlock: { marginBottom: 16 },
  aiHeading: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  aiStrip: { gap: 12, paddingBottom: 4 },
  aiThumbWrap: {
    width: 120,
    height: 120,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  aiThumbImg: { width: '100%', height: '100%' },
  aiTrash: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTrashText: { fontSize: 20, fontWeight: '700', lineHeight: 22 },
  sectionCharts: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  list: { paddingBottom: 36, gap: 0 },
  card: {
    borderRadius: 18,
    padding: 18,
  },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  muted: { fontSize: 15, marginTop: 6, lineHeight: 22 },
  tag: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  tagText: { fontWeight: '700', fontSize: 13 },
});
