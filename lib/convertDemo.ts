import { MASTER_PALETTE } from '@/lib/dmcPalette';
import type { ThreadSwatch } from '@/lib/types';

function mix32(n: number): number {
  let x = n | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

/** Client-side demo “conversion”: a new layout each time (seed), mapped to a DMC subset. */
export function buildDemoConversion(
  width: number,
  height: number,
  colourSlots: number,
  seed: number = Date.now(),
): {
  design: number[];
  palette: ThreadSwatch[];
} {
  const slots = Math.max(2, Math.min(colourSlots, MASTER_PALETTE.length));
  const off = mix32(seed) % Math.max(1, MASTER_PALETTE.length - slots + 1);
  const palette = MASTER_PALETTE.slice(off, off + slots);
  const s = mix32(seed ^ 0x9e3779b9) / 0xffffffff;
  const angle = s * Math.PI * 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const warp = 0.35 + (mix32(seed + 1) % 100) / 200;
  const design: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / Math.max(1, width - 1);
      const v = y / Math.max(1, height - 1);
      const ru = u * cos - v * sin;
      const rv = u * sin + v * cos;
      const n = mix32(seed + x * 92837111 + y * 689287499) / 0xffffffff;
      const wobble = Math.sin((u + v) * Math.PI * warp + n * 6.2831853) * 0.15;
      let a = (ru + rv) * 0.5 + wobble;
      a = ((a % 1) + 1) % 1;
      const t = Math.min(slots - 1, Math.floor(a * slots));
      design.push(t);
    }
  }
  return { design, palette };
}
