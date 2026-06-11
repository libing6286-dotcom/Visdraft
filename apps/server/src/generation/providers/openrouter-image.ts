import OpenAI from "openai";

import type { GeneratedImage, ImageGenerateParams, ImageProvider, ModelInfo } from "../types.js";
import { aspectRatioToDimensions, fetchAsBase64, GenerationError } from "../utils.js";

const PROVIDER_NAME = "openrouter";

// OpenRouter 支持的图像生成模型列表。
// 注意：OpenRouter 的图像生成走 /chat/completions 端点（modalities: ["image","text"]），
// 而非 OpenAI 的 /images/generations 端点。模型必须在 output_modalities 中包含 "image"。
// 可在 https://openrouter.ai/models?fmt=cards&output_modalities=image 查询可用模型。
const OPENROUTER_IMAGE_MODELS: readonly ModelInfo[] = [
  {
    id: "nvidia/llama-nemotron-rerank-vl-1b-v2:free",
    displayName: "nemotron",
    description:
      "Google Gemini 2.5 Flash native image generation & editing, served through OpenRouter. Supports text-to-image and image editing with input images.",
    iconUrl:
      "https://tjzk.replicate.delivery/models_organizations_avatar/27e1e3fe-f766-4748-83b3-777bc282d8dd/1342004.png",
  },
  // {
  //   id: "black-forest-labs/flux.2-pro",
  //   displayName: "Flux.2 Pro",
  //   description: "Black Forest Labs' Flux.2 Pro — high-quality image generation.",
  //   iconUrl: "https://tjzk.replicate.delivery/models_organizations_avatar/01ed70be-0d47-4a4a-85fb-32c02cdd4ab5/bfl.png",
  // },
];

/**
 * OpenRouter 在标准 chat completion 响应的 message 上附加了非标准的 `images` 字段，
 * 用于返回生成的图像（base64 data URL）。OpenAI SDK 的类型里没有这个字段，故在此扩展。
 * 参考：https://openrouter.ai/docs/features/multimodal/image-generation
 */
interface OpenRouterImage {
  type?: string;
  image_url?: { url?: string };
}

export class OpenRouterImageProvider implements ImageProvider {
  readonly name = PROVIDER_NAME;
  readonly models = OPENROUTER_IMAGE_MODELS;
  private client: OpenAI;

  constructor(apiKey: string) {
    // OpenRouter 使用 OpenAI 兼容的 API，通过设置 baseURL 切换端点。
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        // OpenRouter 推荐携带来源信息，用于排行榜归因（可选）。
        "HTTP-Referer": process.env.OPENROUTER_REFERER || "https://loomic.ai",
        "X-Title": "Loomic",
      },
    });
  }

  async generate(params: ImageGenerateParams): Promise<GeneratedImage> {
    const aspectRatio = params.aspectRatio ?? "1:1";
    const { width, height } = aspectRatioToDimensions(aspectRatio);

    // 构造消息内容：文本 prompt + 可选的输入图像（用于图像编辑）。
    // OpenRouter 接受 image_url 类型的 content part，url 可为 http(s) 或 base64 data URI。
    const content: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [{ type: "text", text: params.prompt }];

    if (params.inputImages?.length) {
      const fetched = await Promise.all(
        params.inputImages.map((url) => fetchAsBase64(PROVIDER_NAME, url)),
      );
      for (const img of fetched) {
        content.push({
          type: "image_url",
          image_url: { url: `data:${img.mimeType};base64,${img.data}` },
        });
      }
    }

    let response;
    try {
      response = await this.client.chat.completions.create({
        model: params.model,
        // 关键：启用图像输出模态，否则 OpenRouter 只会返回文本。
        modalities: ["image", "text"],
        messages: [{ role: "user", content }],
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);
    } catch (error) {
      throw new GenerationError(
        PROVIDER_NAME,
        "api_error",
        error instanceof Error ? error.message : "Unknown OpenRouter error",
      );
    }

    // 生成的图像位于 message.images 数组中（OpenRouter 扩展字段）。
    const message = response.choices?.[0]?.message as
      | (OpenAI.Chat.Completions.ChatCompletionMessage & { images?: OpenRouterImage[] })
      | undefined;
    const dataUrl = message?.images?.[0]?.image_url?.url;

    if (!dataUrl) {
      // 拿不到图像时，把模型返回的文本带上，便于排查（如安全拦截、模型不支持图像输出等）。
      const textHint =
        typeof message?.content === "string" ? message.content.slice(0, 200) : "";
      throw new GenerationError(
        PROVIDER_NAME,
        "no_output",
        `OpenRouter returned no image${textHint ? ` (model said: ${textHint})` : ""}`,
      );
    }

    // 解析 data URI 的 mimeType；OpenRouter 通常返回 PNG。
    const mimeMatch = dataUrl.match(/^data:([^;]+);/);
    const mimeType = mimeMatch?.[1] ?? "image/png";

    return { url: dataUrl, mimeType, width, height };
  }
}
