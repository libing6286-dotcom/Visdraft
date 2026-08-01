import { afterEach, describe, expect, test, vi } from "vitest";

import { KieImageProvider } from "./kie-image.js";

describe("KieImageProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("creates a Kie market image task with the user prompt and polls the result", async () => {
    const requests: Array<{ body?: unknown; url: string }> = [];

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      requests.push({
        url,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });

      if (url.endsWith("/api/v1/jobs/createTask")) {
        return new Response(JSON.stringify({ code: 200, data: { taskId: "task-1" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          code: 200,
          data: {
            state: "success",
            resultJson: JSON.stringify({
              resultUrls: ["https://example.com/image.png"],
            }),
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const provider = new KieImageProvider("kie-key", {
      pollIntervalMs: 1,
      timeoutMs: 100,
    });

    const image = await provider.generate({
      prompt: "draw a quiet desk",
      model: "gpt-image-2",
      aspectRatio: "16:9",
    });

    expect(requests[0]).toMatchObject({
      url: "https://api.kie.ai/api/v1/jobs/createTask",
      body: {
        model: "gpt-image-2",
        input: {
          prompt: "draw a quiet desk",
          size: "1820x1024",
        },
      },
    });
    expect(requests[1]?.url).toBe(
      "https://api.kie.ai/api/v1/jobs/recordInfo?taskId=task-1",
    );
    expect(image).toMatchObject({
      url: "https://example.com/image.png",
      mimeType: "image/png",
      width: 1820,
      height: 1024,
    });
  });

  test("retries transient Kie maintenance responses when creating image tasks", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: 503,
            msg: "The server is currently being maintained, please try again later~",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 200, data: { taskId: "task-1" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: 200,
            data: {
              state: "success",
              resultJson: JSON.stringify({
                resultUrls: ["https://example.com/image.png"],
              }),
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const provider = new KieImageProvider("kie-key", {
      pollIntervalMs: 1,
      timeoutMs: 100,
    });

    const image = await provider.generate({
      prompt: "draw a quiet desk",
      model: "gpt-image-2",
    });

    expect(image.url).toBe("https://example.com/image.png");
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });
});
