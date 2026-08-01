import { describe, expect, test } from "vitest";

import { supportsVisionMessageContent } from "./runtime.js";

describe("supportsVisionMessageContent", () => {
  test("does not send image_url content to DeepSeek models", () => {
    expect(supportsVisionMessageContent("deepseek:deepseek-v4-flash")).toBe(false);
  });

  test("allows image_url content for Google and OpenAI agent models", () => {
    expect(supportsVisionMessageContent("google:gemini-3-flash-preview")).toBe(true);
    expect(supportsVisionMessageContent("openai:gpt-4o")).toBe(true);
  });
});
