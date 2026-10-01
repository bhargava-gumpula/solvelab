// Tiles screenshots into one image (for quick review): node scripts/contact-sheet.mjs out.png cols a.png b.png ...
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
const [out, cols, ...files] = process.argv.slice(2);
const html = `<body style="margin:0;display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px;background:#888">${files
  .map(
    (f) =>
      `<img src="data:image/png;base64,${readFileSync(f).toString("base64")}" style="width:100%;display:block">`,
  )
  .join("")}</body>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 400 } });
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
