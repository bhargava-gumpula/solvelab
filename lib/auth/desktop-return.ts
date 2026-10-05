/**
 * The Mac app's sign-in return. Google opens in the person's own browser and
 * Supabase sends it back to `solvelab://auth/callback?flow=<nonce>&code=…`,
 * which macOS hands to the app. Any web page or program can open a
 * `solvelab://` link, so the app only acts on one for a sign-in it started:
 * exact host and path, and the nonce stored when the sign-in began.
 */
export const DESKTOP_CALLBACK_URL = "solvelab://auth/callback";
export const FLOW_KEY = "solvelab.auth.desktopFlow";
export const FLOW_MAX_AGE_MS = 10 * 60 * 1000;

function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Remembers a new pending sign-in (localStorage, so it survives the app being closed meanwhile) and returns the `redirectTo` for it. */
export function startDesktopFlow(now = Date.now()): string {
  const nonce = randomNonce();
  localStorage.setItem(FLOW_KEY, JSON.stringify({ nonce, at: now }));
  return `${DESKTOP_CALLBACK_URL}?flow=${nonce}`;
}

/** The link as a URL when it is exactly `solvelab://auth/callback` (any query), otherwise null. */
export function parseDesktopCallback(link: string): URL | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  const exact =
    url.protocol === "solvelab:" &&
    url.host === "auth" &&
    url.pathname === "/callback" &&
    !url.username &&
    !url.password;
  return exact ? url : null;
}

/**
 * True once for the pending sign-in whose nonce this is, started less than ten
 * minutes ago; the record is cleared as it is used. A wrong nonce leaves the
 * pending sign-in alone, so a forged link can't cancel a real one.
 */
export function takeDesktopFlow(nonce: string | null, now = Date.now()): boolean {
  const raw = localStorage.getItem(FLOW_KEY);
  if (!raw) return false;
  let pending: { nonce?: unknown; at?: unknown } = {};
  try {
    pending = JSON.parse(raw) as typeof pending;
  } catch {
    // Unreadable record: treated as expired below.
  }
  const fresh =
    typeof pending.nonce === "string" &&
    typeof pending.at === "number" &&
    now - pending.at >= 0 &&
    now - pending.at <= FLOW_MAX_AGE_MS;
  if (!fresh) {
    localStorage.removeItem(FLOW_KEY);
    return false;
  }
  if (!nonce || nonce !== pending.nonce) return false;
  localStorage.removeItem(FLOW_KEY);
  return true;
}

/** Fixed copy for a failed return: the link's own `error_description` is never shown. */
export function desktopReturnErrorMessage(failure: { code: string }): string {
  if (failure.code === "access_denied") return "Google sign-in was cancelled.";
  if (failure.code === "identity_already_exists" || failure.code === "email_exists") {
    return "That Google account is already linked to another SolveLab account.";
  }
  return "Google sign-in didn’t finish.";
}
