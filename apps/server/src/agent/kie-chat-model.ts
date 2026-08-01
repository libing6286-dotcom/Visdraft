import {
  AIMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { setTimeout as delay } from "node:timers/promises";
import {
  BaseChatModel,
  type BaseChatModelCallOptions,
  type BindToolsInput,
} from "@langchain/core/language_models/chat_models";
import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import type { ChatResult } from "@langchain/core/outputs";
import { toJsonSchema } from "@langchain/core/utils/json_schema";

type KieTool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: unknown;
  };
};

type KieChatModelCallOptions = BaseChatModelCallOptions & {
  tools?: KieTool[];
};

type KieChatModelFields = {
  apiKey: string;
  baseUrl: string;
  model: string;
  retryDelayMs?: number;
};

type KieChatCompletion = {
  code?: number;
  msg?: string;
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: string | null;
      role?: string;
      tool_calls?: Array<{
        function?: {
          arguments?: string;
          name?: string;
        };
        id?: string;
        type?: string;
      }>;
    };
  }>;
  usage?: unknown;
};

type KieResponsesCompletion = {
  code?: number;
  msg?: string;
  id?: string;
  output?: Array<{
    arguments?: string;
    call_id?: string;
    content?: Array<{
      text?: string;
      type?: string;
    }>;
    id?: string;
    name?: string;
    role?: string;
    type?: string;
  }>;
  output_text?: string;
  status?: string;
  usage?: unknown;
};

type KieCompletion = KieChatCompletion | KieResponsesCompletion;

export class KieChatModel extends BaseChatModel<KieChatModelCallOptions> {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly retryDelayMs: number;

  constructor(fields: KieChatModelFields) {
    super({});
    this.apiKey = fields.apiKey;
    this.baseUrl = fields.baseUrl.replace(/\/+$/, "");
    this.model = fields.model;
    this.retryDelayMs = fields.retryDelayMs ?? 500;
    this.disableStreaming = true;
  }

  _llmType(): string {
    return "kie";
  }

  bindTools(tools: BindToolsInput[], kwargs?: Partial<KieChatModelCallOptions>) {
    return this.withConfig({
      ...kwargs,
      tools: tools.map(toKieTool),
    });
  }

  async _generate(
    messages: BaseMessage[],
    options: this["ParsedCallOptions"],
    _runManager?: CallbackManagerForLLMRun,
  ): Promise<ChatResult> {
    const payload = await this.requestCompletion(messages, options);

    if (isKieResponsesCompletion(payload)) {
      return this.toChatResultFromResponses(payload);
    }

    const choice = payload.choices?.[0];
    const message = choice?.message;
    if (!message) {
      throw new Error(
        `Kie returned no chat message: ${JSON.stringify(payload).slice(0, 500)}`,
      );
    }

    const toolCalls = message.tool_calls
      ?.map((call) => {
        const name = call.function?.name;
        const id = call.id;
        if (!name || !id) return null;
        return {
          args: parseToolArguments(call.function?.arguments),
          id,
          name,
          type: "tool_call" as const,
        };
      })
      .filter((call): call is NonNullable<typeof call> => call != null);
    const rawToolCalls = message.tool_calls
      ?.filter(
        (call): call is {
          function: { arguments: string; name: string };
          id: string;
          type?: string;
        } => !!call.id && !!call.function?.name && call.function.arguments != null,
      )
      .map((call) => ({
        function: call.function,
        id: call.id,
        type: "function" as const,
      }));
    const aiMessage = new AIMessage({
      additional_kwargs: {
        ...(rawToolCalls ? { tool_calls: rawToolCalls } : {}),
      },
      content: message.content ?? "",
      response_metadata: {
        finish_reason: choice.finish_reason,
        usage: payload.usage,
      },
      ...(toolCalls?.length ? { tool_calls: toolCalls } : {}),
    });

    return {
      generations: [
        {
          message: aiMessage,
          text: typeof aiMessage.content === "string" ? aiMessage.content : "",
        },
      ],
      llmOutput: {
        tokenUsage: payload.usage,
      },
    };
  }

  private async requestCompletion(
    messages: BaseMessage[],
    options: this["ParsedCallOptions"],
  ): Promise<KieCompletion> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(this.completionUrl(), {
          body: JSON.stringify({
            model: this.model,
            ...(this.usesResponsesApi()
              ? {
                  input: messages.flatMap(toKieResponsesInput),
                  ...(options.tools?.length
                    ? { tools: options.tools.map(toKieResponsesTool) }
                    : {}),
                  stream: false,
                }
              : {
                  messages: messages.map(toKieMessage),
                  ...(options.tools?.length ? { tools: options.tools } : {}),
                  ...(options.tool_choice ? { tool_choice: options.tool_choice } : {}),
                }),
            ...(options.stop ? { stop: options.stop } : {}),
            ...(this.usesResponsesApi() ? {} : { stream: false }),
          }),
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          ...(options.signal ? { signal: options.signal } : {}),
        });

        const text = await response.text();
        const payload = text ? JSON.parse(text) as KieCompletion : {};
        if (!response.ok || (payload.code != null && payload.code !== 200)) {
          const message =
            payload.msg ?? `Kie chat completion failed with status ${response.status}`;
          const error = new Error(message);
          if (attempt < 2 && isTransientKieError(message, response.status)) {
            lastError = error;
            await delay(this.retryDelayMs * (attempt + 1), undefined, {
              signal: options.signal,
            });
            continue;
          }
          throw error;
        }
        return payload;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        if (attempt < 2 && isTransientKieError(err.message)) {
          lastError = err;
          await delay(this.retryDelayMs * (attempt + 1), undefined, {
            signal: options.signal,
          });
          continue;
        }
        throw err;
      }
    }
    throw lastError ?? new Error("Kie chat completion failed");
  }

  private completionUrl(): string {
    if (this.usesResponsesApi()) {
      return `${this.baseUrl}/responses`;
    }
    return `${this.baseUrl}/chat/completions`;
  }

  private usesResponsesApi(): boolean {
    return this.model === "gpt-5-6-terra";
  }

  private toChatResultFromResponses(payload: KieResponsesCompletion): ChatResult {
    const toolCalls = payload.output
      ?.filter((item) => item.type === "function_call" && item.name && item.call_id)
      .map((item) => ({
        args: parseToolArguments(item.arguments),
        id: item.call_id!,
        name: item.name!,
        type: "tool_call" as const,
      }));
    const rawToolCalls = payload.output
      ?.filter((item) => item.type === "function_call" && item.name && item.call_id)
      .map((item) => ({
        function: {
          arguments: item.arguments ?? "{}",
          name: item.name!,
        },
        id: item.call_id!,
        type: "function" as const,
      }));
    const content = payload.output_text ?? extractResponsesText(payload);
    const aiMessage = new AIMessage({
      additional_kwargs: {
        ...(rawToolCalls?.length ? { tool_calls: rawToolCalls } : {}),
      },
      content,
      response_metadata: {
        finish_reason: payload.status,
        id: payload.id,
        usage: payload.usage,
      },
      ...(toolCalls?.length ? { tool_calls: toolCalls } : {}),
    });

    return {
      generations: [
        {
          message: aiMessage,
          text: content,
        },
      ],
      llmOutput: {
        tokenUsage: payload.usage,
      },
    };
  }
}

function isTransientKieError(message: string, status?: number): boolean {
  return (
    (status != null && (status === 429 || status >= 500)) ||
    /maintain|maintenance|try again later|temporar|timeout|rate limit/i.test(message)
  );
}

function toKieTool(tool: BindToolsInput): KieTool {
  const rawTool = tool as any;
  if (rawTool.type === "function" && rawTool.function) {
    return rawTool as KieTool;
  }

  return {
    type: "function",
    function: {
      name: rawTool.name,
      ...(rawTool.description ? { description: rawTool.description } : {}),
      parameters: rawTool.schema ? toJsonSchema(rawTool.schema) : undefined,
    },
  };
}

function toKieResponsesTool(tool: KieTool): Record<string, unknown> {
  return {
    type: "function",
    name: tool.function.name,
    ...(tool.function.description
      ? { description: tool.function.description }
      : {}),
    ...(tool.function.parameters ? { parameters: tool.function.parameters } : {}),
  };
}

function toKieMessage(message: BaseMessage): Record<string, unknown> {
  const type = message.getType();
  if (type === "system") {
    return { content: message.content, role: "system" };
  }
  if (type === "human") {
    return { content: message.content, role: "user" };
  }
  if (type === "tool") {
    const toolMessage = message as any;
    return {
      content: stringifyMessageContent(message.content),
      role: "tool",
      tool_call_id: toolMessage.tool_call_id,
    };
  }
  if (type === "ai") {
    const aiMessage = message as AIMessage;
    const toolCalls = aiMessage.tool_calls?.map((call) => ({
      function: {
        arguments: JSON.stringify(call.args ?? {}),
        name: call.name,
      },
      id: call.id,
      type: "function",
    }));
    return {
      content: stringifyMessageContent(message.content),
      role: "assistant",
      ...(toolCalls?.length ? { tool_calls: toolCalls } : {}),
    };
  }
  return {
    content: stringifyMessageContent(message.content),
    role: type,
  };
}

function toKieResponsesInput(message: BaseMessage): Array<Record<string, unknown>> {
  const type = message.getType();
  if (type === "tool") {
    const toolMessage = message as any;
    return [
      {
        type: "function_call_output",
        call_id: toolMessage.tool_call_id,
        output: stringifyMessageContent(message.content),
      },
    ];
  }
  if (type === "ai") {
    const aiMessage = message as AIMessage;
    const items: Array<Record<string, unknown>> = [];
    const content = stringifyMessageContent(message.content);
    if (content) {
      items.push({ content, role: "assistant" });
    }
    for (const call of aiMessage.tool_calls ?? []) {
      items.push({
        type: "function_call",
        call_id: call.id,
        name: call.name,
        arguments: JSON.stringify(call.args ?? {}),
      });
    }
    return items;
  }
  if (type === "system") {
    return [{ content: stringifyMessageContent(message.content), role: "system" }];
  }
  if (type === "human") {
    return [{ content: stringifyMessageContent(message.content), role: "user" }];
  }
  return [{ content: stringifyMessageContent(message.content), role: type }];
}

function stringifyMessageContent(content: BaseMessage["content"]): string {
  if (typeof content === "string") return content;
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part.type === "text" && "text" in part) return String(part.text);
      return JSON.stringify(part);
    })
    .join("\n");
}

function isKieResponsesCompletion(payload: KieCompletion): payload is KieResponsesCompletion {
  return "output_text" in payload || "output" in payload || "status" in payload;
}

function extractResponsesText(payload: KieResponsesCompletion): string {
  return (payload.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text" && part.text)
    .map((part) => part.text)
    .join("");
}

function parseToolArguments(rawArguments: string | undefined): Record<string, unknown> {
  if (!rawArguments) return {};
  try {
    const parsed = JSON.parse(rawArguments) as unknown;
    return parsed && typeof parsed === "object"
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}
