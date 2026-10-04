import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { applyUser, type ServiceUser } from "./session";

/**
 * Supabase Auth as the app sees it. The client keeps the session in this
 * origin's localStorage and refreshes it itself; a refresh that fails because
 * the project can't be reached (a paused free project, offline) keeps the
 * session, so the account areas stay open; only a real sign-out, or a token
 * the server refuses, signs the app out.
 */
export function serviceUserOf(user: User | null | undefined): ServiceUser | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const app = (user.app_metadata ?? {}) as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === "string" && value ? value : null);
  const legacyUid = text(app.firebase_uid);
  return {
    uid: user.id,
    displayName: text(meta.full_name) ?? text(meta.name),
    email: user.email ?? text(meta.email),
    photoURL: text(meta.avatar_url) ?? text(meta.picture),
    isAnonymous: user.is_anonymous === true,
    ...(legacyUid ? { legacyUid } : {}),
  };
}

export async function startSupabaseSession(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    applyUser(null);
    return;
  }
  // A Google return with an error (a link that couldn't be made) is handled
  // before the session is read, so the fallback sign-in can start at once.
  try {
    const { completeSupabaseReturnFromLocation } = await import("./actions");
    await completeSupabaseReturnFromLocation();
  } catch (error) {
    console.error(error);
  }
  const {
    data: { session },
  } = await client.auth.getSession();
  applyUser(serviceUserOf(session?.user));
  client.auth.onAuthStateChange((event, next: Session | null) => {
    if (event === "INITIAL_SESSION") return;
    applyUser(serviceUserOf(next?.user));
  });
}
