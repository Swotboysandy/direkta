/**
 * Higgsfield via a real logged-in browser.
 *
 * "Unlimited mode" — plan-included generation at zero credit cost — exists ONLY
 * in Higgsfield's signed-in web UI. It is not a parameter on the MCP/API, so the
 * only way to generate without spending credits is to drive the actual site.
 * This module replays a captured session headlessly and performs the same steps
 * a person would, including the parts that are not obvious:
 *
 *   - The Unlimited toggle RESETS TO OFF on every page load.
 *   - On /ai/video the toggle only responds to a keyboard SPACE after .focus() —
 *     clicking it does nothing.
 *   - The submit button is the ground truth: "Generate Unlimited" means free,
 *     "Generate ✦96 72" means it is about to charge 72 credits.
 *   - The prompt box is a contenteditable, not a textarea; ctrl+A silently fails
 *     and prepends instead of replacing, so the selection is made with a Range.
 *   - Frames are attached through the file input rather than the asset picker:
 *     uploads skip the "Check eligibility" gate that intermittently refuses
 *     previously-usable images.
 *
 * Every one of those was learned by losing a render to it.
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { getDb } from "../db/client";
import { writeRemoteToOss } from "./mcp";

const VIDEO_URL = "https://higgsfield.ai/ai/video";

/** Chrome on the VPS (installed for other services) or a local dev override. */
function chromePath(): string {
  const explicit = process.env.CHROME_PATH;
  if (explicit && fs.existsSync(explicit)) return explicit;
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error("No Chrome found — set CHROME_PATH to a Chrome/Chromium binary.");
}

export interface HiggsfieldCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

function row(): { cookies: string; connected_at: string | null; last_ok_at: string | null; last_error: string | null } | undefined {
  return getDb().prepare("SELECT * FROM higgsfield_browser WHERE id = 1").get() as never;
}

export function isBrowserSessionSaved(): boolean {
  const r = row();
  if (!r) return false;
  try {
    return JSON.parse(r.cookies).length > 0;
  } catch {
    return false;
  }
}

export function browserSessionStatus() {
  const r = row();
  return {
    connected: isBrowserSessionSaved(),
    connectedAt: r?.connected_at ?? null,
    lastOkAt: r?.last_ok_at ?? null,
    lastError: r?.last_error ?? null
  };
}

export function saveBrowserSession(cookies: HiggsfieldCookie[]) {
  getDb()
    .prepare(
      `INSERT INTO higgsfield_browser (id, cookies, connected_at)
       VALUES (1, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET cookies = excluded.cookies,
                                     connected_at = datetime('now'),
                                     last_error = NULL`
    )
    .run(JSON.stringify(cookies));
}

export function clearBrowserSession() {
  getDb().prepare("DELETE FROM higgsfield_browser WHERE id = 1").run();
}

function noteOk() {
  getDb().prepare("UPDATE higgsfield_browser SET last_ok_at = datetime('now'), last_error = NULL WHERE id = 1").run();
}
function noteError(msg: string) {
  getDb().prepare("UPDATE higgsfield_browser SET last_error = ? WHERE id = 1").run(msg.slice(0, 400));
}

async function openSession(): Promise<{ browser: Browser; page: Page }> {
  const r = row();
  if (!r) throw new Error("No Higgsfield browser session saved — add your cookies in the Key Vault.");
  const cookies: HiggsfieldCookie[] = JSON.parse(r.cookies);
  if (!cookies.length) throw new Error("Saved Higgsfield session is empty — re-capture your cookies.");

  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1600,1000"
    ],
    defaultViewport: { width: 1600, height: 1000 }
  });
  const page = await browser.newPage();
  await browser.setCookie(
    ...cookies.map((c) => ({
      ...c,
      domain: c.domain ?? ".higgsfield.ai",
      path: c.path ?? "/"
    }))
  );
  return { browser, page };
}

/** True once the composer has rendered (the prompt box exists). */
async function waitForComposer(page: Page) {
  await page.waitForSelector('div[contenteditable="true"]', { timeout: 90_000 });
}

/** Replace the contenteditable prompt. ctrl+A does not work here. */
async function setPrompt(page: Page, prompt: string) {
  await page.evaluate(() => {
    const el = document.querySelector('div[contenteditable="true"]') as HTMLElement;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  });
  await page.keyboard.type(prompt, { delay: 0 });
}

/**
 * Turn Unlimited on and PROVE it. Returns only when the submit button itself
 * says the render is free; otherwise throws rather than spending credits.
 */
async function enforceUnlimited(page: Page) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const state = await page.evaluate(() => {
      const t = document.querySelector('button[aria-label="Unlimited mode"]') as HTMLElement | null;
      const btn = [...document.querySelectorAll("button")].find((b) =>
        (b.textContent || "").trim().startsWith("Generate")
      );
      return {
        found: !!t,
        checked: t?.getAttribute("aria-checked") ?? null,
        label: (btn?.textContent || "").trim()
      };
    });
    if (!state.found) throw new Error("Unlimited toggle not found on the page.");
    if (state.checked === "true" && state.label.replace(/\s+/g, "") === "GenerateUnlimited") return;

    // Only a focused SPACE flips this control — clicks are ignored.
    await page.evaluate(() => {
      const t = document.querySelector('button[aria-label="Unlimited mode"]') as HTMLElement;
      t.scrollIntoView({ block: "center" });
      t.focus();
    });
    await page.keyboard.press("Space");
    await new Promise((r) => setTimeout(r, 900));
  }
  const final = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      (b.textContent || "").trim().startsWith("Generate")
    );
    return (btn?.textContent || "").trim();
  });
  throw new Error(`Refusing to submit — Unlimited is not on (button reads "${final}"). No credits were spent.`);
}

/** Absolute path on disk for an /oss/<file> URL, so we can use the file input. */
function ossPathFor(url: string): string | null {
  const m = url.match(/\/oss\/([^/?#]+)$/);
  if (!m) return null;
  const dir =
    process.env.OSS_DIR ||
    (process.env.VERCEL ? "/tmp/zinema-data/oss" : path.join(process.cwd(), "data", "oss"));
  const p = path.join(dir, m[1]);
  return fs.existsSync(p) ? p : null;
}

/**
 * Prove the saved session actually signs in — launches headless Chrome, loads
 * the video page, and reports whether the composer rendered (signed in) or a
 * login wall did. No generation, so it costs nothing.
 */
export async function checkBrowserSession(): Promise<{ ok: boolean; signedIn: boolean; detail: string }> {
  const { browser, page } = await openSession();
  try {
    await page.goto(VIDEO_URL, { waitUntil: "domcontentloaded", timeout: 120_000 });
    const composer = await page
      .waitForSelector('div[contenteditable="true"]', { timeout: 45_000 })
      .then(() => true)
      .catch(() => false);
    const bodyText: string = await page.evaluate(() => document.body.innerText.slice(0, 3000));
    const loginWall = /log in|sign in/i.test(bodyText) && !composer;
    const signedIn = composer && !loginWall;
    if (signedIn) noteOk();
    else noteError("session check: not signed in");
    return {
      ok: true,
      signedIn,
      detail: signedIn ? "composer present, signed in" : "no composer / login wall"
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    noteError(msg);
    return { ok: false, signedIn: false, detail: msg };
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * Animate one shot on the user's own plan, at no credit cost.
 * `framePath` is a local image; the clip is downloaded into OSS and returned.
 */
export async function generateVideoViaBrowser(input: {
  prompt: string;
  frameUrl: string;
  /** Optional second image — Higgsfield treats extra frames as end/reference. */
  endFrameUrl?: string;
  durationSeconds?: number;
  /** How long to wait for the render before giving up (default 20 min). */
  timeoutMs?: number;
}): Promise<{ url: string; relPath: string }> {
  const framePath = ossPathFor(input.frameUrl);
  if (!framePath) throw new Error("Browser path needs a local frame file (an /oss/ image).");
  const endPath = input.endFrameUrl ? ossPathFor(input.endFrameUrl) : null;

  const { browser, page } = await openSession();
  try {
    await page.goto(VIDEO_URL, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForComposer(page);

    // Signed out → the composer never appears with a usable account state.
    const signedOut = await page.evaluate(() =>
      /log in|sign in/i.test(document.body.innerText.slice(0, 4000))
    );
    if (signedOut) throw new Error("Higgsfield session expired — re-capture your cookies.");

    // Note every clip already on the page so we can spot the new one later.
    const before: string[] = await page.evaluate(() =>
      [...document.querySelectorAll("video")].map((v) => v.src || v.currentSrc).filter(Boolean)
    );

    // Attach the frame through the file input — this bypasses the asset
    // picker's eligibility gate entirely.
    const input$ = await page.$('input[type="file"]');
    if (!input$) throw new Error("Could not find Higgsfield's file input for the frame.");
    if (endPath) await input$.uploadFile(framePath, endPath);
    else await input$.uploadFile(framePath);
    await new Promise((r) => setTimeout(r, 6000));

    await setPrompt(page, input.prompt);
    await enforceUnlimited(page);

    // Submit only after the button has proven it is the free path.
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        (b.textContent || "").trim().startsWith("Generate")
      ) as HTMLButtonElement;
      btn.click();
    });

    // Poll for a video element that wasn't there before.
    const deadline = Date.now() + (input.timeoutMs ?? 20 * 60_000);
    let fresh: string | null = null;
    while (Date.now() < deadline && !fresh) {
      await new Promise((r) => setTimeout(r, 8000));
      const state = await page.evaluate((seen: string[]) => {
        const urls = [...document.querySelectorAll("video")]
          .map((v) => v.src || v.currentSrc)
          .filter((u) => u && !seen.includes(u) && /user_/.test(u));
        const text = document.body.innerText;
        return { url: urls[0] ?? null, nsfw: /NSFW/.test(text), busy: /Generating|Processing|Queued/.test(text) };
      }, before);
      if (state.nsfw) throw new Error("Higgsfield rejected the shot as NSFW (credits are refunded).");
      if (state.url) fresh = state.url;
    }
    if (!fresh) throw new Error("Higgsfield render timed out.");

    const saved = await writeRemoteToOss(fresh, "video");
    noteOk();
    return saved;
  } catch (err) {
    noteError(err instanceof Error ? err.message : String(err));
    throw err;
  } finally {
    await browser.close().catch(() => {});
  }
}
