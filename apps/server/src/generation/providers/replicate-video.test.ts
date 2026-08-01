import { afterEach, describe, expect, test, vi } from "vitest";

import { ReplicateVideoProvider } from "./replicate-video.js";

describe("ReplicateVideoProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("uses the nearest allowed duration for the selected model", async () => {
    let requestBody: unknown;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      requestBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          id: "prediction-id",
          output: "https://example.com/video.mp4",
          status: "succeeded",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const provider = new ReplicateVideoProvider("test-token");

    await provider.generate({
      prompt: "test video",
      model: "kwaivgi/kling-v3-video",
      duration: 8,
    });

    expect(requestBody).toMatchObject({
      input: {
        duration: "10",
      },
    });
  });
});
