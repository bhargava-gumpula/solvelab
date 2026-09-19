import { getFirebaseConfig } from "./config";

export type AuthStatus = "loading" | "signedOut" | "signedIn" | "unconfigured";

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
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

function applyUser(
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    isAnonymous?: boolean;
  } | null,
): void {
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
    a.user.photoURL === b.user.photoURL
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

export function startAuthListener(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!getFirebaseConfig()) {
    snapshot = { status: "unconfigured", user: null };
    emit();
    return;
  }
  void import("./firebase")
    .then(async ({ getFirebaseAuth }) => {
      const auth = getFirebaseAuth();
      if (!auth) {
        snapshot = { status: "unconfigured", user: null };
        emit();
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
    .catch(() => {
      snapshot = { status: "unconfigured", user: null };
      emit();
    });
}

/** Used by unit tests. */
export function resetAuthForTests(next: AuthSnapshot): void {
  snapshot = next;
  started = true;
  emit();
}
