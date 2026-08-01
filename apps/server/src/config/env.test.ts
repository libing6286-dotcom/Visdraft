import { describe, expect, test } from "vitest";

import {
  createKieChatModel,
  createDefaultModelSpecifier,
  normalizeKieModelName,
  resolveKieOpenAIBaseUrl,
} from "../agent/deep-agent.js";
import { loadServerEnv, resolveDefaultAgentModel } from "./env.js";

describe("Kie provider env", () => {
  test("uses Kie as the default agent provider when KIE_API_KEY is configured", () => {
    expect(resolveDefaultAgentModel({ kieApiKey: "kie-key" })).toBe(
      "gpt-5-6-terra",
    );
    expect(createDefaultModelSpecifier({ agentModel: "gpt-5-6-terra" })).toBe(
      "kie:gpt-5-6-terra",
    );
  });

  test("builds Kie OpenAI-compatible base URLs with the model path prefix", () => {
    expect(resolveKieOpenAIBaseUrl("gemini-2.5-pro")).toBe(
      "https://api.kie.ai/gemini-2.5-pro/v1",
    );
    expect(resolveKieOpenAIBaseUrl("google/gemini-3-flash-preview")).toBe(
      "https://api.kie.ai/codex/v1",
    );
    expect(resolveKieOpenAIBaseUrl("gpt-5-6-terra", "https://proxy.example/root")).toBe(
      "https://proxy.example/root/codex/v1",
    );
  });

  test("normalizes legacy Google model aliases to Kie-supported chat models", () => {
    expect(normalizeKieModelName("gemini-3-flash-preview")).toBe(
      "gpt-5-6-terra",
    );
    expect(normalizeKieModelName("google/gemini-3-flash-preview")).toBe(
      "gpt-5-6-terra",
    );
    expect(normalizeKieModelName("google:gemini-3-flash-preview")).toBe(
      "gpt-5-6-terra",
    );
    expect(normalizeKieModelName("chatGpt 5.6 Terra")).toBe("gpt-5-6-terra");
    expect(normalizeKieModelName("gpt-5.6-terra")).toBe("gpt-5-6-terra");
    expect(normalizeKieModelName("gpt-5-6-terra")).toBe("gpt-5-6-terra");
  });

  test("disables BaseChatModel streaming for Kie agent models", () => {
    const model = createKieChatModel("gpt-5-6-terra", "kie-key");

    expect((model as any).disableStreaming).toBe(true);
  });

  test("loads KIE_API_KEY from process env", () => {
    const env = loadServerEnv(
      { version: "test" },
      {
        KIE_API_KEY: " kie-key ",
      } as NodeJS.ProcessEnv,
    );

    expect(env.kieApiKey).toBe("kie-key");
  });
});
