/**
 * The animated background is a WebGL2 shader. On machines without GPU
 * acceleration it is rendered on the CPU, which competes with the timer for
 * the main thread, so the shader runs only on a hardware WebGL2 renderer.
 * failIfMajorPerformanceCaveat makes the browser refuse a software context;
 * the renderer name catches the ones that slip through.
 */
let cached: boolean | undefined;

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i;

export function supportsHardwareWebGL(): boolean {
  if (cached !== undefined) return cached;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!gl) return (cached = false);
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    cached = !SOFTWARE_RENDERER.test(renderer);
  } catch {
    cached = false;
  }
  return cached;
}
