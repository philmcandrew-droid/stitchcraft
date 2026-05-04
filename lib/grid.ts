import type { Project } from '@/lib/types';

export function idx(x: number, y: number, width: number): number {
  return y * width + x;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function normalizeRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { xMin: number; xMax: number; yMin: number; yMax: number } {
  return {
    xMin: Math.min(x0, x1),
    xMax: Math.max(x0, x1),
    yMin: Math.min(y0, y1),
    yMax: Math.max(y0, y1),
  };
}

export function projectStats(project: Project): {
  stitchable: number;
  stitched: number;
  percent: number;
  byPaletteIndex: { index: number; total: number; done: number }[];
} {
  const { width, height, design, stitched, palette } = project;
  const by: Map<number, { total: number; done: number }> = new Map();
  let stitchable = 0;
  let done = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y, width);
      const c = design[i];
      if (c < 0) continue;
      stitchable++;
      if (stitched[i]) done++;
      const cur = by.get(c) ?? { total: 0, done: 0 };
      cur.total++;
      if (stitched[i]) cur.done++;
      by.set(c, cur);
    }
  }
  const byPaletteIndex = palette.map((_, index) => {
    const row = by.get(index);
    return { index, total: row?.total ?? 0, done: row?.done ?? 0 };
  });
  const percent = stitchable === 0 ? 0 : Math.round((done / stitchable) * 1000) / 10;
  return { stitchable, stitched: done, percent, byPaletteIndex };
}
