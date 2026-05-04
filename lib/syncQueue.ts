import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@stitchcraft/sync_queue_v1';

export type SyncOp = {
  id: string;
  type: 'projects_changed';
  at: number;
  projectCount: number;
  activeId: string | null;
};

function newOpId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function readQueue(): Promise<SyncOp[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncOp[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function enqueueSyncOp(op: Omit<SyncOp, 'id'>): Promise<void> {
  const q = await readQueue();
  const next: SyncOp[] = [
    ...q,
    { ...op, id: newOpId() },
  ].slice(-400);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export function getSyncEndpoint(): string | undefined {
  const v = process.env.EXPO_PUBLIC_STITCHCRAFT_SYNC_URL;
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export async function flushSyncQueue(): Promise<{ ok: boolean; message: string }> {
  const url = getSyncEndpoint();
  if (!url) {
    return { ok: false, message: 'Set EXPO_PUBLIC_STITCHCRAFT_SYNC_URL to enable remote flush.' };
  }
  const q = await readQueue();
  if (q.length === 0) {
    return { ok: true, message: 'Queue empty — nothing to send.' };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ops: q }),
    });
    if (!res.ok) {
      return { ok: false, message: `Server ${res.status}` };
    }
    await clearQueue();
    return { ok: true, message: `Sent ${q.length} operations.` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    return { ok: false, message: msg };
  }
}
