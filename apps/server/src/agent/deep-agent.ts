import type { BaseCheckpointSaver, BaseStore } from "@langchain/langgraph-checkpoint";
import type { BaseLanguageModel } from "@langchain/core/language_models/base";
import { ChatDeepSeek } from "@langchain/deepseek";
import { createDeepAgent } from "deepagents";

import {
  DEFAULT_AGENT_MODEL,
  DEFAULT_DEEPSEEK_AGENT_MODEL,
  type ServerEnv,
} from "../config/env.js";
import type { ConnectionManager } from "../ws/connection-manager.js";
import { createAgentBackend, type AgentBackendResult } from "./backends/index.js";
import { VISDRAFT_SYSTEM_PROMPT } from "./prompts/visdraft-main.js";
import { createVideoSubAgent } from "./sub-agents.js";
import { KieChatModel } from "./kie-chat-model.js";
import { createMainAgentTools } from "./tools/index.js";
import type { PersistImageFn, SubmitImageJobFn } from "./tools/image-generate.js";
import type { SubmitVideoJobFn } from "./tools/video-generate.js";
import type { WorkspaceSkillEntry } from "./workspace-skills.js";

export type VisdraftAgent = Pick<
  ReturnType<typeof createDeepAgent>,
  "stream" | "streamEvents"
>;

export type VisdraftAgentFactory = (options: {
  backendResult?: AgentBackendResult;
  brandKitId?: string | null;
  canvasId?: string;
  checkpointer?: BaseCheckpointSaver;
  connectionManager?: ConnectionManager;
  createUserClient?: (accessToken: string) => any;
  env: ServerEnv;
  model?: BaseLanguageModel | string;
  persistImage?: PersistImageFn;

  submitImageJob?: SubmitImageJobFn;
  submitVideoJob?: SubmitVideoJobFn;
  store?: BaseStore;
  workspaceSkills?: WorkspaceSkillEntry[];
}) => VisdraftAgent;

export function createVisdraftDeepAgent(options: {
  backendResult?: AgentBackendResult;
  brandKitId?: string | null;
  canvasId?: string;
  checkpointer?: BaseCheckpointSaver;
  connectionManager?: ConnectionManager;
  createUserClient?: (accessToken: string) => any;
  env: ServerEnv;
  model?: BaseLanguageModel | string;
  persistImage?: PersistImageFn;

  submitImageJob?: SubmitImageJobFn;
  submitVideoJob?: SubmitVideoJobFn;
  store?: BaseStore;
  workspaceSkills?: WorkspaceSkillEntry[];
}): VisdraftAgent {
  const backendResult =
    options.backendResult ?? createAgentBackend(options.env, options.canvasId);

  applyOpenAICompatEnv(options.env);

  const modelSpec = options.model ?? createDefaultModelSpecifier(options.env);
  const resolvedModel =
    typeof modelSpec === "string"
      ? createStreamingChatModel(modelSpec)
      : modelSpec;

  const createUserClient =
    options.createUserClient ??
    ((_accessToken: string): never => {
      throw new Error(
        "inspect_canvas is unavailable: no createUserClient was provided to createVisdraftDeepAgent.",
      );
    });

  let systemPrompt = options.brandKitId
    ? VISDRAFT_SYSTEM_PROMPT +
      "\n\n当前项目已绑定品牌套件。在进行设计相关工作时，请先使用 get_brand_kit 工具查询品牌信息，确保设计符合品牌规范。"
    : VISDRAFT_SYSTEM_PROMPT;

  // Inject enabled skills (both system and user-created) into the system prompt.
  // All skills are loaded from the database via loadWorkspaceSkills() in runtime.ts.
  const wsSkills = options.workspaceSkills ?? [];
  if (wsSkills.length > 0) {
    const skillsList = wsSkills
      .map((s) => {
        let line = `- **${s.name}**: ${s.description}\n  → Read \`${s.path}\` for full instructions`;
        if (s.files.length > 0) {
          const counts: Record<string, number> = {};
          for (const f of s.files) {
            const dir = f.path.split("/")[0] ?? "other";
            counts[dir] = (counts[dir] ?? 0) + 1;
          }
          const summary = Object.entries(counts)
            .map(([dir, n]) => `${dir}/ (${n})`)
            .join(", ");
          line += `\n  → Has: ${summary}`;
        }
        return line;
      })
      .join("\n");
    systemPrompt += `\n\n## Skills\n\nThe following skills are enabled in this workspace:\n${skillsList}`;
  }

  return createDeepAgent({
    backend: backendResult.factory,
    ...(options.checkpointer ? { checkpointer: options.checkpointer } : {}),
    model: resolvedModel,
    name: "visdraft",
    ...(options.store ? { store: options.store } : {}),
    subagents: [createVideoSubAgent()],
    systemPrompt,
    tools: createMainAgentTools(backendResult.factory, {
      createUserClient,
      ...(options.brandKitId != null ? { brandKitId: options.brandKitId } : {}),
      ...(options.connectionManager ? { connectionManager: options.connectionManager } : {}),
      ...(options.persistImage ? { persistImage: options.persistImage } : {}),
      ...(backendResult.sandboxDir ? { sandboxDir: backendResult.sandboxDir } : {}),

      ...(options.submitImageJob ? { submitImageJob: options.submitImageJob } : {}),
      ...(options.submitVideoJob ? { submitVideoJob: options.submitVideoJob } : {}),
    }),
  });
}

/**
 * Create a streaming chat model from a `<provider>:<model-id>` specifier.
 *
 * Supported providers:
 * - `kie` (default) — uses Kie's OpenAI-compatible API
 * - `deepseek` — uses ChatDeepSeek for DeepSeek models
 */
function createStreamingChatModel(specifier: string): BaseLanguageModel {
  const colonIdx = specifier.indexOf(":");
  let provider = colonIdx > 0 ? specifier.slice(0, colonIdx) : "kie";
  let modelName = colonIdx > 0 ? specifier.slice(colonIdx + 1) : specifier;

  const hasKieApiKey = !!process.env.KIE_API_KEY;
  const hasDeepseekApiKey = !!process.env.DEEPSEEK_API_KEY;

  const fallbackProvider = (
    candidates: Array<"kie" | "deepseek">,
  ): "kie" | "deepseek" | null => {
    for (const candidate of candidates) {
      if (candidate === "kie" && hasKieApiKey) return "kie";
      if (candidate === "deepseek" && hasDeepseekApiKey) return "deepseek";
    }
    return null;
  };

  const applyFallback = (nextProvider: "kie" | "deepseek" | null) => {
    if (!nextProvider) {
      throw new Error(
        `No AI provider credentials configured for requested model: ${specifier}. ` +
        "Set one of KIE_API_KEY or DEEPSEEK_API_KEY.",
      );
    }
    provider = nextProvider;
    modelName =
      nextProvider === "deepseek"
        ? DEFAULT_DEEPSEEK_AGENT_MODEL
        : DEFAULT_AGENT_MODEL;
  };

  // Provider availability fallback
  if (provider === "kie" && !hasKieApiKey) {
    console.warn(
      `[model] Kie unavailable (no KIE_API_KEY), falling back for: ${specifier}`,
    );
    applyFallback(fallbackProvider(["deepseek"]));
  }
  if (provider === "deepseek" && !hasDeepseekApiKey) {
    console.warn(
      `[model] Deepseek unavailable (no DEEPSEEK_API_KEY), falling back for: ${specifier}`,
    );
    applyFallback(fallbackProvider(["kie"]));
  }

  // Legacy provider names compatibility — map OpenRouter-era providers to Kie.
  if (provider === "openrouter" || provider === "openai" || provider === "google" || provider === "replicate") {
    console.log(`[model] Legacy provider '${provider}' detected, using Kie API for: ${modelName}`);
    provider = "kie";
  }

  switch (provider) {
    case "kie":
      modelName = normalizeKieModelName(modelName);
      console.log(`[model] Using Kie API for: ${modelName}`);
      return createKieChatModel(modelName, process.env.KIE_API_KEY!, process.env.KIE_BASE_URL);
    case "deepseek":
      return new ChatDeepSeek({
        apiKey: process.env.DEEPSEEK_API_KEY!,
        model: modelName,
        streaming: true,
      });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/** Known model-name prefixes for auto-detection. */
const DEEPSEEK_MODEL_PREFIXES = ["deepseek-"];
const KIE_MODEL_PREFIXES = ["openai/", "google/", "anthropic/", "meta/"];

export function createDefaultModelSpecifier(
  env: Pick<ServerEnv, "agentModel">,
) {
  const model = env.agentModel;
  // Already has an explicit provider prefix — pass through as-is.
  if (model.includes(":")) return model;
  // Auto-detect DeepSeek models by name prefix.
  if (DEEPSEEK_MODEL_PREFIXES.some((p) => model.startsWith(p)))
    return `deepseek:${model}`;
  // Auto-detect legacy owner/name model IDs and send them through Kie.
  if (KIE_MODEL_PREFIXES.some((p) => model.startsWith(p)))
    return `kie:${model}`;
  return `kie:${model}`;
}

export function resolveKieOpenAIBaseUrl(modelName: string, baseUrl?: string): string {
  const root = (baseUrl ?? "https://api.kie.ai").replace(/\/+$/, "");
  const modelPath = normalizeKieModelName(modelName);
  if (isKieCodexResponsesModel(modelPath)) {
    return `${root}/codex/v1`;
  }
  return `${root}/${encodeURIComponent(modelPath)}/v1`;
}

export function normalizeKieModelName(modelName: string): string {
  const providerlessModel = modelName.includes(":")
    ? modelName.slice(modelName.indexOf(":") + 1)
    : modelName;
  const rawModel = providerlessModel.split("/").pop() ?? providerlessModel;
  const model = rawModel
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^chatgpt-/, "gpt-");
  if (model === "gpt-5.6-terra") return DEFAULT_AGENT_MODEL;
  if (model === "gemini-3-flash-preview") return DEFAULT_AGENT_MODEL;
  return model;
}

export function createKieChatModel(
  modelName: string,
  apiKey: string,
  baseUrl?: string,
): KieChatModel {
  const normalizedModel = normalizeKieModelName(modelName);
  return new KieChatModel({
    model: normalizedModel,
    apiKey,
    baseUrl: resolveKieOpenAIBaseUrl(normalizedModel, baseUrl),
  });
}

function isKieCodexResponsesModel(modelName: string): boolean {
  return modelName === "gpt-5-6-terra";
}

/**
 * @deprecated This function is kept for backward compatibility but is no longer used.
 * Agent models are now accessed via Kie (KIE_API_KEY).
 */
export function applyOpenAICompatEnv(
  env: Pick<ServerEnv, "openAIApiBase" | "openAIApiKey">,
  target: NodeJS.ProcessEnv = process.env,
) {
  // No-op: OpenAI SDK is no longer used directly
  // This function is kept for backward compatibility
}
