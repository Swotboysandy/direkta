import { NextResponse } from "next/server";
import puppeteerCore from "puppeteer-core";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Throwaway manual test route — not linked from any UI. Remove after use. */
export async function POST() {
  const cdpUrl = process.env.HIGGS_CDP_URL;
  if (!cdpUrl) return NextResponse.json({ ok: false, error: "no HIGGS_CDP_URL" }, { status: 400 });
  const browser = await puppeteerCore.connect({ browserURL: cdpUrl, defaultViewport: null });
  const page = await browser.newPage();
  try {
    await page.goto("https://higgsfield.ai/ai/image", { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 3000));
    const title = await page.title();
    const snippet = await page.evaluate(() => document.body.innerText.slice(0, 500).replace(/\s+/g, " "));
    await page.screenshot({ path: "/tmp/higgs-inspect2.png", fullPage: false });
    return NextResponse.json({ ok: true, title, snippet });
  } finally {
    await page.close().catch(() => {});
    await browser.disconnect().catch(() => {});
  }
}
