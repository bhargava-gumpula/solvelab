import { siteConfig } from "@/lib/config/site";
import { getGoogleWebClientId } from "./config";

const OIDC_NONCE_KEY = "solvelab.auth.oidcNonce";
const OIDC_STATE_KEY = "solvelab.auth.oidcState";

export const SIGNED_IN_PATH = "/signed-in/";

export function googleOidcRedirectUrl(): string {
  const base = siteConfig.basePath.replace(/\/$/, "");
  return `${window.location.origin}${base}${SIGNED_IN_PATH}`;
}

export function startGoogleOidcRedirect(): void {
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
  window.location.assign(url.toString());
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

export function takeStoredOidcState(): string | null {
  if (typeof window === "undefined") return null;
  const state = sessionStorage.getItem(OIDC_STATE_KEY);
  sessionStorage.removeItem(OIDC_STATE_KEY);
  sessionStorage.removeItem(OIDC_NONCE_KEY);
  return state;
}
