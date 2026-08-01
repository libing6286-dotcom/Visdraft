import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { afterEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { KieChatModel } from "./kie-chat-model.js";

describe("KieChatModel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("converts Kie chat completion text responses to AIMessage generations", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "stop",
              message: { content: "pong", role: "assistant" },
            },
          ],
          usage: { completion_tokens: 1, prompt_tokens: 2, total_tokens: 3 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const model = new KieChatModel({
      apiKey: "kie-key",
      baseUrl: "https://api.kie.ai/gemini-2.5-pro/v1",
      model: "gemini-2.5-pro",
    });

    const message = await model.invoke("ping");

    expect(message.content).toBe("pong");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.kie.ai/gemini-2.5-pro/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  test("uses Kie Codex responses API for GPT 5.6 Terra", async () => {
    let requestBody: any;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      requestBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          id: "resp_1",
          output_text: "pong",
          status: "completed",
          usage: { input_tokens: 2, output_tokens: 1, total_tokens: 3 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const model = new KieChatModel({
      apiKey: "kie-key",
      baseUrl: "https://api.kie.ai/codex/v1",
      model: "gpt-5-6-terra",
    });

    const message = await model.invoke("ping");

    expect(message.content).toBe("pong");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.kie.ai/codex/v1/responses",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(requestBody).toMatchObject({
      model: "gpt-5-6-terra",
      input: [{ content: "ping", role: "user" }],
      stream: false,
    });
  });

  test("converts Kie tool call responses to LangChain tool_calls", async () => {
    let requestBody: any;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      requestBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "tool_calls",
              message: {
                content: "",
                role: "assistant",
                tool_calls: [
                  {
                    function: {
                      arguments: "{\"text\":\"hello\"}",
                      name: "echo",
                    },
                    id: "call_1",
                    type: "function",
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const echo = tool(async ({ text }) => text, {
      name: "echo",
      description: "Echo text",
      schema: z.object({ text: z.string() }),
    });
    const model = new KieChatModel({
      apiKey: "kie-key",
      baseUrl: "https://api.kie.ai/gemini-2.5-pro/v1",
      model: "gemini-2.5-pro",
    });

    const message = await model.bindTools([echo]).invoke([
      new HumanMessage("Use echo"),
      new AIMessage({
        content: "",
        tool_calls: [{ args: { text: "hello" }, id: "call_old", name: "echo", type: "tool_call" }],
      }),
      new ToolMessage({ content: "hello", name: "echo", tool_call_id: "call_old" }),
    ]);

    expect(requestBody.tools?.[0]).toMatchObject({
      function: {
        name: "echo",
      },
      type: "function",
    });
    expect((message as AIMessage).tool_calls).toEqual([
      {
        args: { text: "hello" },
        id: "call_1",
        name: "echo",
        type: "tool_call",
      },
    ]);
  });

  test("retries transient Kie maintenance responses", async () => {
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
        new Response(
          JSON.stringify({
            choices: [
              {
                finish_reason: "stop",
                message: { content: "pong", role: "assistant" },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );
    const model = new KieChatModel({
      apiKey: "kie-key",
      baseUrl: "https://api.kie.ai/gemini-2.5-pro/v1",
      model: "gemini-2.5-pro",
      retryDelayMs: 1,
    });

    const message = await model.invoke("ping");

    expect(message.content).toBe("pong");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
