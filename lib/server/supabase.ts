import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The service-role key bypasses RLS, so this client must only ever run on the server.
// `server-only` makes importing this module from a Client Component a build error.

let client: SupabaseClient | null = null;

export class ConfigurationError extends Error {}

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new ConfigurationError(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see README).",
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
