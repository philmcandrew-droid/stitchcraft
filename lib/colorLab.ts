/** sRGB 0–255 → linear 0–1 */
function channelToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToLab(rgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb.map(channelToLinear) as [number, number, number];
  let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  let y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  let z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;

  x /= 0.95047;
  y /= 1.0;
  z /= 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function deltaE76(lab1: [number, number, number], lab2: [number, number, number]): number {
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function nearestIndexByDeltaE(
  rgb: [number, number, number],
  candidates: { lab: [number, number, number] }[],
): number {
  const lab = rgbToLab(rgb);
  let best = 0;
  let bestD = Number.POSITIVE_INFINITY;
  for (let i = 0; i < candidates.length; i++) {
    const d = deltaE76(lab, candidates[i].lab);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}
