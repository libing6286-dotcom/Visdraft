import { describe, expect, test } from "vitest";

import { createVideoGenerateTool } from "./video-generate.js";

const videoModels = [
  {
    id: "kwaivgi/kling-v3-video",
    displayName: "Kling V3",
    description: "Test video model",
    provider: "replicate",
  },
];

describe("createVideoGenerateTool", () => {
  test("coerces numeric duration strings to numbers", () => {
    const tool = createVideoGenerateTool({ availableModels: videoModels });
    const parsed = (
      tool.schema as {
        parse(input: unknown): { duration: number };
      }
    ).parse({
      title: "Campus dance",
      prompt: "Generate a video",
      model: "kwaivgi/kling-v3-video",
      duration: "10",
    });

    expect(parsed.duration).toBe(10);
  });
});
