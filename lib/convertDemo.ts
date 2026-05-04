import { MASTER_PALETTE } from '@/lib/dmcPalette';
import type { ThreadSwatch } from '@/lib/types';

/** Client-side demo “conversion”: gradient blocks mapped to a small DMC subset (no photo yet). */
export function buildDemoConversion(width: number, height: number, colourSlots: number): {
  design: number[];
  palette: ThreadSwatch[];
} {
  const slots = Math.max(2, Math.min(colourSlots, MASTER_PALETTE.length));
  const palette = MASTER_PALETTE.slice(0, slots);
  const design: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / Math.max(1, width - 1);
      const v = y / Math.max(1, height - 1);
      const t = Math.floor(((u + v) / 2) * slots) % slots;
      design.push(t);
    }
  }
  return { design, palette };
}
