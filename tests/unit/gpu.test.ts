// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

type GetContext = (kind: string, options?: WebGLContextAttributes) => unknown;

function fakeGl(renderer: string) {
  return {
    getExtension: (name: string) =>
      name === "WEBGL_debug_renderer_info"
        ? { UNMASKED_RENDERER_WEBGL: 0x9246 }
        : name === "WEBGL_lose_context"
          ? { loseContext: () => {} }
          : null,
    getParameter: () => renderer,
  };
}

async function check(getContext: GetContext) {
  const spy = vi.fn(getContext);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    spy as unknown as HTMLCanvasElement["getContext"],
  );
  vi.resetModules();
  const { supportsHardwareWebGL } = await import("@/lib/appearance/gpu");
  return { result: supportsHardwareWebGL(), spy };
}

afterEach(() => vi.restoreAllMocks());

describe("supportsHardwareWebGL", () => {
  it("asks for WebGL2 that refuses a software fallback", async () => {
    const { result, spy } = await check(() =>
      fakeGl("ANGLE (Apple, ANGLE Metal Renderer: Apple M2)"),
    );
    expect(result).toBe(true);
    expect(spy).toHaveBeenCalledWith("webgl2", { failIfMajorPerformanceCaveat: true });
  });

  it("rejects WebGL1-only machines (the shader needs WebGL2)", async () => {
    const { result } = await check((kind) => (kind === "webgl" ? fakeGl("Intel HD") : null));
    expect(result).toBe(false);
  });

  it("rejects a software renderer that still hands out WebGL2", async () => {
    const { result } = await check(() =>
      fakeGl("ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)"),
    );
    expect(result).toBe(false);
  });

  it("rejects when creating the context throws", async () => {
    const { result } = await check(() => {
      throw new Error("blocked");
    });
    expect(result).toBe(false);
  });
});
