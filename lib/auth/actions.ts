import { AUTH_NOT_CONFIGURED, getFirebaseConfig, getGoogleWebClientId } from "./config";
import { rememberSignInReturn } from "./return-path";
import { parseOidcHash, startGoogleOidcRedirect, takeStoredOidcState } from "./google";

export { AUTH_NOT_CONFIGURED };

function firebaseErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "";
}

/** User-facing copy for Google sign-in failures. Used by tests. */
export function googleSignInErrorMessage(error: unknown): string {
  const code = firebaseErrorCode(error);
  if (code === "auth/popup-blocked") {
    return "Allow popups for this site, then try Sign in with Google again.";
  }
  if (code === "auth/operation-not-supported-in-this-environment") {
    return "Couldn’t sign in with Google in this browser. Try Chrome or Safari, and allow popups.";
  }
  if (code === "auth/unauthorized-domain") {
    return "This address isn’t on the Firebase authorized domain list.";
  }
  if (error instanceof Error && error.message === AUTH_NOT_CONFIGURED) return AUTH_NOT_CONFIGURED;
  if (error instanceof Error && error.message && !error.message.startsWith("Firebase:")) {
    return error.message;
  }
  return "Couldn’t sign in with Google.";
}

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
      if (firebaseErrorCode(error) !== "auth/credential-already-in-use") throw error;
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

/** Finish a same-origin Google redirect that returned `#id_token=…`. */
export async function completeGoogleOidcFromLocation(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const parsed = parseOidcHash(window.location.hash);
  if (!parsed) return false;
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  if ("error" in parsed) {
    throw new Error(
      parsed.error === "redirect_uri_mismatch"
        ? "Google rejected this site’s return address. Add it as an authorized redirect URI."
        : "Google sign-in didn’t finish.",
    );
  }
  const expected = takeStoredOidcState();
  if (expected && parsed.state !== expected) {
    throw new Error("Google sign-in didn’t match this tab. Try again.");
  }
  await signInWithGoogleTokens(parsed.idToken);
  return true;
}

/**
 * Sign in with Google by returning to this origin (`/signed-in/`). That avoids
 * Firebase’s helper page and GIS popups that can finish Google in another tab
 * without handing the token back.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!getFirebaseConfig()) throw new Error(AUTH_NOT_CONFIGURED);
  rememberSignInReturn();
  if (!getGoogleWebClientId()) throw new Error(AUTH_NOT_CONFIGURED);
  startGoogleOidcRedirect();
}

export async function signOutAccount(): Promise<void> {
  const { getFirebaseAuth } = await import("./firebase");
  const auth = getFirebaseAuth();
  if (!auth) return;
  const { signOut } = await import("firebase/auth");
  await signOut(auth);
}
