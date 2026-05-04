import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { MASTER_PALETTE } from '@/lib/dmcPalette';
import {
  applySnapshot,
  canRedo,
  canUndo,
  clearHistory,
  pushUndo,
  redo as redoSnapshot,
  snapshotFromProject,
  type GridSnapshot,
  undo as undoSnapshot,
} from '@/lib/historyStore';
import { idx, normalizeRect } from '@/lib/grid';
import { enqueueSyncOp } from '@/lib/syncQueue';
import type { PersistedBundle, Project, ThreadSwatch } from '@/lib/types';

const STORAGE_KEY = '@stitchcraft/state_v1';

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyArrays(width: number, height: number): { design: number[]; stitched: boolean[] } {
  const n = width * height;
  return {
    design: Array.from({ length: n }, () => -1),
    stitched: Array.from({ length: n }, () => false),
  };
}

type HistoryBucket = { past: GridSnapshot[]; future: GridSnapshot[] };

type ProjectsContextValue = {
  ready: boolean;
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  historyEpoch: number;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  createProject: (name: string, width: number, height: number) => string;
  setActiveProject: (id: string | null) => void;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  paintCell: (projectId: string, x: number, y: number, masterIndex: number, opts?: { erase?: boolean }) => void;
  toggleStitched: (projectId: string, x: number, y: number) => void;
  fillRectDesign: (
    projectId: string,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    masterIndex: number,
    opts?: { erase?: boolean },
  ) => void;
  completeRectStitches: (projectId: string, x0: number, y0: number, x1: number, y1: number) => void;
  importPattern: (
    projectId: string,
    width: number,
    height: number,
    cells: number[],
    palette: ThreadSwatch[],
  ) => void;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [historyEpoch, setHistoryEpoch] = useState(0);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeProjectId;
  const historyMapRef = useRef(new Map<string, HistoryBucket>());
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpHistory = useCallback(() => setHistoryEpoch((e) => e + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as PersistedBundle;
          if (parsed?.v === 1 && Array.isArray(parsed.projects)) {
            setProjects(parsed.projects);
            setActiveProjectId(parsed.activeProjectId ?? null);
          }
        }
      } catch {
        // ignore corrupt storage
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const bundle: PersistedBundle = { v: 1, projects, activeProjectId };
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
  }, [ready, projects, activeProjectId]);

  useEffect(() => {
    if (!ready) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      void enqueueSyncOp({
        type: 'projects_changed',
        at: Date.now(),
        projectCount: projects.length,
        activeId: activeProjectId,
      });
    }, 900);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [ready, projects, activeProjectId]);

  const createProject = useCallback((name: string, width: number, height: number) => {
    const id = newId();
    const { design, stitched } = emptyArrays(width, height);
    const project: Project = {
      id,
      name: name.trim() || 'Untitled',
      width,
      height,
      design,
      stitched,
      palette: [],
      tags: [],
      updatedAt: Date.now(),
    };
    setProjects((prev) => [project, ...prev]);
    setActiveProjectId(id);
    return id;
  }, []);

  const setActiveProject = useCallback((id: string | null) => {
    setActiveProjectId(id);
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() } : p,
      ),
    );
  }, []);

  const deleteProject = useCallback(
    (id: string) => {
      clearHistory(historyMapRef.current, id);
      bumpHistory();
      setProjects((prev) => {
        const next = prev.filter((p) => p.id !== id);
        if (activeIdRef.current === id) {
          const na = next[0]?.id ?? null;
          queueMicrotask(() => setActiveProjectId(na));
        }
        return next;
      });
    },
    [bumpHistory],
  );

  const paintCell = useCallback(
    (projectId: string, x: number, y: number, masterIndex: number, opts?: { erase?: boolean }) => {
      setProjects((prev) => {
        const cur = prev.find((p) => p.id === projectId);
        if (!cur) return prev;
        if (x < 0 || y < 0 || x >= cur.width || y >= cur.height) return prev;
        if (!opts?.erase && !MASTER_PALETTE[masterIndex]) return prev;
        pushUndo(historyMapRef.current, projectId, snapshotFromProject(cur));
        return prev.map((p) => {
          if (p.id !== projectId) return p;
          if (x < 0 || y < 0 || x >= p.width || y >= p.height) return p;
          const i = idx(x, y, p.width);
          const design = [...p.design];
          const stitched = [...p.stitched];
          if (opts?.erase) {
            design[i] = -1;
            stitched[i] = false;
            return { ...p, design, stitched, updatedAt: Date.now() };
          }
          const thread = MASTER_PALETTE[masterIndex];
          if (!thread) return p;
          let palette = p.palette;
          let local = palette.findIndex((t) => t.dmc === thread.dmc);
          if (local === -1) {
            palette = [...palette, thread];
            local = palette.length - 1;
          }
          design[i] = local;
          stitched[i] = false;
          return { ...p, design, stitched, palette, updatedAt: Date.now() };
        });
      });
      queueMicrotask(() => bumpHistory());
    },
    [bumpHistory],
  );

  const fillRectDesign = useCallback(
    (
      projectId: string,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      masterIndex: number,
      opts?: { erase?: boolean },
    ) => {
      const { xMin, xMax, yMin, yMax } = normalizeRect(x0, y0, x1, y1);
      setProjects((prev) => {
        const cur = prev.find((p) => p.id === projectId);
        if (cur) pushUndo(historyMapRef.current, projectId, snapshotFromProject(cur));
        return prev.map((p) => {
          if (p.id !== projectId) return p;
          const design = [...p.design];
          const stitched = [...p.stitched];
          let palette = [...p.palette];
          const erase = !!opts?.erase;
          const thread = MASTER_PALETTE[masterIndex];
          for (let y = yMin; y <= yMax; y++) {
            for (let x = xMin; x <= xMax; x++) {
              if (x < 0 || y < 0 || x >= p.width || y >= p.height) continue;
              const i = idx(x, y, p.width);
              if (erase) {
                design[i] = -1;
                stitched[i] = false;
                continue;
              }
              if (!thread) continue;
              let local = palette.findIndex((t) => t.dmc === thread.dmc);
              if (local === -1) {
                palette.push(thread);
                local = palette.length - 1;
              }
              design[i] = local;
              stitched[i] = false;
            }
          }
          return { ...p, design, stitched, palette, updatedAt: Date.now() };
        });
      });
      queueMicrotask(() => bumpHistory());
    },
    [bumpHistory],
  );

  const completeRectStitches = useCallback(
    (projectId: string, x0: number, y0: number, x1: number, y1: number) => {
      const { xMin, xMax, yMin, yMax } = normalizeRect(x0, y0, x1, y1);
      setProjects((prev) => {
        const cur = prev.find((p) => p.id === projectId);
        if (cur) pushUndo(historyMapRef.current, projectId, snapshotFromProject(cur));
        return prev.map((p) => {
          if (p.id !== projectId) return p;
          const stitched = [...p.stitched];
          for (let y = yMin; y <= yMax; y++) {
            for (let x = xMin; x <= xMax; x++) {
              if (x < 0 || y < 0 || x >= p.width || y >= p.height) continue;
              const i = idx(x, y, p.width);
              if (p.design[i] >= 0) stitched[i] = true;
            }
          }
          return { ...p, stitched, updatedAt: Date.now() };
        });
      });
      queueMicrotask(() => bumpHistory());
    },
    [bumpHistory],
  );

  const toggleStitched = useCallback(
    (projectId: string, x: number, y: number) => {
      setProjects((prev) => {
        const cur = prev.find((p) => p.id === projectId);
        if (!cur) return prev;
        if (x < 0 || y < 0 || x >= cur.width || y >= cur.height) return prev;
        const ix = idx(x, y, cur.width);
        if (cur.design[ix] < 0) return prev;
        pushUndo(historyMapRef.current, projectId, snapshotFromProject(cur));
        return prev.map((p) => {
          if (p.id !== projectId) return p;
          const stitched = [...p.stitched];
          stitched[ix] = !stitched[ix];
          return { ...p, stitched, updatedAt: Date.now() };
        });
      });
      queueMicrotask(() => bumpHistory());
    },
    [bumpHistory],
  );

  const importPattern = useCallback(
    (projectId: string, width: number, height: number, cells: number[], palette: ThreadSwatch[]) => {
      setProjects((prev) => {
        const cur = prev.find((p) => p.id === projectId);
        if (cur) pushUndo(historyMapRef.current, projectId, snapshotFromProject(cur));
        return prev.map((p) => {
          if (p.id !== projectId) return p;
          const n = width * height;
          const design =
            cells.length === n ? [...cells] : emptyArrays(width, height).design;
          const stitched = Array.from({ length: width * height }, () => false);
          return {
            ...p,
            width,
            height,
            design,
            stitched,
            palette,
            updatedAt: Date.now(),
          };
        });
      });
      queueMicrotask(() => bumpHistory());
    },
    [bumpHistory],
  );

  const undo = useCallback(() => {
    const pid = activeProjectId;
    if (!pid) return;
    setProjects((prev) => {
      const cur = prev.find((p) => p.id === pid);
      if (!cur) return prev;
      const snap = undoSnapshot(historyMapRef.current, pid, snapshotFromProject(cur));
      if (!snap) return prev;
      return prev.map((p) => (p.id === pid ? applySnapshot(p, snap) : p));
    });
    queueMicrotask(() => bumpHistory());
  }, [activeProjectId, bumpHistory]);

  const redo = useCallback(() => {
    const pid = activeProjectId;
    if (!pid) return;
    setProjects((prev) => {
      const cur = prev.find((p) => p.id === pid);
      if (!cur) return prev;
      const snap = redoSnapshot(historyMapRef.current, pid, snapshotFromProject(cur));
      if (!snap) return prev;
      return prev.map((p) => (p.id === pid ? applySnapshot(p, snap) : p));
    });
    queueMicrotask(() => bumpHistory());
  }, [activeProjectId, bumpHistory]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  const canUndoFlag = canUndo(historyMapRef.current, activeProjectId);
  const canRedoFlag = canRedo(historyMapRef.current, activeProjectId);

  const value = useMemo<ProjectsContextValue>(
    () => ({
      ready,
      projects,
      activeProjectId,
      activeProject,
      historyEpoch,
      canUndo: canUndoFlag,
      canRedo: canRedoFlag,
      undo,
      redo,
      createProject,
      setActiveProject,
      renameProject,
      deleteProject,
      paintCell,
      toggleStitched,
      fillRectDesign,
      completeRectStitches,
      importPattern,
    }),
    [
      ready,
      projects,
      activeProjectId,
      activeProject,
      historyEpoch,
      canUndoFlag,
      canRedoFlag,
      undo,
      redo,
      createProject,
      setActiveProject,
      renameProject,
      deleteProject,
      paintCell,
      toggleStitched,
      fillRectDesign,
      completeRectStitches,
      importPattern,
    ],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider');
  return ctx;
}
