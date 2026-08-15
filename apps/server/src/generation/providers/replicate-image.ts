import type { GeneratedImage, ImageGenerateParams, ImageProvider, ModelInfo } from "../types.js";
import { aspectRatioToDimensions, GenerationError } from "../utils.js";

const REPLICATE_API_BASE = "https://api.replicate.com/v1";

/**
 * Image input parameter mapping per model.
 *
 * Replicate models use different parameter names for image input:
 * - `input_image`  (single URL string)  → Flux Kontext family
 * - `input_images` (array of URL strings) → OpenAI GPT Image
 * - `image_input`  (array of URL strings) → Google Nano Banana, ByteDance Seedream (default)
 */
const SINGLE_IMAGE_INPUT_MODELS = new Set([
  "black-forest-labs/flux-1.1-pro",
  "black-forest-labs/flux-pro",
]);

const INPUT_IMAGES_MODELS = new Set([
  "openai/gpt-image-2",
]);

/**
 * Models that don't support any image input.
 */
const TEXT_ONLY_MODELS = new Set([
  "google/imagen-3",
  "recraft-ai/recraft-v3",
]);

const ICON_GOOGLE = "https://tjzk.replicate.delivery/models_organizations_avatar/27e1e3fe-f766-4748-83b3-777bc282d8dd/1342004.png";
const ICON_OPENAI = "https://github.com/openai.png";
const ICON_BYTEDANCE = "https://github.com/bytedance.png";

const REPLICATE_IMAGE_MODELS: readonly ModelInfo[] = [
  // Google
  {
    id: "google/nano-banana-pro",
    displayName: "Nano Banana Pro",
    description: "Google's SOTA image generation & editing model. Image input: up to 14 images. Up to 4K resolution. Best for multi-reference editing.",
    iconUrl: ICON_GOOGLE,
  },
  {
    id: "google/nano-banana-2",
    displayName: "Nano Banana 2",
    description: "Fast image generation with conversational editing and character consistency. Image input: up to 14 images. Good for multi-image fusion.",
    iconUrl: ICON_GOOGLE,
  },
  // OpenAI
  {
    id: "openai/gpt-image-2",
    displayName: "GPT Image 2",
    description: "OpenAI's latest image model with strong instruction following and image editing. Image input: multiple images. Supports background transparency.",
    iconUrl: ICON_OPENAI,
  },
  // ByteDance
  {
    id: "bytedance/seedream-5-lite",
    displayName: "Seedream 5.0 Lite",
    description: "Image generation with built-in reasoning and example-based editing. Image input: multiple images. Up to 3K resolution.",
    iconUrl: ICON_BYTEDANCE,
  },
  {
    id: "bytedance/seedream-5-pro",
    displayName: "Seedream 5.0 Pro",
    description: "ByteDance's high-quality image generation and editing model. Image input: multiple images. Supports 1K and 2K output.",
    iconUrl: ICON_BYTEDANCE,
  },
  // xAI
  {
    id: "xai/grok-imagine-image-2",
    displayName: "Grok Imagine Image 2",
    description: "xAI's image generation model for prompt-based creative image generation.",
  },
];

// ── Quality → model-specific resolution translation ──────────────────────

type QualityMap = Record<string, Record<string, { param: string; value: string }>>;

/**
 * Maps (model prefix → quality level → { paramName, paramValue }).
 * Lookup order: exact model ID → prefix before "/" → fallback.
 */
const QUALITY_MAP: QualityMap = {
  // Google Nano Banana Pro / 2: uses `resolution`
  "google/nano-banana-pro": {
    standard: { param: "resolution", value: "1K" },
    hd:       { param: "resolution", value: "2K" },
    ultra:    { param: "resolution", value: "4K" },
  },
  "google/nano-banana-2": {
    standard: { param: "resolution", value: "1K" },
    hd:       { param: "resolution", value: "2K" },
    ultra:    { param: "resolution", value: "4K" },
  },
  // ByteDance Seedream 5 Lite: uses `size`, max 3K
  "bytedance/seedream-5-lite": {
    standard: { param: "size", value: "2K" },
    hd:       { param: "size", value: "2K" },
    ultra:    { param: "size", value: "3K" },
  },
  // ByteDance Seedream 5 Pro: uses `size`, max 2K
  "bytedance/seedream-5-pro": {
    standard: { param: "size", value: "1K" },
    hd:       { param: "size", value: "2K" },
    ultra:    { param: "size", value: "2K" },
  },
};

/** GPT Image 1.5 quality mapping (native `quality` param) */
const GPT_IMAGE_QUALITY: Record<string, string> = {
  standard: "medium",
  hd: "high",
  ultra: "high",
};

function applyQuality(
  input: Record<string, unknown>,
  model: string,
  quality: string | undefined,
): void {
  if (!quality) return;

  // GPT Image has native `quality` param
  if (INPUT_IMAGES_MODELS.has(model)) {
    input.quality = GPT_IMAGE_QUALITY[quality] ?? "auto";
    return;
  }

  // Lookup quality translation for this model
  const modelMap = QUALITY_MAP[model];
  if (modelMap) {
    const entry = modelMap[quality];
    if (entry) {
      input[entry.param] = entry.value;
    }
  }
  // Models not in QUALITY_MAP: no resolution param, skip.
}

// ── Aspect ratio normalization ────────────────────────────────────────────

/**
 * Models with restricted aspect_ratio support.
 * Models NOT listed here accept all ratios the tool exposes.
 */
const MODEL_ASPECT_RATIOS: Record<string, string[]> = {
  "openai/gpt-image-2":   ["1:1", "3:2", "2:3", "16:9", "9:16", "4:3", "3:4"],
  "bytedance/seedream-5-pro": ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
};

function parseRatio(ratio: string): number {
  const [w, h] = ratio.split(":").map(Number);
  return (w && h) ? w / h : 1;
}

/**
 * If the model doesn't support the requested ratio, find the nearest one.
 * e.g. "16:9" (1.78) → "3:2" (1.5) for GPT Image.
 */
function normalizeAspectRatio(model: string, ratio: string): string {
  const supported = MODEL_ASPECT_RATIOS[model];
  if (!supported || supported.includes(ratio)) return ratio;

  const target = parseRatio(ratio);
  let best = supported[0]!;
  let bestDiff = Math.abs(parseRatio(best) - target);

  for (const candidate of supported) {
    const diff = Math.abs(parseRatio(candidate) - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }
  return best;
}

// ── Output format translation ────────────────────────────────────────────

function applyOutputFormat(
  input: Record<string, unknown>,
  format: string | undefined,
): void {
  if (!format) return;
  input.output_format = format;
}

// ── Provider implementation ──────────────────────────────────────────────

export class ReplicateImageProvider implements ImageProvider {
  readonly name = "replicate";
  readonly models = REPLICATE_IMAGE_MODELS;
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  async generate(params: ImageGenerateParams): Promise<GeneratedImage> {
    const rawRatio = params.aspectRatio ?? "1:1";
    const aspectRatio = normalizeAspectRatio(params.model, rawRatio);
    const { width, height } = aspectRatioToDimensions(aspectRatio);

    const input: Record<string, unknown> = {
      prompt: params.prompt,
    };

    input.aspect_ratio = aspectRatio;

    // Image input — parameter name varies by model
    if (params.inputImages?.length && !TEXT_ONLY_MODELS.has(params.model)) {
      if (SINGLE_IMAGE_INPUT_MODELS.has(params.model)) {
        input.input_image = params.inputImages[0];
      } else if (INPUT_IMAGES_MODELS.has(params.model)) {
        input.input_images = params.inputImages;
      } else {
        input.image_input = params.inputImages;
      }
    }

    // Semantic params → model-specific translation
    applyQuality(input, params.model, params.quality);
    applyOutputFormat(input, params.outputFormat);

    const response = await fetch(
      `${REPLICATE_API_BASE}/models/${params.model}/predictions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
          Prefer: "wait=59",
        },
        body: JSON.stringify({ input }),
        signal: AbortSignal.timeout(120_000), // 120s — guard against Replicate hanging
      },
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new GenerationError(
        "replicate",
        "api_error",
        `Replicate API error ${response.status}: ${(errorBody as { detail?: string })?.detail ?? "Unknown error"}`,
      );
    }

    const data = (await response.json()) as {
      id: string;
      output: string[] | string | null;
      status: string;
      error?: string;
      urls?: { get?: string };
    };
    let output = data.output;
    const isNonTerminal = data.status !== "succeeded" && data.status !== "failed" && data.status !== "canceled";
    if (!output && isNonTerminal && data.urls?.get) {
      output = await this.pollForResult(data.urls.get);
    }

    const outputUrl = Array.isArray(output) ? output[0] : output;

    if (!outputUrl) {
      throw new GenerationError(
        "replicate",
        "no_output",
        `Replicate returned no output URL (prediction ${data.id}, status ${data.status}${data.error ? `: ${data.error}` : ""})`,
      );
    }

    const mimeType = params.outputFormat === "jpg" ? "image/jpeg"
      : params.outputFormat === "webp" ? "image/webp"
      : "image/png";

    return { url: outputUrl, mimeType, width, height };
  }

  private async pollForResult(predictionUrl: string, maxWaitMs = 300_000): Promise<string | null> {
    const start = Date.now();
    const interval = 5_000;
    let firstPoll = true;

    while (Date.now() - start < maxWaitMs) {
      if (!firstPoll) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
      firstPoll = false;

      const response = await fetch(predictionUrl, {
        headers: { Authorization: `Bearer ${this.apiToken}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) continue;

      const prediction = (await response.json()) as {
        output: string | string[] | null;
        status: string;
        error?: string;
      };
      if (prediction.status === "succeeded" && prediction.output) {
        return Array.isArray(prediction.output)
          ? (prediction.output[0] ?? null)
          : prediction.output;
      }
      if (prediction.status === "failed" || prediction.status === "canceled") {
        throw new GenerationError(
          "replicate",
          "prediction_failed",
          `Image prediction failed: ${prediction.error ?? prediction.status}`,
        );
      }
    }

    throw new GenerationError("replicate", "timeout", "Image generation timed out waiting for Replicate");
  }
}
