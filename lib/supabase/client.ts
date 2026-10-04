import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/auth/config";

/**
 * The one Supabase client for the browser. PKCE for sign-in, the session kept
 * in this origin's localStorage (`sb-<ref>-auth-token`), and the code in the
 * URL after Google exchanged for a session on load.
 */
let client: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const config = getSupabaseConfig();
  if (!config || typeof window === "undefined") {
    client = null;
    return null;
  }
  client = createClient(config.url, config.anonKey, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

/** The localStorage key supabase-js keeps the session under. */
export function supabaseSessionKey(ref: string): string {
  return `sb-${ref}-auth-token`;
}

/** Used by unit tests. */
export function resetSupabaseClientForTests(next: SupabaseClient | null | undefined): void {
  client = next;
}
