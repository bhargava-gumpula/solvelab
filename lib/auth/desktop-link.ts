/**
 * Delivers `solvelab://` links to the running app (`onOpenUrl`) and the one
 * that launched it from closed (`getCurrent`). Both can report the same link;
 * the sign-in nonce makes the second a no-op. Returns the unsubscribe.
 */
export async function watchSignInLinks(onLink: (link: string) => void): Promise<() => void> {
  const { getCurrent, onOpenUrl } = await import("@tauri-apps/plugin-deep-link");
  const unlisten = await onOpenUrl((links) => links.forEach(onLink));
  (await getCurrent())?.forEach(onLink);
  return unlisten;
}
