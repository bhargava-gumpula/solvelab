import { toast } from "sonner";
import { siteConfig } from "@/lib/config/site";
import { isDesktop } from "@/lib/config/platform";
import {
  AUTH_NOT_CONFIGURED,
  accountBackend,
  getFirebaseConfig,
  getGoogleWebClientId,
} from "./config";
import {
  desktopReturnErrorMessage,
  parseDesktopCallback,
  startDesktopFlow,
  takeDesktopFlow,
} from "./desktop-return";
import { AFTER_SIGN_IN_PATH, rememberSignInReturn, takeSignInReturnPath } from "./return-path";
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
 * What this tab sent to Google: "link" or "signIn". The return page acts on an
 * error only when this tab started the trip, so a crafted /signed-in/ link can't
 * sign anyone out, withdraw their shares or put its own words in a toast.
 */
export const RETURN_STARTED_KEY = "solvelab.auth.returnStarted";

/** Past this, signing out stops waiting for the account service and drops the session itself. */
const SIGN_OUT_TIMEOUT_MS = 5000;

/**
 * Google through Supabase Auth, with PKCE. An anonymous session (one that
 * shared test results) is turned into the account by linking, so its shares
 * come along; when that Google account already exists the return carries an
 * error, and `completeSupabaseReturnFromLocation` moves the shares and signs
 * in to the existing account instead. In the Mac app Google can't load in the
 * app window, so the sign-in page opens in the person's browser and comes back
 * through `solvelab://auth/callback` (`completeSupabaseReturnFromUrl`).
 */
async function signInWithGoogleOnSupabase(): Promise<void> {
  const { getSupabaseClient } = await import("@/lib/supabase/client");
  const client = getSupabaseClient();
  if (!client) throw new Error(AUTH_NOT_CONFIGURED);
  const desktop = isDesktop();
  const options = {
    redirectTo: desktop ? startDesktopFlow() : supabaseRedirectUrl(),
    queryParams: { prompt: "select_account" },
    skipBrowserRedirect: desktop,
  };
  const {
    data: { session },
  } = await client.auth.getSession();
  const link = session?.user.is_anonymous === true && !sessionStorage.getItem(LINK_FALLBACK_KEY);
  sessionStorage.setItem(RETURN_STARTED_KEY, link ? "link" : "signIn");
  const { data, error } = link
    ? await client.auth.linkIdentity({ provider: "google", options })
    : await client.auth.signInWithOAuth({ provider: "google", options });
  if (error) {
    sessionStorage.removeItem(RETURN_STARTED_KEY);
    throw error;
  }
  if (desktop) await openInSystemBrowser(data.url);
}

/** Opens Supabase's Google page in the person's own browser (https only; the app's capability allows nothing else). */
async function openInSystemBrowser(url: string | null): Promise<void> {
  if (!url || new URL(url).protocol !== "https:")
    throw new Error("Couldn’t open the sign-in page.");
  const { openUrl } = await import("@tauri-apps/plugin-opener");
  await openUrl(url);
  toast("Finish signing in in your browser, then come back to SolveLab.");
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
 * A failed identity link falls back to signing in to the existing account
 * (after moving the anonymous id's shares aside); any other error is shown with
 * `message`. Returns whether the fallback sign-in was started. The fallback
 * needs this tab's own link (`started`, from `RETURN_STARTED_KEY`) from a
 * session that is still anonymous, so a crafted return can't sign anyone out.
 */
async function handleSupabaseReturnFailure(
  failure: { code: string; description: string },
  started: string | null,
  message: (failure: { code: string; description: string }) => string,
): Promise<boolean> {
  const { getSupabaseClient } = await import("@/lib/supabase/client");
  const client = getSupabaseClient();
  if (
    started === "link" &&
    isIdentityTakenError(failure) &&
    !sessionStorage.getItem(LINK_FALLBACK_KEY) &&
    (await client?.auth.getSession())?.data.session?.user.is_anonymous === true
  ) {
    sessionStorage.setItem(LINK_FALLBACK_KEY, "1");
    const { withdrawBeforeAccountSwitch } = await import("@/lib/training-data/uploader");
    await withdrawBeforeAccountSwitch();
    await client?.auth.signOut({ scope: "local" });
    await signInWithGoogleOnSupabase();
    return true;
  }
  sessionStorage.removeItem(LINK_FALLBACK_KEY);
  toast.error(message(failure));
  return false;
}

/**
 * Only on the return page: see `handleSupabaseReturnFailure`. The code
 * exchange itself is done by the client (`detectSessionInUrl`). Fails closed
 * like the Firebase path: nothing here runs on any other page, an error this
 * tab didn't go to Google for only tidies the URL, and the URL's error text is
 * never shown, since anyone can write it.
 */
export async function completeSupabaseReturnFromLocation(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!isSignedInPath(window.location.pathname)) return false;
  const started = sessionStorage.getItem(RETURN_STARTED_KEY);
  sessionStorage.removeItem(RETURN_STARTED_KEY);
  const failure = parseSupabaseReturnError(window.location.search, window.location.hash);
  if (!failure) {
    sessionStorage.removeItem(LINK_FALLBACK_KEY);
    return false;
  }
  history.replaceState(null, "", window.location.pathname);
  if (!started) return true;
  await handleSupabaseReturnFailure(failure, started, () => "Google sign-in didn’t finish.");
  return true;
}

export type SupabaseUrlReturn =
  { status: "ignored" } | { status: "signedIn"; path: string } | { status: "retrying" | "failed" };

/**
 * The Mac app's return page: a `solvelab://auth/callback` link from the browser.
 * Acts only on a link for a sign-in this app started (exact host and path, and
 * its nonce, once); then handles an error like the website, or exchanges the
 * code for the session (the PKCE verifier is in this app's storage) and says
 * where the `/signed-in/` page would send the person.
 */
export async function completeSupabaseReturnFromUrl(link: string): Promise<SupabaseUrlReturn> {
  const url = parseDesktopCallback(link);
  if (!url || !takeDesktopFlow(url.searchParams.get("flow"))) return { status: "ignored" };
  const started = sessionStorage.getItem(RETURN_STARTED_KEY);
  sessionStorage.removeItem(RETURN_STARTED_KEY);
  try {
    const failure = parseSupabaseReturnError(url.search, url.hash);
    if (failure) {
      const retrying = await handleSupabaseReturnFailure(
        failure,
        started,
        desktopReturnErrorMessage,
      );
      return { status: retrying ? "retrying" : "failed" };
    }
    const code = url.searchParams.get("code");
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const client = getSupabaseClient();
    if (client && code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) {
        sessionStorage.removeItem(LINK_FALLBACK_KEY);
        return { status: "signedIn", path: takeSignInReturnPath() ?? AFTER_SIGN_IN_PATH };
      }
    }
  } catch (error) {
    // Also a retry that couldn't open the browser: the person gets a message, not silence.
    console.error(error);
  }
  sessionStorage.removeItem(LINK_FALLBACK_KEY);
  toast.error(desktopReturnErrorMessage({ code: "" }));
  return { status: "failed" };
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
    const { forgetSupabaseSession, getSupabaseClient } = await import("@/lib/supabase/client");
    const client = getSupabaseClient();
    if (!client) return;
    // This device only; other devices keep their sessions, as with Firebase.
    const signedOut = await Promise.race([
      client.auth.signOut({ scope: "local" }).then(
        ({ error }) => !error,
        () => false,
      ),
      new Promise<boolean>((resolve) => setTimeout(resolve, SIGN_OUT_TIMEOUT_MS, false)),
    ]);
    // Offline with an expired token, supabase-js retries a refresh for about
    // 25 s and then keeps the session stored, so drop it here instead.
    if (!signedOut) forgetSupabaseSession();
    return;
  }
  if (backend !== "firebase") return;
  const { getFirebaseAuth } = await import("./firebase");
  const auth = getFirebaseAuth();
  if (!auth) return;
  const { signOut } = await import("firebase/auth");
  await signOut(auth);
}
