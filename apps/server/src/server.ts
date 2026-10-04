import { bootstrap } from "global-agent";

// Enable HTTP proxy for all outbound requests if http_proxy / https_proxy is set
bootstrap();

// Native fetch() proxy — needed for @google/generative-ai SDK
if (process.env.GLOBAL_AGENT_HTTP_PROXY) {
  const { ProxyAgent, setGlobalDispatcher } = await import("undici");
  setGlobalDispatcher(new ProxyAgent(process.env.GLOBAL_AGENT_HTTP_PROXY));
}

import { buildApp } from "./app.js";
import { loadServerEnv } from "./config/env.js";

const env = loadServerEnv();
console.log("[Config] Supabase env presence:", {
  url: Boolean(env.supabaseUrl),
  anonKey: Boolean(env.supabaseAnonKey),
  serviceRoleKey: Boolean(env.supabaseServiceRoleKey),
  jwtSecret: Boolean(env.supabaseJwtSecret),
});
const app = buildApp({
  env,
});

const host = process.env.HOST ?? "127.0.0.1";

try {
  await app.listen({
    host,
    port: env.port,
  });

  console.log(`@visdraft/server listening on http://${host}:${env.port}`);
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
