import { toast } from "sonner";
import { siteConfig } from "@/lib/config/site";
import {
  AUTH_NOT_CONFIGURED,
  accountBackend,
  getFirebaseConfig,
  getGoogleWebClientId,
} from "./config";
import { rememberSignInReturn } from "./return-path";
import {
  idTokenNonce,
  isSignedInPath,
  parseOidcHash,
  SIGNED_IN_PATH,
  startGoogleOidcRedirect,
  takeStoredOidc,
} from "./google";

export { AUTH_NOT_CONFIGURED };

function errorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "";
}

/** User-facing copy for Google sign-in failures. Used by tests. */
export function googleSignInErrorMessage(error: unknown): string {
  const code = errorCode(error);
  if (code === "auth/popup-blocked") {
    return "Allow popups for this site, then try Sign in with Google again.";
  }
  if (code === "auth/operation-not-supported-in-this-environment") {
    return "Couldn’t sign in with Google in this browser. Try Chrome or Safari, and allow popups.";
  }
  if (code === "auth/unauthorized-domain") {
    return "This address isn’t on the Firebase authorized domain list.";
  }
  if (code === "validation_failed" || /redirect/i.test(String((error as Error)?.message))) {
    return "This address isn’t on the account service’s allowed list of return addresses.";
  }
  if (error instanceof Error && error.message === AUTH_NOT_CONFIGURED) return AUTH_NOT_CONFIGURED;
  if (error instanceof Error && error.message && !error.message.startsWith("Firebase:")) {
    return error.message;
  }
  return "Couldn’t sign in with Google.";
}

// ---------------------------------------------------------------- Firebase

async function signInWithGoogleTokens(idToken?: string, accessToken?: string): Promise<void> {
  const [{ getFirebaseAuth }, { GoogleAuthProvider, linkWithCredential, signInWithCredential }] =
    await Promise.all([import("./firebase"), import("firebase/auth")]);
  const auth = getFirebaseAuth();
  if (!auth) throw new Error(AUTH_NOT_CONFIGURED);
  const credential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null);
  await auth.authStateReady();
  const current = auth.currentUser;
  if (current?.isAnonymous) {
    // Keep the anonymous id's shared test results by turning it into this account.
    try {
      await linkWithCredential(current, credential);
      return;
    } catch (error) {
      if (errorCode(error) !== "auth/credential-already-in-use") throw error;
      // The Google account already exists: move the shared results over to it.
      const { withdrawBeforeAccountSwitch } = await import("@/lib/training-data/uploader");
      await withdrawBeforeAccountSwitch();
      const retry = GoogleAuthProvider.credentialFromError(error as never);
      await signInWithCredential(auth, retry ?? credential);
      return;
    }
  }
  await signInWithCredential(auth, credential);
}

/**
 * Finish a same-origin Google redirect that returned `#id_token=…` (Firebase).
 *
 * Fails closed. Anyone can mint a token for this site's public client id and
 * put it in a link, which would sign the visitor in to the sender's account
 * and upload this browser's solves to it (login CSRF). So a token is only
 * accepted on the return page, in the tab that started the sign-in, with the
 * state and nonce that tab sent.
 */
export async function completeGoogleOidcFromLocation(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!isSignedInPath(window.location.pathname)) return false;
  const parsed = parseOidcHash(window.location.hash);
  if (!parsed) return false;
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  const pending = takeStoredOidc();
  if ("error" in parsed) {
    throw new Error(
      parsed.error === "redirect_uri_mismatch"
        ? "Google rejected this site’s return address. Add it as an authorized redirect URI."
        : "Google sign-in didn’t finish.",
    );
  }
  if (
    !pending ||
    parsed.state !== pending.state ||
    idTokenNonce(parsed.idToken) !== pending.nonce
  ) {
    throw new Error("Google sign-in didn’t match this tab. Try again.");
  }
  await signInWithGoogleTokens(parsed.idToken);
  return true;
}

// ---------------------------------------------------------------- Supabase

/** Where Supabase sends the tab back to after Google: this origin's return page. */
export function supabaseRedirectUrl(): string {
  const base = siteConfig.basePath.replace(/\/$/, "");
  return `${window.location.origin}${base}${SIGNED_IN_PATH}`;
}

/** Set while a failed identity link is being retried as a plain sign-in, so it can't loop. */
const LINK_FALLBACK_KEY = "solvelab.auth.linkFallback";

/**
 * Google through Supabase Auth, with PKCE. An anonymous session (one that
 * shared test results) is turned into the account by linking, so its shares
 * come along; when that Google account already exists the return carries an
 * error, and `completeSupabaseReturnFromLocation` moves the shares and signs
 * in to the existing account instead.
 */
async function signInWithGoogleOnSupabase(): Promise<void> {
  const { getSupabaseClient } = await import("@/lib/supabase/client");
  const client = getSupabaseClient();
  if (!client) throw new Error(AUTH_NOT_CONFIGURED);
  const options = {
    redirectTo: supabaseRedirectUrl(),
    queryParams: { prompt: "select_account" },
  };
  const {
    data: { session },
  } = await client.auth.getSession();
  if (session?.user.is_anonymous && !sessionStorage.getItem(LINK_FALLBACK_KEY)) {
    const { error } = await client.auth.linkIdentity({ provider: "google", options });
    if (error) throw error;
    return;
  }
  const { error } = await client.auth.signInWithOAuth({ provider: "google", options });
  if (error) throw error;
}

/** The error Supabase puts in the return URL when a link or sign-in couldn't finish. */
export function parseSupabaseReturnError(
  search: string,
  hash: string,
): { code: string; description: string } | null {
  for (const part of [search, hash]) {
    const trimmed = part.replace(/^[?#]/, "");
    if (!trimmed) continue;
    const params = new URLSearchParams(trimmed);
    if (!params.get("error") && !params.get("error_code")) continue;
    return {
      code: params.get("error_code") ?? params.get("error") ?? "",
      description: params.get("error_description") ?? params.get("error") ?? "",
    };
  }
  return null;
}

/** An identity link that failed because the Google account is already someone's. */
export function isIdentityTakenError(error: { code: string; description: string }): boolean {
  return (
    error.code === "identity_already_exists" ||
    error.code === "email_exists" ||
    /already (linked|exists|registered)/i.test(error.description)
  );
}

/**
 * Only on the return page: a failed identity link falls back to signing in to
 * the existing account (after moving the anonymous id's shares aside), any
 * other error is shown. The code exchange itself is done by the client
 * (`detectSessionInUrl`). Fails closed like the Firebase path: nothing here
 * runs on any other page.
 */
export async function completeSupabaseReturnFromLocation(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!isSignedInPath(window.location.pathname)) return false;
  const failure = parseSupabaseReturnError(window.location.search, window.location.hash);
  if (!failure) {
    sessionStorage.removeItem(LINK_FALLBACK_KEY);
    return false;
  }
  history.replaceState(null, "", window.location.pathname);
  if (isIdentityTakenError(failure) && !sessionStorage.getItem(LINK_FALLBACK_KEY)) {
    sessionStorage.setItem(LINK_FALLBACK_KEY, "1");
    const { withdrawBeforeAccountSwitch } = await import("@/lib/training-data/uploader");
    await withdrawBeforeAccountSwitch();
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    await getSupabaseClient()?.auth.signOut({ scope: "local" });
    await signInWithGoogleOnSupabase();
    return true;
  }
  sessionStorage.removeItem(LINK_FALLBACK_KEY);
  toast.error(
    failure.description
      ? `Google sign-in didn’t finish: ${failure.description}`
      : "Google sign-in didn’t finish.",
  );
  return true;
}

// ---------------------------------------------------------------- shared

/**
 * Sign in with Google by returning to this origin (`/signed-in/`), on whichever
 * service this build uses.
 */
export async function signInWithGoogle(): Promise<void> {
  const backend = accountBackend();
  if (!backend) throw new Error(AUTH_NOT_CONFIGURED);
  rememberSignInReturn();
  if (backend === "supabase") {
    await signInWithGoogleOnSupabase();
    return;
  }
  if (!getFirebaseConfig() || !getGoogleWebClientId()) throw new Error(AUTH_NOT_CONFIGURED);
  startGoogleOidcRedirect();
}

export async function signOutAccount(): Promise<void> {
  const backend = accountBackend();
  if (backend === "supabase") {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    // This device only; other devices keep their sessions, as with Firebase.
    await getSupabaseClient()?.auth.signOut({ scope: "local" });
    return;
  }
  if (backend !== "firebase") return;
  const { getFirebaseAuth } = await import("./firebase");
  const auth = getFirebaseAuth();
  if (!auth) return;
  const { signOut } = await import("firebase/auth");
  await signOut(auth);
}
