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
import puppeteerCore, { type Browser, type Page, type HTTPRequest } from "puppeteer-core";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// puppeteer-extra-plugin-stealth patches the automation tells (navigator.webdriver,
// the HeadlessChrome UA flag, missing plugins/chrome.runtime, WebGL vendor) that
// DataDome and Clerk's Frontend API use to reject a headless browser. Our VPS IP
// is NOT blocked (the page loads), so a rejected fingerprint is the likely reason
// the session won't authenticate headlessly — this addresses that directly.
const puppeteer = addExtra(puppeteerCore as never);
puppeteer.use(StealthPlugin());
import { getDb } from "../db/client";
import { writeRemoteToOss } from "./mcp";

const VIDEO_URL = "https://higgsfield.ai/ai/video";
// Image page. These model slugs all carry Unlimited (plan-included, zero credit)
// on this account — confirmed live from the model picker. seedream_v5_lite is
// the default: fast, high detail, Unlimited.
const IMAGE_URL = "https://higgsfield.ai/ai/image";
const UNLIMITED_IMAGE_MODELS = [
  "seedream_v5_lite",
  "seedream_v4_5",
  "nano-banana",
  "kling_o1",
  "flux_2_pro",
  "gpt_image"
];
const DEFAULT_IMAGE_MODEL = "seedream_v5_lite";

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

/**
 * When HIGGS_CDP_URL is set, drive the real, already-logged-in Chrome window
 * on the VPS (the one reachable over VNC) via Chrome DevTools Protocol instead
 * of launching a throwaway headless browser. Real, headed, human-authenticated
 * — nothing to fingerprint or replay. We open a NEW TAB per call and close only
 * that tab afterward; the shared browser process (and the user's visible
 * session) is never touched by `browser.close()`.
 */
async function openLiveSession(cdpUrl: string): Promise<{ browser: Browser; page: Page; live: true }> {
  const browser = await puppeteerCore.connect({ browserURL: cdpUrl, defaultViewport: null });
  const page = await browser.newPage();
  return { browser, page, live: true };
}

async function openSession(): Promise<{ browser: Browser; page: Page; live: boolean }> {
  const cdpUrl = (process.env.HIGGS_CDP_URL || "").trim();
  if (cdpUrl) return openLiveSession(cdpUrl);

  const r = row();
  if (!r) throw new Error("No Higgsfield browser session saved — add your cookies in the Key Vault.");
  const cookies: HiggsfieldCookie[] = JSON.parse(r.cookies);
  if (!cookies.length) throw new Error("Saved Higgsfield session is empty — re-capture your cookies.");

  // Residential proxy defeats the DataDome datacenter-IP bot-wall. HIGGS_PROXY =
  // "host:port"; optional HIGGS_PROXY_USER / HIGGS_PROXY_PASS for authenticated
  // (e.g. IPRoyal) endpoints. Absent → direct (will hit the CAPTCHA on a VPS IP).
  const proxy = (process.env.HIGGS_PROXY || "").trim();
  const proxyUser = process.env.HIGGS_PROXY_USER;
  const proxyPass = process.env.HIGGS_PROXY_PASS;
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1600,1000",
      ...(proxy ? [`--proxy-server=${proxy}`] : [])
    ],
    defaultViewport: { width: 1600, height: 1000 }
  });
  const page = await browser.newPage();
  if (proxy && proxyUser) {
    await page.authenticate({ username: proxyUser, password: proxyPass || "" });
  }
  // Conserve proxy bandwidth: block heavy byte payloads (images/media/fonts).
  // Result detection only reads img.src (the DOM attribute is set even when the
  // byte-load is aborted), and the winning frame is downloaded server-side
  // straight from CloudFront — not through the proxy. So this costs us nothing.
  if (process.env.HIGGS_LEAN !== "0") {
    await page.setRequestInterception(true);
    page.on("request", (req: HTTPRequest) => {
      const t = req.resourceType();
      if (t === "image" || t === "media" || t === "font") req.abort().catch(() => {});
      else req.continue().catch(() => {});
    });
  }
  // cf_clearance and datadome are bound to the capturing browser's User-Agent;
  // match a current Windows Chrome UA so the replayed tokens are accepted.
  await page.setUserAgent(
    process.env.HF_UA ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
  );
  // datadome & cf_clearance are bound to the IP (and UA) that earned them. When
  // we egress through a residential proxy, replaying VPS-IP tokens is a mismatch
  // that trips an "Oops"/challenge — so drop them and let the clean residential
  // IP mint fresh ones. Clerk auth cookies (__client/__session/__refresh) are
  // not IP-bound, so they stay.
  const usable = proxy
    ? cookies.filter((c) => !/^(datadome|cf_clearance)$/i.test(c.name))
    : cookies;
  await browser.setCookie(
    ...usable.map((c) => ({
      ...c,
      domain: c.domain ?? ".higgsfield.ai",
      path: c.path ?? "/"
    }))
  );
  return { browser, page, live: false };
}

/** Close a session opened by openSession(). A live (CDP-connected) session
 * only closes the tab we opened and disconnects — the shared, visible Chrome
 * process (and the user's own tabs) must survive. A launched session closes
 * the whole throwaway browser as before. */
async function closeSession(session: { browser: Browser; page: Page; live: boolean }) {
  if (session.live) {
    await session.page.close().catch(() => {});
    await session.browser.disconnect().catch(() => {});
  } else {
    await session.browser.close().catch(() => {});
  }
}

/** True once the composer has rendered (the prompt box exists). */
async function waitForComposer(page: Page) {
  await page.waitForSelector('div[contenteditable="true"]', { timeout: 90_000 });
}

/** Higgsfield periodically runs a dismissible promo banner (e.g. "Seedance 2.5
 * announcement") above the composer. Its CTA button text also starts with
 * "Unlimited", which can be mistaken for the real submit button — dismiss it
 * so it's out of the DOM entirely rather than trying to out-regex it. */
async function dismissPromoBanners(page: Page) {
  await page.evaluate(() => {
    document
      .querySelectorAll('button[aria-label^="Dismiss"]')
      .forEach((b) => (b as HTMLElement).click());
  });
}

/**
 * Replace the contenteditable prompt. ctrl+A does not work here. Higgsfield
 * autosaves an unsent draft (persists even across a fresh tab), so a naive
 * select-all+delete can leave old text behind — the previous version only
 * checked that the NEW text was present, not that the OLD text was gone,
 * which let a stale draft silently concatenate onto every new prompt
 * (verified live: a leopard prompt rendered as an apple because 3+ prior
 * prompts were still sitting in the field). Verify an EXACT match, and fall
 * back to a hard DOM clear if the soft clear didn't fully take.
 */
async function setPrompt(page: Page, prompt: string) {
  const exact = await page.evaluate((text: string) => {
    const el = document.querySelector('div[contenteditable="true"]') as HTMLElement;
    if (!el) return false;
    const clearAndInsert = () => {
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("delete", false);
    };
    clearAndInsert();
    if ((el.textContent || "").trim().length > 0) {
      // Soft clear left residue (stale autosaved draft) — force it.
      el.textContent = "";
      el.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }
    document.execCommand("insertText", false, text);
    return (el.textContent || "").trim() === text.trim();
  }, prompt);
  if (!exact) {
    // Fallback: real keystrokes, after one more forced clear.
    await page.evaluate(() => {
      const el = document.querySelector('div[contenteditable="true"]') as HTMLElement;
      if (el) {
        el.textContent = "";
        el.dispatchEvent(new InputEvent("input", { bubbles: true }));
        el.focus();
      }
    });
    await page.keyboard.type(prompt, { delay: 0 });
  }
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
 * Image page: flip Unlimited and prove it. Ground truth here is the submit
 * button reading "Unlimited<count>" (e.g. "Unlimited1") rather than
 * "Generate<count>" — the count is the number of images, not a credit charge.
 * Synthetic PointerEvents flip the DOM attribute but React's controlled switch
 * reverts within ~1s (verified live), so submit fires on a paid "Generate" —
 * exactly the intermittent VPS failure. A TRUSTED gesture sticks: focus the
 * switch and press Space (it's a role=switch button). Retry loop guards the
 * occasional bounce.
 */
async function enforceUnlimitedImage(page: Page) {
  const hasSwitch = await page
    .waitForSelector("[role=switch]", { timeout: 25_000 })
    .then(() => true)
    .catch(() => false);
  if (!hasSwitch) {
    const snippet: string = await page.evaluate(() => document.body.innerText.slice(0, 300).replace(/\s+/g, " "));
    throw new Error(`Unlimited toggle never appeared on the image page (saw: "${snippet}").`);
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const ok = await page.evaluate(() => {
      const sw = document.querySelector("[role=switch]") as HTMLElement | null;
      const btn = [...document.querySelectorAll("button")].find((b) =>
        /^(Generate|Unlimited)\d*$/.test((b.textContent || "").trim())
      );
      const label = (btn?.textContent || "").trim().replace(/\s+/g, "");
      return !!sw && sw.getAttribute("aria-checked") === "true" && /^Unlimited\d*$/.test(label);
    });
    if (ok) return;
    // Scroll into view + focus in-page, then send a TRUSTED Space via CDP.
    await page.evaluate(() => {
      const sw = document.querySelector("[role=switch]") as HTMLElement;
      sw.scrollIntoView({ block: "center" });
      sw.focus();
    });
    await page.focus("[role=switch]").catch(() => {});
    await page.keyboard.press("Space");
    await new Promise((r) => setTimeout(r, 800));
  }
  const label = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /^(Generate|Unlimited)\d*$/.test((b.textContent || "").trim())
    );
    return (btn?.textContent || "").trim();
  });
  // Snapshot + surface why the composer button was missing (CAPTCHA wall vs slow
  // load), so the enforce-refuse path is as diagnosable as the timeout path.
  await page.screenshot({ path: "/tmp/higgs-fail.png", fullPage: false }).catch(() => {});
  const wall = await page.evaluate(() => {
    const t = document.body.innerText;
    const hits = ["verification required", "unusual activity", "captcha", "robot", "retry", "sign in", "log in"]
      .filter((w) => new RegExp(w, "i").test(t));
    return hits.join(",");
  });
  throw new Error(
    `Refusing to submit image — Unlimited is not on (button reads "${label}"). No credits were spent. wall=${wall}`
  );
}

/**
 * Generate a frame on the user's plan at no credit cost. Prompt-driven, with
 * optional local reference images (character/set locks) attached through the
 * file input. Downloads the result into OSS and returns it.
 */
export async function generateImageViaBrowser(input: {
  prompt: string;
  /** Local reference images (/oss/ paths on disk) — cast/set/prop locks. */
  referencePaths?: string[];
  /** One of UNLIMITED_IMAGE_MODELS; falls back to the default. */
  model?: string;
  timeoutMs?: number;
}): Promise<{ url: string; relPath: string }> {
  const model = UNLIMITED_IMAGE_MODELS.includes(input.model || "") ? input.model! : DEFAULT_IMAGE_MODEL;
  const session = await openSession();
  const { browser, page } = session;
  try {
    await page.goto(`${IMAGE_URL}?model=${model}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForComposer(page);
    await dismissPromoBanners(page);

    const signedOut = await page.evaluate(() => /log in|sign in/i.test(document.body.innerText.slice(0, 4000)));
    if (signedOut) throw new Error("Higgsfield session expired — re-capture your cookies.");

    // The account's History gallery hydrates AFTER load; if we snapshot too
    // early, a pre-existing image counts as "new" and we grab the wrong one.
    // Let the network settle so every existing image is captured in `before`.
    await page.waitForNetworkIdle({ idleTime: 1500, timeout: 30_000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 3000));
    // Higgsfield serves generated images through Cloudflare's resizer:
    //   higgsfield.ai/cdn-cgi/image/<opts>/https://…cloudfront…/user_…
    //   images.higgs.ai/?…&url=<url-encoded cloudfront>
    // Unwrap to the underlying cloudfront object — that's the stable identity
    // AND the full-quality source to download. `canonImg` is injected into the
    // page context for both the before-snapshot and the poll.
    // Stable identity across EVERY Cloudflare wrapper form. The generated
    // object's filename token `hf_<date>_<time>_<idx>` appears literally in the
    // cdn-cgi path, in the images.higgs.ai url-encoded param, and in the raw
    // cloudfront URL alike (it has no URL-special chars), so it survives the
    // wrapper-token rotation that made plain URL-diffing see every thumbnail as
    // "new". KEYOF extracts it; DLOF unwraps to the full-quality cloudfront URL
    // for download. Both are injected into the page context.
    const KEYOF =
      "(src)=>{try{" +
      "var h=src.match(/hf_[0-9]{6,}_[0-9]{4,}(?:_[0-9]+)?/i);if(h)return h[0];" +
      "var u=src.match(/[?&]url=([^&]+)/);if(u)return decodeURIComponent(u[1]).split('?')[0];" +
      "var c=src.match(/cdn-cgi\\/image\\/.*?\\/(https?:\\/\\/.+)$/);if(c)return c[1].split('?')[0];" +
      "return src.split('?')[0];}catch(e){return src.split('?')[0];}}";
    const DLOF =
      "(src)=>{try{" +
      "var u=src.match(/[?&]url=([^&]+)/);if(u)return decodeURIComponent(u[1]);" +
      "var c=src.match(/cdn-cgi\\/image\\/.*?\\/(https?:\\/\\/.+)$/);if(c)return c[1];" +
      "return src;}catch(e){return src;}}";
    const GEN = "/hf_|cloudfront|d8j0n|user_/";
    const before: string[] = await page.evaluate((keySrc: string, genSrc: string) => {
      const keyOf = eval(keySrc) as (s: string) => string;
      const gen = eval(genSrc) as RegExp;
      return [...document.querySelectorAll("img")]
        .map((i) => keyOf(i.src))
        .filter((s) => gen.test(s));
    }, KEYOF, GEN);

    // Attach reference images (locks) if any are on disk.
    const refs = (input.referencePaths || []).map((p) => ossPathFor(p)).filter((p): p is string => !!p).slice(0, 3);
    if (refs.length) {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile(...refs);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    await setPrompt(page, input.prompt);
    await enforceUnlimitedImage(page);

    // Submit and capture the exact composer state at click time — proves the
    // prompt actually took and the button was the Unlimited one (not a paid
    // Generate). Logged so a "nothing generated" run is diagnosable.
    const preClick = await page.evaluate(() => {
      const el = document.querySelector('div[contenteditable="true"]') as HTMLElement | null;
      const btn = [...document.querySelectorAll("button")].find((b) =>
        /^Unlimited\d*$/.test((b.textContent || "").trim())
      ) as HTMLButtonElement | undefined;
      return { promptLen: (el?.textContent || "").length, label: (btn?.textContent || "").trim(), disabled: btn ? btn.disabled : null };
    });
    // A real Puppeteer click (via CDP mouse events) is a TRUSTED gesture — a
    // synthetic el.click() from inside page.evaluate() is not, and (like the
    // Unlimited toggle above) the submit handler silently no-ops on it.
    let clicked = false;
    if (!preClick.disabled) {
      const handle = await page.evaluateHandle(() =>
        [...document.querySelectorAll("button")].find((b) => /^Unlimited\d*$/.test((b.textContent || "").trim())) ?? null
      );
      const el = handle.asElement() as import("puppeteer-core").ElementHandle<Element> | null;
      if (el) {
        await el.click();
        clicked = true;
      }
      await handle.dispose();
    }
    console.log(`[browser.image] submit promptLen=${preClick.promptLen} btn="${preClick.label}" disabled=${preClick.disabled} clicked=${clicked}`);
    // Probe for a "generation started" signal in the first ~12s. NOTE: a bare
    // "%" match is unreliable — the nav shows "30% OFF" — so look for explicit
    // progress words only. Also snapshot the post-submit composer so we can SEE
    // whether a render actually began, a CAPTCHA appeared, or nothing happened —
    // without waiting the full timeout.
    await new Promise((r) => setTimeout(r, 8000));
    const started = await page.evaluate(() => {
      const t = document.body.innerText;
      const progress = /generating|processing|queued|in progress|in queue|rendering/i.test(t);
      const captcha = /verification required|unusual activity|captcha|are you a robot/i.test(t);
      return { progress, captcha };
    });
    await page.screenshot({ path: "/tmp/higgs-submit.png", fullPage: false }).catch(() => {});
    console.log(`[browser.image] post-submit progress=${started.progress} captcha=${started.captcha}`);

    const deadline = Date.now() + (input.timeoutMs ?? 6 * 60_000);
    let fresh: string | null = null;
    let candidate: string | null = null;
    while (Date.now() < deadline && !fresh) {
      await new Promise((r) => setTimeout(r, 5000));
      // Returns the full src (with query, needed to download) plus its stable
      // path used for the not-in-`before` and confirm-twice checks.
      const state = await page.evaluate(
        (seen: string[], keySrc: string, dlSrc: string, genSrc: string) => {
          const keyOf = eval(keySrc) as (s: string) => string;
          const dlOf = eval(dlSrc) as (s: string) => string;
          const gen = eval(genSrc) as RegExp;
          const img = [...document.querySelectorAll("img")].find((i) => {
            const k = keyOf(i.src);
            return gen.test(k) && !seen.includes(k);
          }) as HTMLImageElement | undefined;
          return {
            path: img ? keyOf(img.src) : null, // stable identity for confirm-twice
            src: img ? dlOf(img.src) : null, // full-quality URL to download
            nsfw: /NSFW/.test(document.body.innerText)
          };
        },
        before,
        KEYOF,
        DLOF,
        GEN
      );
      if (state.nsfw) throw new Error("Higgsfield rejected the frame as NSFW (credits are refunded).");
      // Confirm the same new image path twice running — a generating tile shows
      // a placeholder before the final image settles.
      if (state.path && state.path === candidate) fresh = state.src;
      else candidate = state.path;
    }
    if (!fresh) {
      // Diagnose: dump what images the page actually shows so the src pattern
      // can be corrected instead of guessed.
      const diag = await page.evaluate((seen: string[], keySrc: string, genSrc: string) => {
        const keyOf = eval(keySrc) as (s: string) => string;
        const gen = eval(genSrc) as RegExp;
        const all = [...document.querySelectorAll("img")].map((i) => i.src);
        const keys = all.map(keyOf).filter((k) => gen.test(k));
        const freshKeys = keys.filter((k) => !seen.includes(k));
        return `imgs=${all.length} genKeys=${keys.length} freshKeys=${freshKeys.length} sampleKeys=${[...new Set(freshKeys)].slice(0, 4).join(",")} seen=${seen.slice(0, 2).join(",")}`;
      }, before, KEYOF, GEN);
      // Save a screenshot + surface any error/limit/login/captcha text so we can
      // SEE why headless produced no frame (bot-wall, toast, disabled button…).
      await page.screenshot({ path: "/tmp/higgs-fail.png", fullPage: false }).catch(() => {});
      const wall = await page.evaluate(() => {
        const t = document.body.innerText;
        const hits = ["error", "failed", "limit", "sign in", "log in", "verify", "captcha", "robot", "try again", "too many"]
          .filter((w) => new RegExp(w, "i").test(t));
        return { hits, snippet: t.replace(/\s+/g, " ").slice(0, 400) };
      });
      console.log(`[browser.image] timeout wall=${wall.hits.join(",")} snippet="${wall.snippet}"`);
      throw new Error("Higgsfield image render timed out. " + diag + " wall=" + wall.hits.join(","));
    }

    const saved = await writeRemoteToOss(fresh, "image");
    noteOk();
    return saved;
  } catch (err) {
    noteError(err instanceof Error ? err.message : String(err));
    throw err;
  } finally {
    await closeSession(session);
  }
}

/**
 * Prove the saved session actually signs in — launches headless Chrome, loads
 * the video page, and reports whether the composer rendered (signed in) or a
 * login wall did. No generation, so it costs nothing.
 */
export async function checkBrowserSession(): Promise<{ ok: boolean; signedIn: boolean; detail: string; diag?: string; clerkCookiePresent?: boolean }> {
  const session = await openSession();
  const { browser, page } = session;
  try {
    // Warm the homepage first — Clerk's client JS mints a fresh __session from
    // the __refresh cookie on load, which the deep app pages then rely on.
    await page.goto("https://higgsfield.ai/", { waitUntil: "networkidle2", timeout: 120_000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 4000));
    await page.goto(VIDEO_URL, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page
      .waitForSelector('div[contenteditable="true"]', { timeout: 45_000 })
      .catch(() => null);
    // The prompt box renders even when logged out, so it does NOT prove a
    // session. The honest signal is the top-nav: logged-out shows Login / Sign
    // up buttons; logged-in shows the account menu instead.
    const signedIn: boolean = await page.evaluate(() => {
      const els = [...document.querySelectorAll("a,button")];
      const loggedOut = els.some((el) => {
        const t = (el.textContent || "").trim().toLowerCase();
        return t === "login" || t === "log in" || t === "sign up" || t === "sign in";
      });
      // Signed-in nav shows Assets + an account/avatar control (and Upgrade for
      // non-premium). The Unlimited toggle differs by page, so the nav is the
      // reliable signal — not the toggle element.
      const loggedIn = els.some((el) => {
        const t = (el.textContent || "").trim().toLowerCase();
        return t === "assets" || t.startsWith("upgrade");
      });
      return loggedIn && !loggedOut;
    });
    const diag: string = await page.evaluate(() => {
      const title = document.title;
      const nav = [...document.querySelectorAll("a,button")]
        .map((e) => (e.textContent || "").trim())
        .filter((t) => /login|sign up|sign in|assets|upgrade|account/i.test(t))
        .slice(0, 8)
        .join(" | ");
      return `title="${title}" nav=[${nav}]`;
    });
    const r = row();
    const names = r ? (JSON.parse(r.cookies) as Array<{ name: string }>).map((c) => c.name) : [];
    const clerkCookiePresent = names.some((n) => n.startsWith("__client") && !n.startsWith("__client_uat"));
    if (signedIn) noteOk();
    else noteError("not signed in :: " + diag + " :: clerkCookie=" + clerkCookiePresent);
    return {
      ok: true,
      signedIn,
      detail: signedIn ? "composer present, signed in" : "no composer / login wall",
      diag,
      clerkCookiePresent
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    noteError(msg);
    return { ok: false, signedIn: false, detail: msg };
  } finally {
    await closeSession(session);
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

  const session = await openSession();
  const { browser, page } = session;
  try {
    await page.goto(VIDEO_URL, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForComposer(page);
    await dismissPromoBanners(page);

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

    // Submit only after the button has proven it is the free path. A real
    // Puppeteer click (trusted, via CDP mouse events) is required — see the
    // matching comment in generateImageViaBrowser.
    const submitHandle = await page.evaluateHandle(() =>
      [...document.querySelectorAll("button")].find((b) => (b.textContent || "").trim().replace(/\s+/g, "") === "GenerateUnlimited") ?? null
    );
    const submitEl = submitHandle.asElement() as import("puppeteer-core").ElementHandle<Element> | null;
    if (submitEl) await submitEl.click();
    await submitHandle.dispose();

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
    await closeSession(session);
  }
}
