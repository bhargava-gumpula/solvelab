/** After Google returns, send the user here (trailing slash for static export). */
export const AFTER_SIGN_IN_PATH = "/timer/";
export const AFTER_SIGN_IN_KEY = "solvelab.auth.afterSignIn";

export function rememberSignInReturn(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AFTER_SIGN_IN_KEY, AFTER_SIGN_IN_PATH);
}

export function takeSignInReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  const path = sessionStorage.getItem(AFTER_SIGN_IN_KEY);
  if (path) sessionStorage.removeItem(AFTER_SIGN_IN_KEY);
  return path;
}
