import { readFileSync } from "node:fs";

export const DEFAULT_AGENT_BACKEND_MODE = "state";
export const DEFAULT_AGENT_MODEL = "gpt-5-6-terra";
export const DEFAULT_GOOGLE_AGENT_MODEL = "google/gemini-2.5-flash";
export const DEFAULT_DEEPSEEK_AGENT_MODEL = "deepseek-v4-flash";
export const DEFAULT_SERVER_PORT = 3001;
export const DEFAULT_WEB_ORIGIN = "http://localhost:3000";
export const DEFAULT_PRODUCTION_WEB_ORIGIN = "https://visdraft.com";

/**
 * Resolve the default agent model based on available provider configuration.
 * When only DeepSeek is configured, defaults to DeepSeek v4 Flash.
 * Otherwise defaults to Kie.
 */
export function resolveDefaultAgentModel(
  env: {
    deepseekApiKey?: string | undefined;
    kieApiKey?: string | undefined;
  },
): string {
  const hasKie = !!env.kieApiKey;
  const hasDeepseek = !!env.deepseekApiKey;

  if (!hasKie && hasDeepseek) return DEFAULT_DEEPSEEK_AGENT_MODEL;
  return DEFAULT_AGENT_MODEL;
}

export type AgentBackendMode = "filesystem" | "state";

export type ServerEnv = {
  agentBackendMode: AgentBackendMode;
  agentFilesRoot?: string;
  agentModel: string;
  deepseekApiKey?: string;
  googleApiKey?: string;
  googleApplicationCredentials?: string;
  googleFontsApiKey?: string;
  googleVertexLocation?: string;
  googleVertexProject?: string;
  googleVertexVideoLocation?: string;
  kieApiKey?: string;
  kieBaseUrl?: string;
  openAIApiBase?: string;
  openAIApiKey?: string;
  port: number;
  replicateApiToken?: string;
  supabaseAnonKey?: string;
  supabaseDbUrl?: string;
  supabaseJwtSecret?: string;
  supabaseProjectId?: string;
  supabaseServiceRoleKey?: string;
  supabaseUrl?: string;
  version: string;
  volcesApiKey?: string;
  volcesBaseUrl?: string;
  paypalClientId?: string;
  paypalClientSecret?: string;
  paypalEnvironment?: "sandbox" | "live";
  paypalCurrency?: string;
  paypalWebhookId?: string;
  paymentDefaultProvider?: "stripe" | "creem" | "paypal" | "waffo" | "alipay" | "wechat";
  paymentSelectEnabled?: boolean;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  creemApiKey?: string;
  creemWebhookSecret?: string;
  waffoMerchantId?: string;
  waffoPrivateKey?: string;
  waffoStoreId?: string;
  waffoWebhookPublicKey?: string;
  waffoEnvironment?: "test" | "prod";
  waffoProducts?: Partial<Record<"starter_monthly" | "starter_yearly" | "starter_lifetime" | "pro_monthly" | "pro_yearly" | "pro_lifetime" | "ultra_monthly" | "ultra_yearly" | "ultra_lifetime" | "business_monthly" | "business_yearly" | "business_lifetime", string>>;
  alipayAppId?: string;
  alipayPrivateKey?: string;
  alipayPublicKey?: string;
  wechatAppId?: string;
  wechatMchId?: string;
  wechatApiV3Key?: string;
  wechatPrivateKey?: string;
  wechatSerialNo?: string;
  skillsRoot?: string;
  webOrigin: string;
  workerConcurrency?: number;
  workerImageConcurrency?: number;
  workerVideoConcurrency?: number;
  workerId?: string;
  workerPollIntervalMs?: number;
  workerMaxBatchSize?: number;
};

export function loadServerEnv(
  overrides: Partial<ServerEnv> = {},
  source: NodeJS.ProcessEnv = process.env,
): ServerEnv {
  const agentFilesRoot =
    overrides.agentFilesRoot ??
    parseAgentFilesRoot(
      source.VISDRAFT_AGENT_FILES_ROOT ?? source.LOOMIC_AGENT_FILES_ROOT,
    );
  const openAIApiBase =
    overrides.openAIApiBase ?? normalizeOptionalString(source.OPENAI_API_BASE);
  const openAIApiKey =
    overrides.openAIApiKey ?? normalizeOptionalString(source.OPENAI_API_KEY);
  const supabaseUrl =
    overrides.supabaseUrl ?? normalizeOptionalString(source.SUPABASE_URL);
  const supabaseAnonKey =
    overrides.supabaseAnonKey ??
    normalizeOptionalString(source.SUPABASE_ANON_KEY);
  const supabaseDbUrl =
    overrides.supabaseDbUrl ?? normalizeOptionalString(source.SUPABASE_DB_URL);
  const supabaseJwtSecret =
    overrides.supabaseJwtSecret ?? normalizeOptionalString(source.SUPABASE_JWT_SECRET);
  const supabaseServiceRoleKey =
    overrides.supabaseServiceRoleKey ??
    normalizeOptionalString(source.SUPABASE_SERVICE_ROLE_KEY);
  const supabaseProjectId =
    overrides.supabaseProjectId ??
    normalizeOptionalString(source.SUPABASE_PROJECT_ID);
  const deepseekApiKey =
    overrides.deepseekApiKey ?? normalizeOptionalString(source.DEEPSEEK_API_KEY);
  const googleApiKey =
    overrides.googleApiKey ?? normalizeOptionalString(source.GOOGLE_API_KEY);
  const googleApplicationCredentials =
    overrides.googleApplicationCredentials ?? normalizeOptionalString(source.GOOGLE_APPLICATION_CREDENTIALS);
  const googleFontsApiKey =
    overrides.googleFontsApiKey ?? normalizeOptionalString(source.GOOGLE_FONTS_API_KEY);
  const googleVertexProject =
    overrides.googleVertexProject ?? normalizeOptionalString(source.GOOGLE_VERTEX_PROJECT);
  const googleVertexLocation =
    overrides.googleVertexLocation ?? normalizeOptionalString(source.GOOGLE_VERTEX_LOCATION);
  const googleVertexVideoLocation =
    overrides.googleVertexVideoLocation ?? normalizeOptionalString(source.GOOGLE_VERTEX_VIDEO_LOCATION);
  const kieApiKey =
    overrides.kieApiKey ?? normalizeOptionalString(source.KIE_API_KEY);
  const kieBaseUrl =
    overrides.kieBaseUrl ?? normalizeOptionalString(source.KIE_BASE_URL);
  const replicateApiToken =
    overrides.replicateApiToken ?? normalizeOptionalString(source.REPLICATE_API_TOKEN);
  const volcesApiKey =
    overrides.volcesApiKey ?? normalizeOptionalString(source.VOLCES_API_KEY);
  const volcesBaseUrl =
    overrides.volcesBaseUrl ?? normalizeOptionalString(source.VOLCES_BASE_URL);
  const paypalClientId = overrides.paypalClientId ?? normalizeOptionalString(source.PAYPAL_CLIENT_ID);
  const paypalClientSecret = overrides.paypalClientSecret ?? normalizeOptionalString(source.PAYPAL_CLIENT_SECRET);
  const paypalEnvironment = overrides.paypalEnvironment ?? (source.PAYPAL_ENVIRONMENT === "live" ? "live" : "sandbox");
  const paypalCurrency = overrides.paypalCurrency ?? normalizeOptionalString(source.PAYPAL_CURRENCY) ?? "USD";
  const paypalWebhookId = overrides.paypalWebhookId ?? normalizeOptionalString(source.PAYPAL_WEBHOOK_ID);
  const paymentDefaultProvider = overrides.paymentDefaultProvider ??
    (source.PAYMENT_DEFAULT_PROVIDER as ServerEnv["paymentDefaultProvider"] | undefined);
  const paymentSelectEnabled = overrides.paymentSelectEnabled ?? source.PAYMENT_SELECT_ENABLED === "true";
  const stripeSecretKey = overrides.stripeSecretKey ?? normalizeOptionalString(source.STRIPE_SECRET_KEY);
  const stripeWebhookSecret = overrides.stripeWebhookSecret ?? normalizeOptionalString(source.STRIPE_WEBHOOK_SECRET);
  const creemApiKey = overrides.creemApiKey ?? normalizeOptionalString(source.CREEM_API_KEY);
  const creemWebhookSecret = overrides.creemWebhookSecret ?? normalizeOptionalString(source.CREEM_WEBHOOK_SECRET);
  const waffoMerchantId = overrides.waffoMerchantId ?? normalizeOptionalString(source.WAFFO_MERCHANT_ID);
  const waffoPrivateKey = overrides.waffoPrivateKey ?? normalizeOptionalString(source.WAFFO_PRIVATE_KEY)?.replace(/\\n/g, "\n");
  const waffoStoreId = overrides.waffoStoreId ?? normalizeOptionalString(source.WAFFO_STORE_ID);
  const waffoWebhookPublicKey = overrides.waffoWebhookPublicKey ?? normalizeOptionalString(source.WAFFO_WEBHOOK_PUBLIC_KEY);
  const waffoEnvironment = overrides.waffoEnvironment ?? (source.WAFFO_ENVIRONMENT === "prod" ? "prod" : "test");
  const waffoProducts = overrides.waffoProducts ?? Object.fromEntries(
    (["starter", "pro", "ultra", "business"] as const).flatMap((plan) => (["monthly", "yearly", "lifetime"] as const).flatMap((period) => {
      const value = normalizeOptionalString(source[`WAFFO_PRODUCT_${plan.toUpperCase()}_${period.toUpperCase()}`]);
      return value ? [[`${plan}_${period}`, value]] : [];
    })),
  );
  const alipayAppId = overrides.alipayAppId ?? normalizeOptionalString(source.ALIPAY_APP_ID);
  const alipayPrivateKey = overrides.alipayPrivateKey ?? normalizeOptionalString(source.ALIPAY_PRIVATE_KEY);
  const alipayPublicKey = overrides.alipayPublicKey ?? normalizeOptionalString(source.ALIPAY_PUBLIC_KEY);
  const wechatAppId = overrides.wechatAppId ?? normalizeOptionalString(source.WECHAT_APP_ID);
  const wechatMchId = overrides.wechatMchId ?? normalizeOptionalString(source.WECHAT_MCH_ID);
  const wechatApiV3Key = overrides.wechatApiV3Key ?? normalizeOptionalString(source.WECHAT_API_V3_KEY);
  const wechatPrivateKey = overrides.wechatPrivateKey ?? normalizeOptionalString(source.WECHAT_PRIVATE_KEY);
  const wechatSerialNo = overrides.wechatSerialNo ?? normalizeOptionalString(source.WECHAT_SERIAL_NO);
  const skillsRoot =
    overrides.skillsRoot ??
    normalizeOptionalString(
      source.VISDRAFT_SKILLS_ROOT ?? source.LOOMIC_SKILLS_ROOT,
    );
  const workerConcurrency = overrides.workerConcurrency ??
    (source.WORKER_CONCURRENCY
      ? parseInt(source.WORKER_CONCURRENCY, 10) : undefined);
  const workerImageConcurrency = overrides.workerImageConcurrency ??
    (source.WORKER_IMAGE_CONCURRENCY
      ? parseInt(source.WORKER_IMAGE_CONCURRENCY, 10) : undefined);
  const workerVideoConcurrency = overrides.workerVideoConcurrency ??
    (source.WORKER_VIDEO_CONCURRENCY
      ? parseInt(source.WORKER_VIDEO_CONCURRENCY, 10) : undefined);
  const workerId = overrides.workerId ??
    normalizeOptionalString(source.WORKER_ID);
  const workerPollIntervalMs = overrides.workerPollIntervalMs ??
    (source.WORKER_POLL_INTERVAL_MS
      ? parseInt(source.WORKER_POLL_INTERVAL_MS, 10) : undefined);
  const workerMaxBatchSize = overrides.workerMaxBatchSize ??
    (source.WORKER_MAX_BATCH_SIZE
      ? parseInt(source.WORKER_MAX_BATCH_SIZE, 10) : undefined);

  // Resolve default agent model based on available provider keys.
  // Explicit VISDRAFT_AGENT_MODEL always takes precedence; otherwise fall back
  // to appropriate model based on configured API tokens.
  const explicitModel =
    overrides.agentModel ??
    parseAgentModel(source.VISDRAFT_AGENT_MODEL ?? source.LOOMIC_AGENT_MODEL);
  const resolvedAgentModel =
    explicitModel ??
    resolveDefaultAgentModel({
      deepseekApiKey,
      kieApiKey,
    });

  return {
    agentBackendMode:
      overrides.agentBackendMode ??
      parseAgentBackendMode(
        source.VISDRAFT_AGENT_BACKEND_MODE ?? source.LOOMIC_AGENT_BACKEND_MODE,
      ),
    agentModel: resolvedAgentModel,
    port:
      overrides.port ??
      parsePort(
        source.VISDRAFT_SERVER_PORT ?? source.LOOMIC_SERVER_PORT ?? source.PORT,
      ),
    version: overrides.version ?? readServerVersion(),
    webOrigin: normalizeWebOrigin(
      overrides.webOrigin ??
        source.VISDRAFT_WEB_ORIGIN ??
        source.LOOMIC_WEB_ORIGIN ??
        (source.NODE_ENV === "production"
          ? DEFAULT_PRODUCTION_WEB_ORIGIN
          : DEFAULT_WEB_ORIGIN),
    ),
    ...(agentFilesRoot ? { agentFilesRoot } : {}),
    ...(deepseekApiKey ? { deepseekApiKey } : {}),
    ...(googleApiKey ? { googleApiKey } : {}),
    ...(googleApplicationCredentials ? { googleApplicationCredentials } : {}),
    ...(kieApiKey ? { kieApiKey } : {}),
    ...(kieBaseUrl ? { kieBaseUrl } : {}),
    ...(openAIApiBase ? { openAIApiBase } : {}),
    ...(openAIApiKey ? { openAIApiKey } : {}),
    ...(supabaseUrl ? { supabaseUrl } : {}),
    ...(supabaseAnonKey ? { supabaseAnonKey } : {}),
    ...(supabaseDbUrl ? { supabaseDbUrl } : {}),
    ...(supabaseJwtSecret ? { supabaseJwtSecret } : {}),
    ...(supabaseServiceRoleKey ? { supabaseServiceRoleKey } : {}),
    ...(supabaseProjectId ? { supabaseProjectId } : {}),
    ...(googleFontsApiKey ? { googleFontsApiKey } : {}),
    ...(googleVertexProject ? { googleVertexProject } : {}),
    ...(googleVertexLocation ? { googleVertexLocation } : {}),
    ...(googleVertexVideoLocation ? { googleVertexVideoLocation } : {}),
    ...(replicateApiToken ? { replicateApiToken } : {}),
    ...(volcesApiKey ? { volcesApiKey } : {}),
    ...(volcesBaseUrl ? { volcesBaseUrl } : {}),
    ...(paypalClientId ? { paypalClientId } : {}),
    ...(paypalClientSecret ? { paypalClientSecret } : {}),
    paypalEnvironment,
    paypalCurrency,
    ...(paypalWebhookId ? { paypalWebhookId } : {}),
    ...(paymentDefaultProvider ? { paymentDefaultProvider } : {}),
    paymentSelectEnabled,
    ...(stripeSecretKey ? { stripeSecretKey } : {}),
    ...(stripeWebhookSecret ? { stripeWebhookSecret } : {}),
    ...(creemApiKey ? { creemApiKey } : {}),
    ...(creemWebhookSecret ? { creemWebhookSecret } : {}),
    ...(waffoMerchantId ? { waffoMerchantId } : {}),
    ...(waffoPrivateKey ? { waffoPrivateKey } : {}),
    ...(waffoStoreId ? { waffoStoreId } : {}),
    ...(waffoWebhookPublicKey ? { waffoWebhookPublicKey } : {}),
    waffoEnvironment,
    ...(Object.keys(waffoProducts).length ? { waffoProducts } : {}),
    ...(alipayAppId ? { alipayAppId } : {}),
    ...(alipayPrivateKey ? { alipayPrivateKey } : {}),
    ...(alipayPublicKey ? { alipayPublicKey } : {}),
    ...(wechatAppId ? { wechatAppId } : {}),
    ...(wechatMchId ? { wechatMchId } : {}),
    ...(wechatApiV3Key ? { wechatApiV3Key } : {}),
    ...(wechatPrivateKey ? { wechatPrivateKey } : {}),
    ...(wechatSerialNo ? { wechatSerialNo } : {}),
    ...(skillsRoot ? { skillsRoot } : {}),
    ...(workerConcurrency ? { workerConcurrency } : {}),
    ...(workerImageConcurrency ? { workerImageConcurrency } : {}),
    ...(workerVideoConcurrency ? { workerVideoConcurrency } : {}),
    ...(workerId ? { workerId } : {}),
    ...(workerPollIntervalMs ? { workerPollIntervalMs } : {}),
    ...(workerMaxBatchSize ? { workerMaxBatchSize } : {}),
  };
}

function normalizeWebOrigin(value: string) {
  const origin = value.trim();
  return origin.replace(/\/+$/, "");
}

function parseAgentBackendMode(rawMode: string | undefined): AgentBackendMode {
  if (!rawMode) {
    return DEFAULT_AGENT_BACKEND_MODE;
  }

  if (rawMode === "state" || rawMode === "filesystem") {
    return rawMode;
  }

  throw new Error(`Invalid VISDRAFT_AGENT_BACKEND_MODE value: ${rawMode}`);
}

function parseAgentFilesRoot(rawRoot: string | undefined) {
  return normalizeOptionalString(rawRoot);
}

function parseAgentModel(rawModel: string | undefined) {
  return normalizeOptionalString(rawModel);
}

function normalizeOptionalString(value: string | undefined) {
  const normalizedValue = value?.trim();
  return normalizedValue || undefined;
}

function parsePort(rawPort: string | undefined) {
  if (!rawPort) {
    return DEFAULT_SERVER_PORT;
  }

  const port = Number.parseInt(rawPort, 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid VISDRAFT_SERVER_PORT value: ${rawPort}`);
  }

  return port;
}

function readServerVersion() {
  const packageJson = readFileSync(
    new URL("../../package.json", import.meta.url),
    "utf8",
  );

  const parsed = JSON.parse(packageJson) as { version?: string };
  return parsed.version ?? "0.0.0";
}
