import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { composeHtml } from "../../src/lib/memes/compose.ts";
import type { MemeSpec, Template } from "../../src/lib/memes/types.ts";

const TPL_DIR = "assets/memes/templates";
const FONT = "assets/fonts/NotoSansDevanagari-Bold.ttf";

async function serveAssets(): Promise<{ url: string; close: () => void }> {
  const server = createServer(async (req, res) => {
    try {
      const name = decodeURIComponent((req.url ?? "/").slice(1));
      const buf = await readFile(name.startsWith("fonts/") ? name.replace("fonts/", "assets/fonts/") : join(TPL_DIR, name));
      res.writeHead(200); res.end(buf);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as { port: number }).port;
  return { url: `http://localhost:${port}`, close: () => server.close() };
}

export async function renderMeme(spec: MemeSpec, tpl: Template, outPath: string): Promise<void> {
  const assets = await serveAssets();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: tpl.width, height: tpl.height } });
    const html = composeHtml(spec, tpl, { imageBaseUrl: assets.url, fontPath: `${assets.url}/fonts/${FONT.split("/").pop()}` });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => (document as any).fonts.ready);
    await page.screenshot({ path: outPath, type: "png" });
  } finally {
    await browser.close();
    assets.close();
  }
}
