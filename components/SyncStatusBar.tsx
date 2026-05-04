import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCraftColors } from '@/hooks/useCraftColors';
import { flushSyncQueue, getSyncEndpoint, readQueue } from '@/lib/syncQueue';

export function SyncStatusBar() {
  const c = useCraftColors();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const url = getSyncEndpoint();

  const onFlush = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const pending = (await readQueue()).length;
      const res = await flushSyncQueue();
      setMessage(`${res.message}${pending ? ` (${pending} waiting)` : ''}`);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <View style={[styles.wrap, { backgroundColor: c.surfaceSoft, borderBottomColor: c.cardBorder }]}>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Hide sync details' : 'Show sync details'}>
        <FontAwesome name="heart" size={14} color={c.tint} style={{ marginRight: 8 }} />
        <Text style={[styles.mainLine, { color: c.text }]} numberOfLines={expanded ? 3 : 2}>
          {expanded
            ? url
              ? `Optional sync is on. Your maker can connect this app to their workspace at: ${url}`
              : 'Everything saves quietly on this device. If your maker adds cloud backup later, it will show up here — nothing for you to set up today.'
            : 'Your patterns and photos stay on this device until you choose to share them.'}
        </Text>
        <FontAwesome name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={c.textMuted} />
      </Pressable>
      {expanded ? (
        <View style={styles.detail}>
          {url ? (
            <Pressable style={[styles.btn, { backgroundColor: c.tint }, busy && styles.btnDisabled]} disabled={busy} onPress={onFlush}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send queued changes</Text>}
            </Pressable>
          ) : (
            <Text style={[styles.hint, { color: c.textMuted }]}>
              Advanced: your maker can set EXPO_PUBLIC_STITCHCRAFT_SYNC_URL to upload a backup list.
            </Text>
          )}
          {message ? <Text style={[styles.msg, { color: c.textMuted }]}>{message}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mainLine: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  detail: { marginTop: 10, gap: 8 },
  btn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  hint: { fontSize: 12, lineHeight: 18 },
  msg: { fontSize: 12, lineHeight: 18 },
});
