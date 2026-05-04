import type { Project, ThreadSwatch } from '@/lib/types';

export type GridSnapshot = {
  width: number;
  height: number;
  design: number[];
  stitched: boolean[];
  palette: ThreadSwatch[];
};

export const MAX_UNDO = 30;

type Bucket = { past: GridSnapshot[]; future: GridSnapshot[] };

function cloneSnap(s: GridSnapshot): GridSnapshot {
  return {
    width: s.width,
    height: s.height,
    design: [...s.design],
    stitched: [...s.stitched],
    palette: s.palette.map((t) => ({ ...t })),
  };
}

export function snapshotFromProject(p: Project): GridSnapshot {
  return cloneSnap({
    width: p.width,
    height: p.height,
    design: p.design,
    stitched: p.stitched,
    palette: p.palette,
  });
}

export function applySnapshot(p: Project, s: GridSnapshot): Project {
  return {
    ...p,
    width: s.width,
    height: s.height,
    design: [...s.design],
    stitched: [...s.stitched],
    palette: s.palette.map((t) => ({ ...t })),
    updatedAt: Date.now(),
  };
}

export function pushUndo(map: Map<string, Bucket>, projectId: string, before: GridSnapshot): void {
  const b = map.get(projectId) ?? { past: [], future: [] };
  b.past.push(cloneSnap(before));
  if (b.past.length > MAX_UNDO) b.past.shift();
  b.future = [];
  map.set(projectId, b);
}

export function clearHistory(map: Map<string, Bucket>, projectId: string): void {
  map.delete(projectId);
}

export function undo(map: Map<string, Bucket>, projectId: string, current: GridSnapshot): GridSnapshot | null {
  const b = map.get(projectId);
  if (!b || b.past.length === 0) return null;
  const prev = b.past.pop()!;
  b.future.push(cloneSnap(current));
  map.set(projectId, b);
  return prev;
}

export function redo(map: Map<string, Bucket>, projectId: string, current: GridSnapshot): GridSnapshot | null {
  const b = map.get(projectId);
  if (!b || b.future.length === 0) return null;
  const next = b.future.pop()!;
  b.past.push(cloneSnap(current));
  map.set(projectId, b);
  return next;
}

export function canUndo(map: Map<string, Bucket>, projectId: string | null): boolean {
  if (!projectId) return false;
  return (map.get(projectId)?.past.length ?? 0) > 0;
}

export function canRedo(map: Map<string, Bucket>, projectId: string | null): boolean {
  if (!projectId) return false;
  return (map.get(projectId)?.future.length ?? 0) > 0;
}
