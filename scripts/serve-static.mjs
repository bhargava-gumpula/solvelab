import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve(process.env.SOLVELAB_ROOT ?? "out");
const port = Number(process.env.PORT ?? 5173);
const cache = process.env.SOLVELAB_CACHE === "1";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function cacheControl(filePath) {
  if (!cache) return "no-store";
  const rel = filePath.slice(root.length).replaceAll("\\", "/");
  if (rel.startsWith("/_next/static/") || rel.startsWith("/vendor/cubing/chunks/")) {
    return "public, max-age=31536000, immutable";
  }
  if (rel.endsWith(".html")) return "public, max-age=60, must-revalidate";
  return "public, max-age=3600";
}

const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method ?? "")) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let path;
  try {
    path = resolve(
      root,
      `.${decodeURIComponent(new URL(request.url, "http://localhost").pathname)}`,
    );
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  if (path !== root && !path.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    const body = await readFile(path);
    response.writeHead(200, {
      "Content-Type": mime[extname(path)] ?? "application/octet-stream",
      "Cache-Control": cacheControl(path),
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    const body = await readFile(resolve(root, "404.html")).catch(
      () => "Not found. Run npm run build first.",
    );
    response.end(request.method === "HEAD" ? undefined : body);
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Static preview: http://127.0.0.1:${port}`));
