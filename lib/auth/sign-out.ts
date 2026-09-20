import { signOutAccount } from "./actions";

/**
 * Signs out and leaves nothing of the account behind in this browser. The
 * account keeps its own copy in Google Cloud, so signing back in restores it.
 *
 * The page is reloaded at the end: every live query, cached repository and
 * provider then starts again from an empty database, the way a first visit does.
 */
export async function signOutAndForget(): Promise<void> {
  await signOutAccount();
  const [{ resetLocalData }, { getDatabase }] = await Promise.all([
    import("@/lib/storage/reset"),
    import("@/lib/storage/database"),
  ]);
  await resetLocalData(() => {
    try {
      getDatabase().close();
    } catch {
      // Never opened in this tab: nothing to close.
    }
  });
  // A full load on purpose: every provider, live query and cached repository
  // starts again against an empty database, the way a first visit does.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (typeof window !== "undefined") window.location.assign("/timer/");
}
