// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignOutDialog } from "@/components/auth/sign-out-dialog";

const flags = vi.hoisted(() => ({ coachChat: true }));

vi.mock("@/lib/config/features", () => ({
  features: {
    get coachChat() {
      return flags.coachChat;
    },
  },
}));
vi.mock("@/lib/auth/sign-out", () => ({ signOutAndForget: vi.fn() }));
vi.mock("@/lib/sync/account", () => ({ pushLocalChanges: vi.fn() }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function openDialog() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () =>
    root.render(createElement(SignOutDialog, { open: true, onOpenChange: () => {} })),
  );
  return async () => {
    await act(async () => root.unmount());
    container.remove();
  };
}

afterEach(() => {
  flags.coachChat = true;
});

describe("the sign-out dialog and coach chats", () => {
  it("warns in the Mac app that this Mac's coach chats are deleted, and where to keep them", async () => {
    const close = await openDialog();
    const note = document.querySelector("[data-testid=sign-out-coach-chats]");
    expect(note?.textContent).toContain("Your coach chats on this Mac will be deleted");
    expect(note?.textContent).toContain("export a backup");
    await close();
  });

  it("says nothing about chats on the website, which has none", async () => {
    flags.coachChat = false;
    const close = await openDialog();
    expect(document.querySelector("[data-testid=sign-out-dialog]")).not.toBeNull();
    expect(document.querySelector("[data-testid=sign-out-coach-chats]")).toBeNull();
    await close();
  });
});
