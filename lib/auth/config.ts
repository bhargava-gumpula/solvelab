/**
 * Which service holds accounts and sync, decided at build time by which env
 * vars the build has. Both configs are public by design (they ship in the
 * site's JavaScript and are restricted by authorised domains and row level
 * security). Builds without either still run; sign-in is optional.
 */
export type AccountBackend = "supabase" | "firebase";

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export interface SupabaseWebConfig {
  url: string;
  /** The project's publishable key (or legacy anon key): RLS applies to it. */
  anonKey: string;
  /** The project ref, the first label of the URL's host; names the session's storage key. */
  ref: string;
}

export function getFirebaseConfig(): FirebaseWebConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return { apiKey, authDomain, projectId, appId };
}

export function getSupabaseConfig(): SupabaseWebConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  let ref: string;
  try {
    ref = new URL(url).hostname.split(".")[0] ?? "";
  } catch {
    return null;
  }
  if (!ref) return null;
  return { url, anonKey, ref };
}

/**
 * Supabase when its vars are set, else Firebase when its are, else nothing.
 * Supabase wins when both are present, so the cutover build needs no code change.
 */
export function accountBackend(): AccountBackend | null {
  if (getSupabaseConfig()) return "supabase";
  if (getFirebaseConfig()) return "firebase";
  return null;
}

export function isAuthConfigured(): boolean {
  return accountBackend() !== null;
}

export const AUTH_NOT_CONFIGURED = "Accounts aren’t configured on this build.";

/**
 * Google OAuth web client ID, for the Firebase path's same-origin OIDC
 * redirect. Public by design (it appears in the Google sign-in URL). Prefer
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID; the fallback is the client Firebase created for
 * this project. The Supabase path doesn't use it: Supabase holds the client.
 */
export function getGoogleWebClientId(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (fromEnv) return fromEnv;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (appId?.startsWith("1:186249324171:")) {
    return "186249324171-gd21qdctadib73ifm3692ub0ctd4qm9k.apps.googleusercontent.com";
  }
  return null;
}
