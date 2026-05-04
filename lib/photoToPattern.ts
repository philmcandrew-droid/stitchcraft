import { decode } from 'jpeg-js';
import * as FileSystem from 'expo-file-system';

import { deltaE76, hexToRgb, nearestIndexByDeltaE, rgbToLab } from '@/lib/colorLab';
import { MASTER_PALETTE, MASTER_PALETTE_LAB } from '@/lib/dmcPalette';
import type { ThreadSwatch } from '@/lib/types';

function base64ToUint8Array(b64: string): Uint8Array {
  const atobFn = globalThis.atob;
  if (typeof atobFn !== 'function') throw new Error('Base64 decode is not available in this environment.');
  const binaryString = atobFn(b64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i) & 0xff;
  return bytes;
}

function cellAverageRgb(
  data: Uint8Array,
  sw: number,
  sh: number,
  channels: 3 | 4,
  tx: number,
  ty: number,
  tw: number,
  th: number,
): [number, number, number] {
  const x0 = Math.floor((tx / tw) * sw);
  const x1 = Math.max(x0 + 1, Math.ceil(((tx + 1) / tw) * sw));
  const y0 = Math.floor((ty / th) * sh);
  const y1 = Math.max(y0 + 1, Math.ceil(((ty + 1) / th) * sh));
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const stride = channels;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const o = (y * sw + x) * stride;
      r += data[o];
      g += data[o + 1];
      b += data[o + 2];
      n++;
    }
  }
  if (n === 0) return [0, 0, 0];
  return [r / n, g / n, b / n];
}

function kMeansLab(points: [number, number, number][], k: number, iterations = 6): [number, number, number][] {
  if (k <= 0 || points.length === 0) return [];
  if (k >= points.length) return points.map((p) => [...p] as [number, number, number]);
  const centroids: [number, number, number][] = [];
  const step = Math.max(1, Math.floor(points.length / k));
  for (let i = 0; i < k; i++) {
    const p = points[Math.min(points.length - 1, i * step)];
    centroids.push([p[0], p[1], p[2]]);
  }
  const assign = new Int32Array(points.length);
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < points.length; i++) {
      let best = 0;
      let bestD = Number.POSITIVE_INFINITY;
      for (let c = 0; c < k; c++) {
        const d = deltaE76(points[i], centroids[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      assign[i] = best;
    }
    const sums: [number, number, number][] = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Int32Array(k);
    for (let i = 0; i < points.length; i++) {
      const c = assign[i];
      sums[c][0] += points[i][0];
      sums[c][1] += points[i][1];
      sums[c][2] += points[i][2];
      counts[c]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue;
      centroids[c] = [
        sums[c][0] / counts[c],
        sums[c][1] / counts[c],
        sums[c][2] / counts[c],
      ];
    }
  }
  return centroids;
}

export async function jpegFileUriToPattern(opts: {
  uri: string;
  targetWidth: number;
  targetHeight: number;
  maxColours: number;
}): Promise<{ design: number[]; palette: ThreadSwatch[] }> {
  const { uri, targetWidth, targetHeight, maxColours } = opts;
  const tw = Math.max(2, Math.floor(targetWidth));
  const th = Math.max(2, Math.floor(targetHeight));
  const k = Math.max(2, Math.min(maxColours, 48));

  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  const bytes = base64ToUint8Array(base64);
  const raw = decode(bytes, {
    useTArray: true,
    formatAsRGBA: true,
    maxResolutionInMP: 32,
    maxMemoryUsageInMB: 512,
  });
  const sw = raw.width;
  const sh = raw.height;
  const data = raw.data;
  const channels: 4 = 4;

  const cellLabs: [number, number, number][] = [];
  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      const rgb = cellAverageRgb(data, sw, sh, channels, tx, ty, tw, th);
      cellLabs.push(rgbToLab(rgb as [number, number, number]));
    }
  }

  const maxSamples = 2800;
  let sample: [number, number, number][] = cellLabs;
  if (cellLabs.length > maxSamples) {
    const stride = Math.ceil(cellLabs.length / maxSamples);
    sample = [];
    for (let i = 0; i < cellLabs.length; i += stride) sample.push(cellLabs[i]);
  }

  const centroids = kMeansLab(sample, Math.min(k, sample.length), 6);
  const paletteThreads: ThreadSwatch[] = centroids.map((lab) => {
    const rgbApprox = labToRgbApprox(lab);
    const mi = nearestIndexByDeltaE(rgbApprox, MASTER_PALETTE_LAB);
    return MASTER_PALETTE[mi];
  });

  const paletteLabs = paletteThreads.map((t) => rgbToLab(hexToRgb(t.hex)) as [number, number, number]);
  const palette: ThreadSwatch[] = [];
  const paletteIndexByDmc = new Map<string, number>();
  for (const t of paletteThreads) {
    if (!paletteIndexByDmc.has(t.dmc)) {
      paletteIndexByDmc.set(t.dmc, palette.length);
      palette.push(t);
    }
  }

  const design: number[] = [];
  for (let i = 0; i < cellLabs.length; i++) {
    let best = 0;
    let bestD = Number.POSITIVE_INFINITY;
    for (let c = 0; c < centroids.length; c++) {
      const d = deltaE76(cellLabs[i], paletteLabs[c]);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    const thread = paletteThreads[best];
    const pi = paletteIndexByDmc.get(thread.dmc) ?? 0;
    design.push(pi);
  }

  return { design, palette };
}

/** Rough inverse for picking nearest thread from a centroid in Lab space. */
function labToRgbApprox(lab: [number, number, number]): [number, number, number] {
  const fy = (lab[0] + 16) / 116;
  const fx = lab[1] / 500 + fy;
  const fz = fy - lab[2] / 200;
  const e = 0.008856;
  const xr = fx > 0.206893 ? fx * fx * fx : (fx - 16 / 116) / 7.787;
  const yr = fy > 0.206893 ? fy * fy * fy : (fy - 16 / 116) / 7.787;
  const zr = fz > 0.206893 ? fz * fz * fz : (fz - 16 / 116) / 7.787;
  const x = xr * 0.95047;
  const y = yr * 1.0;
  const z = zr * 1.08883;
  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
  const comp = (c: number) => {
    c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(Math.min(255, Math.max(0, c * 255)));
  };
  return [comp(r), comp(g), comp(b)];
}
