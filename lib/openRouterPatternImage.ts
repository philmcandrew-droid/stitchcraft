const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

const DEFAULT_IMAGE_MODEL = 'google/gemini-2.5-flash-image';

function openRouterApiKey(): string {
  return (process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '').trim();
}

function imageModel(): string {
  return (process.env.EXPO_PUBLIC_OPENROUTER_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL).trim() || DEFAULT_IMAGE_MODEL;
}

type ImageBlock = {
  type?: string;
  image_url?: { url?: string };
  imageUrl?: { url?: string };
};

function firstDataImageUrl(message: Record<string, unknown>): string | null {
  const images = message.images;
  if (!Array.isArray(images) || images.length === 0) return null;
  const block = images[0] as ImageBlock;
  const raw = block?.image_url?.url ?? block?.imageUrl?.url;
  return typeof raw === 'string' && raw.startsWith('data:image/') ? raw : null;
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
      'Missing EXPO_PUBLIC_OPENROUTER_API_KEY. Add it to a .env file in the project root and restart Expo.',
    );
  }
  const trimmed = userPrompt.trim();
  if (!trimmed) throw new Error('Describe what you would like to see first.');

  const system =
    'You help cross-stitch enthusiasts. When asked, output one clear reference image that could inspire a counted ' +
    'cross-stitch piece (motif, palette, composition). Prefer simple readable shapes and thread-like colours. ' +
    'Avoid photorealistic human faces when possible. You may add a very short caption in text.';

  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://stitchcraft.app',
      'X-Title': 'StitchCraft',
    },
    body: JSON.stringify({
      model: imageModel(),
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

  const raw = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = raw.error as { message?: string } | undefined;
    const msg = err?.message ?? JSON.stringify(raw).slice(0, 280);
    throw new Error(`OpenRouter (${res.status}): ${msg}`);
  }

  const choices = raw.choices as Array<{ message?: Record<string, unknown> }> | undefined;
  const message = choices?.[0]?.message;
  if (!message) throw new Error('OpenRouter returned no message.');

  const imageDataUrl = firstDataImageUrl(message);
  if (!imageDataUrl) {
    throw new Error(
      'No image in the model reply. Try another EXPO_PUBLIC_OPENROUTER_IMAGE_MODEL that supports image output, or simplify your prompt.',
    );
  }

  const content = message.content;
  const caption =
    typeof content === 'string' && content.trim() ? content.trim() : 'AI pattern inspiration';

  return { imageDataUrl, caption };
}
