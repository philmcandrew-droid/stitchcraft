import Constants from 'expo-constants';

const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** From https://openrouter.ai/api/v1/models?output_modalities=image (image in output_modalities only). */
const DEFAULT_MODEL_FALLBACKS = [
  'google/gemini-2.5-flash-image',
  'google/gemini-3.1-flash-image-preview',
  'google/gemini-3-pro-image-preview',
  'openai/gpt-5-image-mini',
  'openai/gpt-5-image',
  'openai/gpt-5.4-image-2',
];

function openRouterApiKey(): string {
  const fromEnv = (process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '').trim();
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as { openRouterApiKey?: string } | undefined;
  return (extra?.openRouterApiKey ?? '').trim();
}

function modelsToTry(): string[] {
  const env = process.env.EXPO_PUBLIC_OPENROUTER_IMAGE_MODEL?.trim();
  const extra = Constants.expoConfig?.extra as { openRouterImageModel?: string } | undefined;
  const fromExtra = extra?.openRouterImageModel?.trim();
  const preferred = env || fromExtra;
  const list = preferred
    ? [preferred, ...DEFAULT_MODEL_FALLBACKS.filter((m) => m !== preferred)]
    : [...DEFAULT_MODEL_FALLBACKS];
  return [...new Set(list)];
}

/** OpenRouter wants a real page URL; use full href on http(s), else a stable https fallback (Capacitor file origins). */
function httpReferer(): string {
  if (typeof globalThis !== 'undefined' && 'location' in globalThis) {
    const loc = (globalThis as { location?: { href?: string; protocol?: string } }).location;
    const href = loc?.href;
    if (href && (href.startsWith('http:') || href.startsWith('https:'))) return href;
  }
  return 'https://stitchcraft.app/';
}

type ImageBlock = {
  type?: string;
  url?: string;
  image_url?: { url?: string } | string;
  imageUrl?: { url?: string };
};

const DATA_URL_RE = /data:image\/[a-z0-9+.-]+;base64,[A-Za-z0-9+/=_-]+/i;

function firstFromMessageImages(message: Record<string, unknown>): string | null {
  const images = message.images;
  if (!Array.isArray(images) || images.length === 0) return null;
  const block = images[0] as ImageBlock;
  if (typeof block?.url === 'string') {
    const u = block.url;
    if (u.startsWith('data:image/') || u.startsWith('http://') || u.startsWith('https://')) return u;
  }
  const iu = block?.image_url ?? block?.imageUrl;
  let raw: string | undefined;
  if (typeof iu === 'string') raw = iu;
  else if (iu && typeof iu === 'object' && typeof (iu as { url?: string }).url === 'string') {
    raw = (iu as { url: string }).url;
  }
  if (typeof raw !== 'string') return null;
  if (raw.startsWith('data:image/') || raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return null;
}

function firstFromContentArray(message: Record<string, unknown>): string | null {
  const content = message.content;
  if (!Array.isArray(content)) return null;
  for (const part of content) {
    if (!part || typeof part !== 'object') continue;
    const p = part as Record<string, unknown>;
    if (p.type === 'image_url' && p.image_url) {
      const iu = p.image_url as { url?: string } | string;
      const u = typeof iu === 'string' ? iu : iu?.url;
      if (typeof u === 'string' && (u.startsWith('data:image/') || u.startsWith('http'))) return u;
    }
  }
  return null;
}

function firstFromContentString(message: Record<string, unknown>): string | null {
  const content = message.content;
  if (typeof content !== 'string') return null;
  const m = content.match(DATA_URL_RE);
  return m ? m[0] : null;
}

function firstFromStringifiedMessage(message: Record<string, unknown>): string | null {
  try {
    const raw = JSON.stringify(message);
    const m = raw.match(DATA_URL_RE);
    return m ? m[0] : null;
  } catch {
    return null;
  }
}

function extractImageUrl(message: Record<string, unknown>): string | null {
  return (
    firstFromMessageImages(message) ??
    firstFromContentArray(message) ??
    firstFromContentString(message) ??
    firstFromStringifiedMessage(message)
  );
}

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(`Empty response body (HTTP ${res.status}).`);
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
}

/** Remote PNG/JPEG → data URL for persistence (RN + web). */
export async function imageHttpUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download model image (${res.status}).`);
  const mime = (res.headers.get('content-type') ?? 'image/png').split(';')[0].trim() || 'image/png';
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const b64 = globalThis.btoa(binary);
  return `data:${mime};base64,${b64}`;
}

export type PatternImageGenResult = {
  imageDataUrl: string;
  caption: string;
};

/**
 * Cross-stitch–flavoured reference art (not a counted chart). Uses OpenRouter image output.
 */
export async function generateCrossStitchPatternImage(userPrompt: string): Promise<PatternImageGenResult> {
  const key = openRouterApiKey();
  if (!key) {
    throw new Error(
      'Missing OpenRouter API key. Set EXPO_PUBLIC_OPENROUTER_API_KEY in .env, restart Expo with -c, then rebuild the APK if you use Capacitor.',
    );
  }
  const trimmed = userPrompt.trim();
  if (!trimmed) throw new Error('Describe what you would like to see first.');

  const system =
    'You help cross-stitch enthusiasts. When asked, output one clear reference image that could inspire a counted ' +
    'cross-stitch piece (motif, palette, composition). Prefer simple readable shapes and thread-like colours. ' +
    'Avoid photorealistic human faces when possible. You may add a very short caption in text.';

  const failureLines: string[] = [];
  let lastDetail = '';
  for (const model of modelsToTry()) {
    let res: Response;
    try {
      res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': httpReferer(),
          'X-Title': 'StitchCraft',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            {
              role: 'user',
              content:
                `Inspiration for a cross-stitch project (reference image, not a grid chart): ${trimmed}\n` +
                'Generate one image.',
            },
          ],
          modalities: ['image', 'text'],
          image_config: { aspect_ratio: '1:1' },
        }),
      });
    } catch (e) {
      lastDetail = `${model}: network ${e instanceof Error ? e.message : String(e)}`;
      failureLines.push(lastDetail);
      continue;
    }

    let raw: Record<string, unknown>;
    try {
      raw = await parseJsonResponse(res);
    } catch (e) {
      lastDetail = `${model}: ${e instanceof Error ? e.message : String(e)}`;
      failureLines.push(lastDetail);
      continue;
    }

    if (!res.ok) {
      const err = raw.error as { message?: string } | undefined;
      lastDetail = `${model}: ${err?.message ?? JSON.stringify(raw).slice(0, 200)}`;
      failureLines.push(lastDetail);
      continue;
    }

    const choices = raw.choices as Array<{ message?: Record<string, unknown> }> | undefined;
    const message = choices?.[0]?.message;
    if (!message) {
      lastDetail = `${model}: no message in choices`;
      failureLines.push(lastDetail);
      continue;
    }

    let url = extractImageUrl(message);
    if (!url) {
      lastDetail = `${model}: no image field (try another model or prompt)`;
      failureLines.push(lastDetail);
      continue;
    }

    let imageDataUrl = url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        imageDataUrl = await imageHttpUrlToDataUrl(url);
      } catch (e) {
        lastDetail = `${model}: ${e instanceof Error ? e.message : String(e)}`;
        failureLines.push(lastDetail);
        continue;
      }
    }

    if (!imageDataUrl.startsWith('data:image/')) {
      lastDetail = `${model}: unexpected image format`;
      failureLines.push(lastDetail);
      continue;
    }

    const content = message.content;
    let caption = 'AI pattern inspiration';
    if (typeof content === 'string' && content.trim()) {
      caption = content.trim().replace(DATA_URL_RE, '').trim() || caption;
    } else if (Array.isArray(content)) {
      const textParts = content
        .filter((p) => p && typeof p === 'object' && (p as { type?: string }).type === 'text')
        .map((p) => (p as { text?: string }).text)
        .filter(Boolean);
      if (textParts.length) caption = textParts.join(' ').trim();
    }

    return { imageDataUrl, caption };
  }

  const detailBlock =
    failureLines.length > 0 ? failureLines.join(' | ') : lastDetail || 'unknown';
  throw new Error(
    'No image in the model reply after trying: ' +
      modelsToTry().join(', ') +
      `. Per model: ${detailBlock}. ` +
      'Set EXPO_PUBLIC_OPENROUTER_IMAGE_MODEL to a model with image output (see https://openrouter.ai/models?output_modalities=image), add credits if needed, or simplify your prompt.',
  );
}
