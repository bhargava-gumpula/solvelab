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
  if (filePath.endsWith(".html")) return "public, max-age=60, must-revalidate";
  return "public, max-age=3600";
}

/**
 * The headers Cloudflare Pages adds from `_headers` (copied from public/), so a
 * local run gets the live site's CSP and caching. Supports what that file
 * uses: path patterns with `*` splats, each followed by indented `Name: value`.
 */
async function headersFor(pathname) {
  const text = await readFile(resolve(root, "_headers"), "utf8").catch(() => "");
  const headers = {};
  let matches = false;
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      const pattern = line
        .trim()
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replaceAll("*", ".*");
      matches = new RegExp(`^${pattern}$`).test(pathname);
    } else if (matches) {
      const colon = line.indexOf(":");
      headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    }
  }
  return headers;
}

const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method ?? "")) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let path;
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    path = resolve(root, `.${pathname}`);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  if (path !== root && !path.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }
  const live = await headersFor(pathname);
  try {
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    const body = await readFile(path);
    response.writeHead(200, {
      "Cache-Control": cacheControl(path),
      ...live,
      "Content-Type": mime[extname(path)] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404, { ...live, "Content-Type": "text/html; charset=utf-8" });
    const body = await readFile(resolve(root, "404.html")).catch(
      () => "Not found. Run npm run build first.",
    );
    response.end(request.method === "HEAD" ? undefined : body);
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Static preview: http://127.0.0.1:${port}`));
