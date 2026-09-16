/**
 * Firebase web config is public by design (restricted by authorized domains).
 * Builds without these env vars still run; sign-in is optional.
 */
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export function getFirebaseConfig(): FirebaseWebConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return { apiKey, authDomain, projectId, appId };
}

export function isAuthConfigured(): boolean {
  return getFirebaseConfig() !== null;
}

export const AUTH_NOT_CONFIGURED = "Accounts aren’t configured on this build.";

/**
 * Google OAuth web client ID. Public by design (it appears in the Google
 * sign-in URL). Prefer NEXT_PUBLIC_GOOGLE_CLIENT_ID; the fallback is the
 * client Firebase created for this project.
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
