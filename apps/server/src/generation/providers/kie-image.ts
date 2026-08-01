import { setTimeout as delay } from "node:timers/promises";

import type { GeneratedImage, ImageGenerateParams, ImageProvider, ModelInfo } from "../types.js";
import { aspectRatioToDimensions, fetchAsBase64, GenerationError } from "../utils.js";

const PROVIDER_NAME = "kie";
const DEFAULT_BASE_URL = "https://api.kie.ai";

const KIE_IMAGE_MODELS: readonly ModelInfo[] = [
  {
    id: "gpt-image-2",
    displayName: "GPT Image 2",
    description:
      "Kie Market GPT Image 2 text-to-image and image editing model.",
  },
];

type KieImageProviderOptions = {
  baseUrl?: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
};

type KieCreateTaskResponse = {
  code?: number;
  msg?: string;
  data?: {
    taskId?: string;
  };
};

type KieRecordInfoResponse = {
  code?: number;
  msg?: string;
  data?: {
    state?: string;
    status?: string;
    failMsg?: string;
    errorMessage?: string;
    resultJson?: string | Record<string, unknown>;
  };
};

export class KieImageProvider implements ImageProvider {
  readonly name = PROVIDER_NAME;
  readonly models = KIE_IMAGE_MODELS;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;

  constructor(apiKey: string, options: KieImageProviderOptions = {}) {
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.pollIntervalMs = options.pollIntervalMs ?? 2000;
    this.timeoutMs = options.timeoutMs ?? 240_000;
  }

  async generate(params: ImageGenerateParams): Promise<GeneratedImage> {
    const aspectRatio = params.aspectRatio ?? "1:1";
    const { width, height } = aspectRatioToDimensions(aspectRatio);

    const imageUrls = params.inputImages?.length
      ? await Promise.all(
          params.inputImages.map(async (url) => {
            const img = await fetchAsBase64(PROVIDER_NAME, url);
            return `data:${img.mimeType};base64,${img.data}`;
          }),
        )
      : undefined;

    const taskId = await this.createTask({
      input: {
        ...(imageUrls ? { imageUrls } : {}),
        prompt: params.prompt,
        size: `${width}x${height}`,
      },
      model: params.model,
    });

    const resultUrl = await this.pollTask(taskId);
    return {
      url: resultUrl,
      mimeType: inferMimeType(resultUrl),
      width,
      height,
    };
  }

  private async createTask(body: Record<string, unknown>): Promise<string> {
    const response = await this.request<KieCreateTaskResponse>(
      "/api/v1/jobs/createTask",
      {
        body: JSON.stringify(body),
        method: "POST",
      },
    );

    const taskId = response.data?.taskId;
    if (!taskId) {
      throw new GenerationError(
        PROVIDER_NAME,
        "api_error",
        response.msg ?? "Kie returned no taskId",
      );
    }
    return taskId;
  }

  private async pollTask(taskId: string): Promise<string> {
    const start = Date.now();

    while (Date.now() - start < this.timeoutMs) {
      const response = await this.request<KieRecordInfoResponse>(
        `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      );
      const data = response.data;
      const state = String(data?.state ?? data?.status ?? "").toLowerCase();

      if (state === "success" || state === "succeeded" || state === "completed") {
        const resultUrl = extractResultUrl(data?.resultJson);
        if (resultUrl) return resultUrl;
        throw new GenerationError(
          PROVIDER_NAME,
          "no_output",
          "Kie task succeeded but returned no image URL",
        );
      }

      if (state === "fail" || state === "failed" || state === "error") {
        throw new GenerationError(
          PROVIDER_NAME,
          "api_error",
          data?.failMsg ?? data?.errorMessage ?? response.msg ?? "Kie task failed",
        );
      }

      await delay(this.pollIntervalMs);
    }

    throw new GenerationError(
      PROVIDER_NAME,
      "api_error",
      `Kie task timed out after ${this.timeoutMs / 1000}s`,
    );
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let lastError: GenerationError | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...init.headers,
        },
      });

      const text = await response.text();
      const payload = text
        ? JSON.parse(text) as T & { code?: number; msg?: string }
        : {} as T & { code?: number; msg?: string };
      if (!response.ok || (payload.code != null && payload.code !== 200)) {
        const message = payload.msg ?? `Kie API request failed with status ${response.status}`;
        const error = new GenerationError(PROVIDER_NAME, "api_error", message);
        if (attempt < 2 && isTransientKieError(message, response.status)) {
          lastError = error;
          await delay(this.pollIntervalMs * (attempt + 1));
          continue;
        }
        throw error;
      }

      return payload;
    }

    throw lastError ?? new GenerationError(PROVIDER_NAME, "api_error", "Kie API request failed");
  }
}

function isTransientKieError(message: string, status?: number): boolean {
  return (
    (status != null && (status === 429 || status >= 500)) ||
    /maintain|maintenance|try again later|temporar|timeout|rate limit/i.test(message)
  );
}

function extractResultUrl(resultJson: unknown): string | null {
  const result =
    typeof resultJson === "string" ? JSON.parse(resultJson) as unknown : resultJson;
  if (!result || typeof result !== "object") return null;

  const record = result as Record<string, unknown>;
  const candidates = [
    record.resultUrl,
    record.resultURL,
    record.url,
    Array.isArray(record.resultUrls) ? record.resultUrls[0] : undefined,
    Array.isArray(record.urls) ? record.urls[0] : undefined,
    Array.isArray(record.images) ? record.images[0] : undefined,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate) return candidate;
    if (candidate && typeof candidate === "object") {
      const nestedUrl = (candidate as Record<string, unknown>).url;
      if (typeof nestedUrl === "string" && nestedUrl) return nestedUrl;
    }
  }
  return null;
}

function inferMimeType(url: string): string {
  const dataUriMatch = url.match(/^data:([^;]+);/);
  if (dataUriMatch?.[1]) return dataUriMatch[1];
  if (/\.webp(?:$|\?)/i.test(url)) return "image/webp";
  if (/\.jpe?g(?:$|\?)/i.test(url)) return "image/jpeg";
  return "image/png";
}
