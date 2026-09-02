const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const assert = require("node:assert/strict");
require("./register-typescript.cjs");

async function main() {
  const root = path.resolve(__dirname, "..");
  const output = path.join(root, "artifacts/direkta-h3-audit/ui");
  fs.mkdirSync(output, { recursive: true });
  const work = fs.mkdtempSync(path.join(output, "fixture-"));
  process.env.DATA_DIR = work; process.env.OSS_DIR = work;
  const { getDb } = require("../lib/db/client.ts");
  const { exportVideoFrame, ossFile } = require("../lib/media/video-frames.ts");
  const db = getDb();
  const source = path.join(root, "artifacts/direkta-h3-audit/existing-clips/hoodie-shot-1.mp4");
  fs.copyFileSync(source, path.join(work, "qa.mp4"));
  exportVideoFrame(source, path.join(work, "qa.png"), 0);
  db.prepare("INSERT INTO projects (id,title,aspect_ratio,script,script_submitted) VALUES ('h3-ui','H3 Engineering QA','9:16','Local offline QA fixture',1)").run();
  db.prepare("INSERT INTO characters (id,project_id,name,soul_id_state) VALUES ('qa-character','h3-ui','QA subject','trained')").run();
  for (let i = 1; i <= 2; i++) {
    db.prepare("INSERT INTO beats (id,project_id,n,title,direction) VALUES (?,?,?,?,?)").run(`qa-beat-${i}`, "h3-ui", i, `QA shot ${i}`, "One small natural movement. Locked camera.");
    db.prepare("INSERT INTO assets (id,target_kind,target_id,kind,url) VALUES (?,?,?,?,?)").run(`qa-frame-${i}`, "storyboard_variant", `qa-variant-${i}`, "image", "/oss/qa.png");
    db.prepare("INSERT INTO storyboard_variants (id,beat_id,n,asset_id,state) VALUES (?,?,1,?,'complete')").run(`qa-variant-${i}`, `qa-beat-${i}`, `qa-frame-${i}`);
    db.prepare("INSERT INTO storyboard_rows (beat_id,selected_variant_id,state) VALUES (?,?,'complete')").run(`qa-beat-${i}`, `qa-variant-${i}`);
    db.prepare("INSERT INTO assets (id,target_kind,target_id,kind,url) VALUES (?,?,?,?,?)").run(`qa-clip-${i}`, "stitch_clip", `h3-ui-${i}`, "video", "/oss/qa.mp4");
    db.prepare("INSERT INTO stitch_nodes (id,project_id,beat_id,x,y,duration,variant_id,clip_asset_id,clip_state) VALUES (?,?,?,?,?,5,?,?,'complete')").run(`h3-ui-${i}`, "h3-ui", `qa-beat-${i}`, 80 + (i - 1) * 280, 100, `qa-variant-${i}`, `qa-clip-${i}`);
  }
  db.close();
  const reservation = http.createServer();
  await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root, windowsHide: true,
    env: { ...process.env, DATA_DIR: work, OSS_DIR: work, RUNPOD_API_KEY: "", RUNPOD_H3_POD_ID: "", TEMP: work, TMP: work },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let serverLog = "";
  server.stdout.on("data", (d) => { serverLog += d.toString(); });
  server.stderr.on("data", (d) => { serverLog += d.toString(); });
  let browser;
  let page;
  const pageErrors = [];
  let forbiddenGenerationAttempts = 0;
  try {
    let online = false;
    for (let i = 0; i < 40; i++) {
      try { if ((await fetch(base + "/api/projects")).ok) { online = true; break; } } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!online) throw new Error("QA server did not become ready: " + serverLog.slice(-500));
    browser = await require("puppeteer-core").launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, userDataDir: path.join(work, "chrome"), args: ["--no-first-run", "--disable-background-networking", "--disable-sync"] });
    page = await browser.newPage();
    page.on("pageerror", (e) => pageErrors.push(e.message));
    await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = request.url();
      if (/\/animate(?:\?|$)/.test(url) && request.method() === "POST" && !JSON.parse(request.postData() || "{}").dryRun) { forbiddenGenerationAttempts++; return request.abort(); }
      if (url.startsWith(base) || /^(file:|data:|blob:)/.test(url)) return request.continue();
      return request.abort();
    });
    await page.goto(pathToFileURL(path.join(root, "artifacts/mahabharat/reference-review.html")).href, { waitUntil: "networkidle0" });
    assert.equal(await page.$$eval(".card", (cards) => cards.length), 18);
    assert.equal(await page.$eval("#count", (el) => el.textContent), "16 selected · 0 renders");
    await page.select("#filter", "alternate");
    assert.equal(await page.$$eval(".card", (cards) => cards.length), 2);
    await page.select("#filter", "all");
    await page.screenshot({ path: path.join(output, "reference-review-desktop.png"), fullPage: false });
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: path.join(output, "reference-review-mobile.png"), fullPage: false });

    await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
    await page.goto(base + "/?p=h3-ui&ws=stitch", { waitUntil: "networkidle0" });
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "Graph"));
    await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Graph").click());
    await page.waitForSelector('[data-id="h3-ui-2"]', { timeout: 15000 });
    await page.click('[data-id="h3-ui-2"] .stitch-node');
    await page.waitForSelector("aside select");
    const h3Id = require("../lib/higgsfield/catalog.ts").VIDEO_MODELS.find((m) => m.provider === "minimax_h3").id;
    await page.evaluate((id) => {
      const select = [...document.querySelectorAll("aside select")].find((s) => [...s.options].some((o) => o.value === id));
      if (!select) throw new Error("H3 model picker was not found");
      select.value = id; select.dispatchEvent(new Event("change", { bubbles: true }));
    }, h3Id);
    await page.waitForSelector('[aria-label="H3 shot continuity"]');
    await page.waitForFunction(() => document.body.textContent.includes("is not set"));
    const blocked = await page.evaluate(() => [...document.querySelectorAll("aside button")].find((b) => /Re-roll clip|Generate clip/.test(b.textContent))?.disabled);
    assert.equal(blocked, true, "Missing RunPod config must block generation in the UI");
    await page.select('[aria-label="H3 shot continuity"]', "continue");
    const dryRun = await page.evaluate(async (model) => {
      const res = await fetch("/api/stitch/nodes/h3-ui-2/animate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model, continuityMode: "continue", dryRun: true }) });
      return { status: res.status, data: await res.json() };
    }, h3Id);
    assert.equal(dryRun.status, 200, JSON.stringify(dryRun.data));
    assert.ok(dryRun.data.references.first);
    await page.$eval('[aria-label="H3 shot continuity"]', (el) => el.scrollIntoView({ block: "center" }));
    await page.screenshot({ path: path.join(output, "stitch-h3-controls.png"), fullPage: false });

    await page.evaluate(() => [...document.querySelectorAll("aside summary")].find((el) => el.textContent.includes("Inspect / export")).click());
    await page.waitForFunction(() => document.querySelector('[aria-label="Still frame index"]')?.max === "123");
    await page.focus('[aria-label="Still frame index"]');
    await page.keyboard.press("End");
    const exportResponse = page.waitForResponse((res) => res.url().endsWith("/h3-ui-2/frame") && res.request().method() === "POST");
    await page.evaluate(() => [...document.querySelectorAll("aside button")].find((b) => b.textContent.includes("Export 1080p PNG")).click());
    const exported = await (await exportResponse).json();
    assert.equal(exported.frame, 123);
    const png = fs.readFileSync(ossFile(exported.url, work));
    assert.equal(png.readUInt32BE(16), 1080); assert.equal(png.readUInt32BE(20), 1920);
    await page.waitForFunction(() => document.body.textContent.includes("Download exported frame"));
    assert.equal(forbiddenGenerationAttempts, 0);
    assert.deepEqual(pageErrors, []);
    fs.writeFileSync(path.join(output, "result.json"), JSON.stringify({ ok: true, galleryCards: 18, gallerySelected: 16, mobileOverflow: false, generationBlockedWithoutConfig: blocked, continuationDryRun: dryRun.status, exportedFrame: exported.frame, exportSize: [1080, 1920], forbiddenGenerationAttempts, pageErrors, paidGeneration: false }, null, 2));
    console.log("Browser QA passed: gallery desktop/mobile, H3 continuity and budget UI, safe dry-run, and frame-123 export. No paid generation.");
  } catch (error) {
    if (page) {
      await page.screenshot({ path: path.join(output, "failure.png"), fullPage: false }).catch(() => {});
      const state = await page.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(0, 10000) })).catch(() => ({}));
      fs.writeFileSync(path.join(output, "failure.json"), JSON.stringify({ ...state, pageErrors, error: String(error) }, null, 2));
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    server.kill();
    await new Promise((resolve) => { if (server.exitCode !== null) resolve(); else { server.once("exit", resolve); setTimeout(resolve, 2000); } });
    fs.writeFileSync(path.join(output, "server.log"), serverLog);
    if (path.resolve(work).startsWith(output + path.sep)) fs.rmSync(work, { recursive: true, force: true });
  }
}
main().catch((e) => { console.error(e.stack); process.exitCode = 1; });
