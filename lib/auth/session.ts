import { accountBackend } from "./config";

export type AuthStatus = "loading" | "signedOut" | "signedIn" | "unconfigured";

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  /**
   * The Firebase uid this account had before the move to Supabase, when the
   * import recorded one. It lets a browser that last synced under that id keep
   * its copy (lib/storage/account-owner.ts).
   */
  legacyUid?: string;
}

export interface AuthSnapshot {
  status: AuthStatus;
  user: AuthUser | null;
}

const listeners = new Set<() => void>();
let snapshot: AuthSnapshot = { status: "loading", user: null };
let started = false;

function emit() {
  listeners.forEach((listener) => listener());
}

/** What either service tells us about who is signed in. */
export interface ServiceUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
  legacyUid?: string;
}

export function applyUser(user: ServiceUser | null): void {
  // Anonymous ids only hold shared test results; to the app they are signed out.
  const next: AuthSnapshot =
    user && !user.isAnonymous
      ? {
          status: "signedIn",
          user: {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            ...(user.legacyUid ? { legacyUid: user.legacyUid } : {}),
          },
        }
      : { status: "signedOut", user: null };
  // Token refreshes repeat the same user; skip those so nothing re-renders.
  if (sameSnapshot(snapshot, next)) return;
  snapshot = next;
  emit();
}

function sameSnapshot(a: AuthSnapshot, b: AuthSnapshot): boolean {
  if (a.status !== b.status) return false;
  if (!a.user || !b.user) return a.user === b.user;
  return (
    a.user.uid === b.user.uid &&
    a.user.displayName === b.user.displayName &&
    a.user.email === b.user.email &&
    a.user.photoURL === b.user.photoURL &&
    a.user.legacyUid === b.user.legacyUid
  );
}

export function getAuthSnapshot(): AuthSnapshot {
  return snapshot;
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const AUTH_SERVER_SNAPSHOT: AuthSnapshot = { status: "loading", user: null };

function unconfigured(): void {
  snapshot = { status: "unconfigured", user: null };
  emit();
}

export function startAuthListener(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  const backend = accountBackend();
  if (backend === "supabase") {
    void import("./supabase-session")
      .then(({ startSupabaseSession }) => startSupabaseSession())
      .catch((error: unknown) => {
        console.error(error);
        unconfigured();
      });
    return;
  }
  if (backend !== "firebase") {
    unconfigured();
    return;
  }
  void import("./firebase")
    .then(async ({ getFirebaseAuth }) => {
      const auth = getFirebaseAuth();
      if (!auth) {
        unconfigured();
        return;
      }
      const { getRedirectResult, browserPopupRedirectResolver } = await import("firebase/auth");
      try {
        const { completeGoogleOidcFromLocation } = await import("./actions");
        await completeGoogleOidcFromLocation();
      } catch (error) {
        console.error(error);
      }
      try {
        const result = await Promise.race([
          getRedirectResult(auth, browserPopupRedirectResolver),
          new Promise<null>((resolve) => {
            window.setTimeout(() => resolve(null), 2500);
          }),
        ]);
        if (result?.user) applyUser(result.user);
      } catch (error) {
        console.error(error);
      }
      await auth.authStateReady();
      applyUser(auth.currentUser);
      // Token changes also fire when an anonymous id is linked to Google (same uid).
      auth.onIdTokenChanged((user) => applyUser(user));
    })
    .catch(() => unconfigured());
}

/** Used by unit tests. */
export function resetAuthForTests(next: AuthSnapshot): void {
  snapshot = next;
  started = true;
  emit();
}
