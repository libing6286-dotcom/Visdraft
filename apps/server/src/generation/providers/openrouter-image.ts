import OpenAI from 'openai';

import type { GeneratedImage, ImageGenerateParams, ImageProvider, ModelInfo } from "../types.js";
import { aspectRatioToDimensions, fetchAsBase64, GenerationError } from "../utils.js";

const PROVIDER_NAME = "openrouter";

// OpenRouter 支持的图像生成模型列表。
// 注意：OpenRouter 的图像生成走 /chat/completions 端点（modalities: ["image","text"]），
// 而非 OpenAI 的 /images/generations 端点。模型必须在 output_modalities 中包含 "image"。
// 可在 https://openrouter.ai/models?fmt=cards&output_modalities=image 查询可用模型。
const OPENROUTER_IMAGE_MODELS: readonly ModelInfo[] = [
  {
    // 注意：此处的 id 会被原样作为 OpenRouter 的 model slug 透传（见 generate() 中的
    // chatRequest.model），因此必须是 OpenRouter 真实存在且 output_modalities 含 "image"
    // 的模型。可用列表见 https://openrouter.ai/models?fmt=cards&output_modalities=image
    //
    // 选型说明：Google Gemini 系列图像模型在中国大陆地区被 OpenRouter 封禁（403
    // "not available in your region"），故默认改用 OpenAI 图像模型。若后续给本 provider
    // 接入了允许地区的代理（OpenRouter SDK 支持 serverURL 选项），可切回 Gemini。
    id: "nex-agi/nex-n2-pro:free",
    displayName: "nex-agi/nex-n2-pro",
    description:
      "OpenAI GPT-5 native image generation & editing, served through OpenRouter. Supports text-to-image and image editing with input images.",
  },
  // 备选模型（按需启用；启用前确认在你所在地区可用）：
  //   - openai/gpt-5-image-mini            // 更便宜，适合测试
  //   - openai/gpt-5.4-image-2
  //   - google/gemini-2.5-flash-image      // 质量好，但中国大陆地区被封禁，需代理
  //   - google/gemini-3-pro-image-preview
  //   - google/gemini-3.1-flash-image-preview
  // {
  //   id: "black-forest-labs/flux.2-pro",
  //   displayName: "Flux.2 Pro",
  //   description: "Black Forest Labs' Flux.2 Pro — high-quality image generation.",
  //   iconUrl: "https://tjzk.replicate.delivery/models_organizations_avatar/01ed70be-0d47-4a4a-85fb-32c02cdd4ab5/bfl.png",
  // },
];

/**
 * OpenRouter 在 chat completion 响应的 assistant message 上附加了 `images` 字段返回生成图像
 * （base64 data URL），@openrouter/sdk 已将其建模为 ChatAssistantImages，无需手动扩展类型。
 * 参考：https://openrouter.ai/docs/features/multimodal/image-generation
 */
export class OpenRouterImageProvider implements ImageProvider {
  readonly name = PROVIDER_NAME;
  readonly models = OPENROUTER_IMAGE_MODELS;
  private client: OpenAI;

  constructor(apiKey: string) {
    // OpenRouter 使用 OpenAI 兼容的 API，通过设置 baseURL 切换端点。
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey
    });
  }

  async generate(params: ImageGenerateParams): Promise<GeneratedImage> {
    const aspectRatio = params.aspectRatio ?? "1:1";
    const { width, height } = aspectRatioToDimensions(aspectRatio);

    // 构造消息内容：文本 prompt + 可选的输入图像（用于图像编辑）。
    // OpenRouter 接受 image_url 类型的 content part，url 可为 http(s) 或 base64 data URI。
    // 注意：@openrouter/sdk 的入参用驼峰 `imageUrl`（SDK 会在上行时 remap 为 image_url）。
    const content: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; imageUrl: { url: string } }
    > = [{ type: "text", text: params.prompt }];

    if (params.inputImages?.length) {
      const fetched = await Promise.all(
        params.inputImages.map((url) => fetchAsBase64(PROVIDER_NAME, url)),
      );
      for (const img of fetched) {
        content.push({
          type: "image_url",
          imageUrl: { url: `data:${img.mimeType};base64,${img.data}` },
        });
      }
    }

    let response;
    try {
      // 注意：@openrouter/sdk 的 chat.send 接收的是请求信封，真正的 completion
      // 参数必须包裹在 `chatRequest` 字段内，否则 SDK 的 Zod 校验会报
      // "expected object, received undefined"（path: ["chatRequest"]）。
      response = await this.client.chat.completions.create({
        model: params.model,
        messages: [{ role: "user", content: '生成一张穿着jk的神明少女' }],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown OpenRouter error";
      // OpenRouter 对部分模型（如 Google Gemini 系列图像模型）有地区限制，命中时返回
      // 403 ForbiddenResponseError。单独归类，便于上层给用户更明确的提示/切换模型。
      const isRegionBlocked =
        (error instanceof Error && error.name === "ForbiddenResponseError") ||
        /not available in your region/i.test(message);
      throw new GenerationError(
        PROVIDER_NAME,
        isRegionBlocked ? "region_blocked" : "api_error",
        isRegionBlocked
          ? `OpenRouter model "${params.model}" is not available in your region. ${message}`
          : message,
      );
    }

    // 生成的图像位于 message.images 数组中（OpenRouter 扩展字段，SDK 已建模为 ChatAssistantImages）。
    const message = response.choices?.[0]?.message;
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
