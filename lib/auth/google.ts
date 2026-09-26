import { siteConfig } from "@/lib/config/site";
import { getGoogleWebClientId } from "./config";

const OIDC_NONCE_KEY = "solvelab.auth.oidcNonce";
export const OIDC_STATE_KEY = "solvelab.auth.oidcState";

export const SIGNED_IN_PATH = "/signed-in/";

export function googleOidcRedirectUrl(): string {
  const base = siteConfig.basePath.replace(/\/$/, "");
  return `${window.location.origin}${base}${SIGNED_IN_PATH}`;
}

/**
 * Records a new sign-in for this tab and returns the Google URL for it. The
 * state and nonce in the URL are the ones `takeStoredOidc` hands back.
 */
export function buildGoogleOidcUrl(): string {
  const clientId = getGoogleWebClientId();
  if (!clientId) throw new Error("Google Sign-In isn’t configured.");
  const nonce = crypto.randomUUID();
  const state = crypto.randomUUID();
  sessionStorage.setItem(OIDC_NONCE_KEY, nonce);
  sessionStorage.setItem(OIDC_STATE_KEY, state);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", googleOidcRedirectUrl());
  url.searchParams.set("response_type", "id_token");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export function startGoogleOidcRedirect(): void {
  window.location.assign(buildGoogleOidcUrl());
}

export type OidcHash = { idToken: string; state: string } | { error: string } | null;

export function parseOidcHash(hash: string): OidcHash {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!trimmed) return null;
  const params = new URLSearchParams(trimmed);
  const error = params.get("error");
  if (error) return { error };
  const idToken = params.get("id_token");
  if (!idToken) return null;
  return { idToken, state: params.get("state") ?? "" };
}

/** What this tab asked Google for, so the answer can be checked against it. */
export interface PendingOidc {
  state: string;
  nonce: string;
}

/**
 * Reads and forgets this tab's pending sign-in. It is removed on read, so one
 * sign-in can't be finished twice with the same values.
 */
export function takeStoredOidc(): PendingOidc | null {
  if (typeof window === "undefined") return null;
  const state = sessionStorage.getItem(OIDC_STATE_KEY);
  const nonce = sessionStorage.getItem(OIDC_NONCE_KEY);
  sessionStorage.removeItem(OIDC_STATE_KEY);
  sessionStorage.removeItem(OIDC_NONCE_KEY);
  return state && nonce ? { state, nonce } : null;
}

/** Whether a path is the page Google returns to. */
export function isSignedInPath(pathname: string): boolean {
  const base = siteConfig.basePath.replace(/\/$/, "");
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return path === `${base}${SIGNED_IN_PATH}`;
}

/**
 * The `nonce` claim of a Google ID token. Only used to match the token to the
 * request this tab made; Firebase verifies the signature itself.
 */
export function idTokenNonce(idToken: string): string | null {
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const nonce = (claims as { nonce?: unknown } | null)?.nonce;
    return typeof nonce === "string" ? nonce : null;
  } catch {
    return null;
  }
}
