import { afterEach, describe, expect, test, vi } from "vitest";

import { ReplicateImageProvider } from "./replicate-image.js";

describe("ReplicateImageProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each(["16:9", "9:16", "4:3", "3:4"])("preserves GPT Image 2 supported aspect ratio %s", async (aspectRatio) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          output: "https://example.com/generated.png",
          status: "succeeded",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const provider = new ReplicateImageProvider("replicate-key");

    await provider.generate({
      prompt: "combine these references",
      model: "openai/gpt-image-2",
      aspectRatio,
      quality: "hd",
      inputImages: ["https://example.com/reference-a.png"],
    });

    expect(JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body))).toEqual({
      input: {
        prompt: "combine these references",
        aspect_ratio: aspectRatio,
        input_images: ["https://example.com/reference-a.png"],
        quality: "high",
      },
    });
  });

  test("lists GPT Image 2 without legacy GPT Image models", () => {
    const provider = new ReplicateImageProvider("replicate-key");

    expect(provider.models.map((model) => model.id)).toContain("openai/gpt-image-2");
    expect(provider.models.map((model) => model.id)).not.toContain("openai/gpt-image-1.5");
    expect(provider.models.map((model) => model.id)).not.toContain("openai/gpt-image-1");
  });

  test("lists supported Nano Banana models without the legacy model", () => {
    const provider = new ReplicateImageProvider("replicate-key");
    const modelIds = provider.models.map((model) => model.id);

    expect(modelIds).toContain("google/nano-banana-pro");
    expect(modelIds).toContain("google/nano-banana-2");
    expect(modelIds).not.toContain("google/nano-banana");
  });

  test("does not list Imagen 4", () => {
    const provider = new ReplicateImageProvider("replicate-key");

    expect(provider.models.map((model) => model.id)).not.toContain("google/imagen-4");
  });

  test("does not list removed Flux, Seedream, and Recraft models", () => {
    const provider = new ReplicateImageProvider("replicate-key");
    const modelIds = provider.models.map((model) => model.id);

    for (const modelId of [
      "black-forest-labs/flux-kontext-max",
      "black-forest-labs/flux-kontext-pro",
      "bytedance/seedream-4.5",
      "bytedance/seedream-4",
      "recraft-ai/recraft-v3",
    ]) {
      expect(modelIds).not.toContain(modelId);
    }
  });

  test.each([
    ["standard", "1K"],
    ["hd", "2K"],
    ["ultra", "2K"],
  ])("maps Seedream 5 Pro %s quality to %s", async (quality, size) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ output: "https://example.com/generated.png", status: "succeeded" }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const provider = new ReplicateImageProvider("replicate-key");

    await provider.generate({
      prompt: "test image",
      model: "bytedance/seedream-5-pro",
      aspectRatio: "21:9",
      quality: quality as "standard" | "hd" | "ultra",
    });

    expect(JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body))).toEqual({
      input: {
        prompt: "test image",
        aspect_ratio: "21:9",
        size,
      },
    });
  });

  test("lists Seedream 5 Pro", () => {
    const provider = new ReplicateImageProvider("replicate-key");

    expect(provider.models.map((model) => model.id)).toContain("bytedance/seedream-5-pro");
  });

  test("lists Grok Imagine Image 2", () => {
    const provider = new ReplicateImageProvider("replicate-key");

    expect(provider.models.map((model) => model.id)).toContain("xai/grok-imagine-image-2");
  });

  test("polls a pending Replicate prediction until an image output is available", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "prediction-id",
            output: null,
            status: "processing",
            urls: { get: "https://api.replicate.com/v1/predictions/prediction-id" },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output: ["https://example.com/generated.png"],
            status: "succeeded",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );
    const provider = new ReplicateImageProvider("replicate-key");

    const result = await provider.generate({
      prompt: "test image",
      model: "xai/grok-imagine-image-2",
    });

    expect(result.url).toBe("https://example.com/generated.png");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
