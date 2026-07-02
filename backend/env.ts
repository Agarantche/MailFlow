type RequiredServerKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "OPENAI_API_KEY";

type OptionalServerKey =
  | "NEXT_PUBLIC_APP_URL"
  | "OPENAI_MODEL"
  | "STRIPE_PRICE_ID_PRO";

export function requireEnv(key: RequiredServerKey) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function optionalEnv(key: OptionalServerKey) {
  return process.env[key];
}

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function hasGoogleEnv() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function hasOpenAIEnv() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getAppUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL;
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;

  return explicitUrl ?? vercelUrl ?? "http://localhost:3000";
}

export function getGoogleRedirectUri() {
  return (
    process.env.GOOGLE_REDIRECT_URI ??
    `${getAppUrl().replace(/\/$/, "")}/api/auth/google/callback`
  );
}
