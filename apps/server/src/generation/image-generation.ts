import type { GeneratedImage, ImageGenerateParams } from "./types.js";
import { getImageProvider } from "./providers/registry.js";
import {
  isReplicateImageModel,
  REPLICATE_IMAGE_PROVIDER_NAME,
} from "./providers/replicate-image.js";

export async function generateImage(
  providerName: string,
  params: ImageGenerateParams,
): Promise<GeneratedImage> {
  // 调用方有时会传入 Replicate 的 model id（而非 provider 名）。
  // 若命中 REPLICATE_IMAGE_MODELS，则统一解析为 "replicate" provider。
  const resolvedName = isReplicateImageModel(providerName)
    ? REPLICATE_IMAGE_PROVIDER_NAME
    : providerName;

  console.log(`###providerName: ${providerName} -> ${resolvedName}`);
  const provider = getImageProvider(resolvedName);
  console.log(`###provider: ${provider.name}`);
  return provider.generate(params);
}
