import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { hasSupabaseEnv, requireEnv } from "@/backend/env";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  return cachedClient;
}

export function getOptionalSupabaseAdmin() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return getSupabaseAdmin();
}
