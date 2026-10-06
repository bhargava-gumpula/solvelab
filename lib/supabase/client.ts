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

/** Removes this project's stored session, and its PKCE verifier, from this browser. */
export function forgetSupabaseSession(): void {
  const ref = getSupabaseConfig()?.ref;
  if (!ref) return;
  const prefix = supabaseSessionKey(ref);
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(prefix)) localStorage.removeItem(key);
    }
  } catch {
    // Storage blocked: nothing was stored.
  }
}

/** Used by unit tests. */
export function resetSupabaseClientForTests(next: SupabaseClient | null | undefined): void {
  client = next;
}
