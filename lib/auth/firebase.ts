import { initializeApp, getApps, getApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  inMemoryPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";
import { getFirebaseConfig } from "./config";

let auth: Auth | null | undefined;

export function getFirebaseAuth(): Auth | null {
  if (auth !== undefined) return auth;
  const config = getFirebaseConfig();
  if (!config) {
    auth = null;
    return null;
  }
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  try {
    auth = initializeAuth(app, {
      persistence: [browserLocalPersistence, indexedDBLocalPersistence, inMemoryPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    auth = getAuth(app);
    void setPersistence(auth, browserLocalPersistence);
  }
  return auth;
}
