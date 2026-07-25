const defaultServerBaseUrl = "http://localhost:3001";

export function getServerBaseUrl(source?: NodeJS.ProcessEnv) {
  // Must access process.env.NEXT_PUBLIC_* directly — webpack DefinePlugin
  // only replaces direct references, not indirect access via a variable.
  const configuredUrl = (
    source
      ? source.NEXT_PUBLIC_SERVER_BASE_URL
      : process.env.NEXT_PUBLIC_SERVER_BASE_URL
  )?.trim();
  const serverBaseUrl = configuredUrl || defaultServerBaseUrl;

  if (isBrowserUsingRemoteOrigin() && isLocalhostUrl(serverBaseUrl)) {
    throw new Error(
      "Invalid browser env: NEXT_PUBLIC_SERVER_BASE_URL points to localhost. Set it to the deployed API origin, for example https://your-api.up.railway.app.",
    );
  }

  return serverBaseUrl;
}

export type WebEnv = {
  serverBaseUrl: string;
  supabaseAnonKey: string;
  supabaseUrl: string;
};

export function loadWebEnv(
  overrides: Partial<WebEnv> = {},
  source?: NodeJS.ProcessEnv,
): WebEnv {
  return {
    serverBaseUrl: overrides.serverBaseUrl ?? getServerBaseUrl(source),
    supabaseUrl:
      overrides.supabaseUrl ??
      requireEnv(
        "NEXT_PUBLIC_SUPABASE_URL",
        source
          ? source.NEXT_PUBLIC_SUPABASE_URL
          : process.env.NEXT_PUBLIC_SUPABASE_URL,
      ),
    supabaseAnonKey:
      overrides.supabaseAnonKey ??
      requireEnv(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        source
          ? source.NEXT_PUBLIC_SUPABASE_ANON_KEY
          : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
  };
}

function requireEnv(name: string, value: string | undefined) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`Missing required browser env: ${name}`);
  }

  return normalizedValue;
}

function isBrowserUsingRemoteOrigin() {
  if (typeof globalThis.location === "undefined") {
    return false;
  }

  return !isLoopbackHostname(globalThis.location.hostname);
}

function isLocalhostUrl(value: string) {
  try {
    return isLoopbackHostname(new URL(value).hostname);
  } catch {
    return false;
  }
}

function isLoopbackHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}
