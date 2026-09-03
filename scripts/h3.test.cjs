const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
require("./register-typescript.cjs");

const auditRoot = path.resolve(__dirname, "../artifacts/direkta-h3-audit");
fs.mkdirSync(auditRoot, { recursive: true });
const work = fs.mkdtempSync(path.join(auditRoot, "tests-"));
process.env.OSS_DIR = work;
process.env.DATA_DIR = work;
process.env.RUNPOD_API_KEY = "test-key-never-sent-to-network";
process.env.RUNPOD_H3_POD_ID = "test-pod";
// A missing mock must fail, never reach a paid service.
global.fetch = async () => { throw new Error("Unexpected network request in offline H3 tests"); };
const settings = require("../lib/agents/h3-settings.ts");
const workflow = require("../lib/agents/h3-workflow.ts");
const workflow_mod = workflow;
const frames = require("../lib/media/video-frames.ts");
const h3 = require("../lib/agents/minimax-h3.ts");
const prompts = require("../lib/agents/h3-prompt-expander.ts");
const assembly = require("../lib/mcp/stitch.ts");
const { getDb } = require("../lib/db/client.ts");

function ff(args) {
  const r = spawnSync(process.env.FFMPEG_PATH || "ffmpeg", ["-v", "error", "-y", ...args], { encoding: "utf8", timeout: 30_000 });
  assert.equal(r.status, 0, r.stderr || r.error?.message);
}
const clip = path.join(work, "source.mp4");
const audio = path.join(work, "audio.wav");
const still = path.join(work, "source.png");
ff(["-f", "lavfi", "-i", "testsrc2=size=96x64:rate=24:duration=3", "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p", clip]);
ff(["-f", "lavfi", "-i", "sine=frequency=440:duration=3", audio]);
ff(["-i", clip, "-frames:v", "1", still]);
function pixels(file) {
  const result = spawnSync(process.env.FFMPEG_PATH || "ffmpeg", ["-v", "error", "-i", file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], { timeout: 30_000, maxBuffer: 16 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr?.toString());
  return result.stdout;
}
function mockPod(t, options = {}) {
  const calls = [];
  const submitted = [];
  const uploads = [];
  let state = options.warm === false ? "EXITED" : "RUNNING";
  const previousFetch = global.fetch;
  const json = (value) => new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });
  global.fetch = async (input, init = {}) => {
    const url = String(input);
    calls.push({ url, method: init.method || "GET" });
    if (url.endsWith("/graphql")) return json(options.badBalance ? { errors: [{ message: "denied" }] } : { data: { myself: { clientBalance: options.balance ?? 100 } } });
    if (url.endsWith("/system_stats")) return new Response("{}", { status: options.warm === false ? 503 : 200 });
    if (url.endsWith("/pods/test-pod")) return json({ desiredStatus: state, adjustedCostPerHr: 1.39, ports: ["8188/http", "22/tcp"] });
    if (url.endsWith("/pods/test-pod/start")) { if (options.startError) throw new Error("capacity unavailable"); throw new Error("Tests must not reach SSH bootstrap"); }
    if (url.endsWith("/pods/test-pod/stop")) { state = "EXITED"; return new Response(null, { status: 204 }); }
    if (url.endsWith("/queue")) return json({ queue_running: options.busy ? [[1, "other-job"]] : [], queue_pending: [] });
    if (url.endsWith("/upload/image")) { const file = init.body.get("image"); uploads.push(Buffer.from(await file.arrayBuffer())); return json({ name: file.name }); }
    if (url.endsWith("/prompt")) { submitted.push(JSON.parse(init.body).prompt); return json({ prompt_id: "job" }); }
    if (url.endsWith("/history/job")) return json({ job: options.executionError
      ? { status: { status_str: "error", completed: true, messages: [["execution_error", "synthetic terminal error"]] } }
      : { status: { completed: true }, outputs: { "11": { images: [{ filename: "video", subfolder: "", type: "output" }] }, "12": { audio: [{ filename: "audio", subfolder: "", type: "output" }] } } } });
    if (url.includes("/view?filename=video")) return new Response(fs.readFileSync(clip));
    if (url.includes("/view?filename=audio")) return new Response(fs.readFileSync(audio));
    throw new Error(`Unmocked H3 request: ${url}`);
  };
  t.after(() => { global.fetch = previousFetch; });
  return { calls, submitted, uploads };
}

test("base quality, frame grid and the true five-frame still minimum", () => {
  assert.equal(settings.h3Settings().steps, 20);
  assert.equal(settings.h3Settings({ turbo: true }).steps, 8);
  assert.equal(settings.h3Settings().frames, 124);
  assert.equal(settings.h3Settings().durationSeconds, 124 / 24);
  assert.equal(settings.h3Settings({ durationSeconds: 5 / 24 }).frames, 5);
  assert.equal(settings.h3Settings({ durationSeconds: 0.25 }).frames, 22);
  for (const input of [{ durationSeconds: NaN }, { durationSeconds: Infinity }, { durationSeconds: 20 }, { steps: 8 }, { width: 1344, height: 1344 }]) {
    assert.throws(() => settings.h3Settings(input));
  }
});

test("both endpoint images are distinct, connected inputs on fl2va", () => {
  const built = workflow.buildH3Workflow({ prompt: "A locked wide view.", firstFrameName: "start.png", lastFrameName: "end.png", seed: 42 });
  const graph = built.workflow;
  assert.equal(graph["5"].class_type, "MiniMaxH3ImageToVideo");
  for (const [field, expected] of [["first_frame", "start.png"], ["last_frame", "end.png"]]) {
    const [node, port] = graph["5"].inputs[field];
    assert.equal(port, 0);
    assert.equal(graph[node].class_type, "LoadImage");
    assert.equal(graph[node].inputs.image, expected);
  }
  assert.equal(graph["8"].inputs.steps, 20);
  assert.equal(graph["8"].inputs.seed, 42);
  const turbo = workflow.buildH3Workflow({ prompt: "A locked view.", turbo: true, lastFrameName: "end.png", seed: 42 }).workflow;
  assert.equal(turbo["17"].inputs.steps, 8);
  assert.ok(turbo["5"].inputs.last_frame);
});

test("cuts do not inherit frames; continuations and optional endpoint pins are explicit", () => {
  const input = { storyboard: "own.png", previousLastFrame: "previous.png", nextStoryboard: "next.png" };
  assert.deepEqual(settings.h3References({ ...input, mode: "cut" }), { first: "own.png", last: undefined });
  assert.deepEqual(settings.h3References({ ...input, mode: "continue", endFrame: true }), { first: "previous.png", last: "next.png" });
  assert.throws(() => settings.h3References({ mode: "continue", storyboard: "own.png" }), /actual final frame/);
  assert.throws(() => settings.h3References({ ...input, mode: "cut", endFrame: true }), /Continue mode/);
  assert.equal(settings.h3References({ ...input, mode: "cut", explicitLast: "chosen.png" }).last, "chosen.png");
  assert.equal(settings.h3References({ ...input, mode: "continue", explicitLast: "chosen.png", endFrame: false }).last, undefined);
});

test("final-frame extraction matches independently decoded EOF, not the start of the last second", () => {
  const actual = path.join(work, "actual-last.png");
  const expected = path.join(work, "expected-last.png");
  const legacy = path.join(work, "legacy-last.png");
  frames.extractLastVideoFrame(clip, actual);
  ff(["-i", clip, "-vf", "select=eq(n\\,71)", "-frames:v", "1", expected]);
  ff(["-sseof", "-1", "-i", clip, "-frames:v", "1", legacy]);
  assert.ok(pixels(actual).equals(pixels(expected)), "Extracted final frame must match independently decoded EOF pixels");
  assert.ok(!pixels(legacy).equals(pixels(expected)), "The old command should select the wrong point in time");
  const tiny = path.join(work, "five-frames.mp4");
  ff(["-i", clip, "-frames:v", "5", "-c:v", "libx264", tiny]);
  frames.extractLastVideoFrame(tiny, actual);
  ff(["-i", tiny, "-vf", "select=eq(n\\,4)", "-frames:v", "1", expected]);
  assert.ok(pixels(actual).equals(pixels(expected)), "Short clips must also yield their final frame");
});

test("still export uses the selected frame, pads without stretching, and rejects out-of-range frames", () => {
  const info = frames.videoInfo(clip);
  assert.equal(info.frames, 72);
  const output = path.join(work, "padded.png");
  frames.exportVideoFrame(clip, output, 71, { width: 128, height: 72, fit: "contain" });
  const image = pixels(output);
  assert.equal(image.length, 128 * 72 * 3);
  assert.deepEqual([...image.subarray(0, 3)], [0, 0, 0]);
  assert.throws(() => frames.exportVideoFrame(clip, output, 72), /outside/);
  assert.throws(() => frames.ossFile("/oss/../secret", work), /Invalid/);
  assert.throws(() => frames.ossFile("/oss/%2e%2e%5csecret", work), /Invalid/);
});

test("prompt fallback is visible and never leaks the raw provider error", async () => {
  const input = { direction: "My original six-block prompt." };
  const failed = await prompts.prepareH3Prompt(input, async () => { throw new Error("secret provider details"); });
  assert.equal(failed.status, "fallback");
  assert.equal(failed.prompt, input.direction);
  assert.ok(failed.warnings[0].includes("original direction"));
  assert.ok(!failed.warnings[0].includes("secret provider details"));
  assert.equal((await prompts.prepareH3Prompt(input, async () => "  ")).status, "fallback");
  assert.equal((await prompts.prepareH3Prompt(input, async () => "Expanded prompt")).status, "expanded");
});

test("terminal polling errors propagate without another poll", async () => {
  let attempts = 0;
  await assert.rejects(h3.waitFor(async () => { attempts++; throw new Error("terminal render failure"); }, 10000, 1, "generation"), /terminal render failure/);
  assert.equal(attempts, 1);
});

test("batch estimate includes every shot, cold start and reserve", () => {
  const single = settings.estimateH3Spend([{}], 1.39, false);
  const batch = settings.estimateH3Spend([{}, {}], 1.39, true);
  assert.ok(batch.estimatedCostUsd > single.estimatedCostUsd * 2);
  assert.ok(batch.requiredBalanceUsd > batch.estimatedCostUsd);
  assert.throws(() => settings.estimateH3Spend([{}], NaN, true));
});

test("insufficient balance blocks generation before pod startup", async (t) => {
  const mock = mockPod(t, { warm: false, balance: 0.01 });
  await assert.rejects(h3.generateVideoViaMiniMaxH3({ prompt: "Test" }), h3.H3BudgetError);
  assert.ok(!mock.calls.some((c) => /\/(start|stop|prompt)$/.test(c.url)));
});

test("unknown balance fails closed without starting a pod", async (t) => {
  const mock = mockPod(t, { badBalance: true });
  await assert.rejects(h3.generateVideoViaMiniMaxH3({ prompt: "Test" }), /Cannot verify RunPod balance/);
  assert.ok(!mock.calls.some((c) => /\/(start|stop|prompt)$/.test(c.url)));
});

test("startup failures clean up even when keepWarm was requested", async (t) => {
  const mock = mockPod(t, { warm: false, startError: true });
  await assert.rejects(h3.generateVideoViaMiniMaxH3({ prompt: "Test", keepWarm: true }), /capacity unavailable/);
  assert.equal(mock.calls.filter((c) => c.url.endsWith("/stop")).length, 1);
  assert.ok(!fs.existsSync(path.join(work, ".h3-render.lock")));
});

test("ComfyUI errors are immediate and do not become 30-minute timeouts", async (t) => {
  const mock = mockPod(t, { executionError: true });
  await assert.rejects(h3.generateVideoViaMiniMaxH3({ prompt: "Test", keepWarm: true }), /ComfyUI generation failed/);
  assert.equal(mock.calls.filter((c) => c.url.endsWith("/history/job")).length, 1);
  assert.equal(mock.calls.filter((c) => c.url.endsWith("/stop")).length, 1);
});

test("an existing unrelated GPU job is never stopped by a rejected request", async (t) => {
  const mock = mockPod(t, { busy: true });
  await assert.rejects(h3.generateVideoViaMiniMaxH3({ prompt: "Test" }), /already has a queued/);
  assert.ok(!mock.calls.some((c) => c.url.endsWith("/stop")));
});

test("the single-GPU lock rejects concurrent callers and can be released", () => {
  const release = h3.acquireH3RenderLock();
  assert.throws(() => h3.acquireH3RenderLock(), /already active/);
  release();
  h3.acquireH3RenderLock()();
});

test("mocked complete pipeline uploads both normalized references and exports real boundary frames", async (t) => {
  const mock = mockPod(t);
  const result = await h3.generateVideoViaMiniMaxH3({ prompt: "A quiet locked-off view.", width: 96, height: 64, durationSeconds: 3, seed: 123, referenceImageUrl: still, lastFrameImageUrl: still });
  assert.equal(mock.uploads.length, 2);
  for (const png of mock.uploads) {
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), 96);
    assert.equal(png.readUInt32BE(20), 64);
  }
  assert.equal(result.settings.seed, 123);
  assert.equal(result.actual.frames, 72);
  assert.ok(result.prompt.includes("PRODUCTION CONSTRAINTS"));
  const expected = path.join(work, "expected-muxed-last.png");
  ff(["-i", frames.ossFile(result.url, work), "-vf", "select=eq(n\\,71)", "-frames:v", "1", expected]);
  assert.ok(pixels(frames.ossFile(result.lastFrameUrl, work)).equals(pixels(expected)), "Compare against the muxed clip: H.264 encoding is lossy");
  assert.equal(mock.calls.filter((c) => c.url.endsWith("/stop")).length, 1);
});

test("explicit assembly trims remove exactly the reviewed frames", () => {
  const result = assembly.stitchClips([clip, clip], { width: 96, height: 64, transition: "cut", trims: [{ startFrames: 1, endFrames: 2 }, { startFrames: 2, endFrames: 1 }] });
  const info = frames.videoInfo(frames.ossFile(result.url, work));
  assert.equal(info.frames, 138);
  assert.throws(() => assembly.stitchClips([clip], { trims: [{ startFrames: 72 }] }), /all frames/);
  assert.throws(() => assembly.stitchClips([clip], { trims: [{ endFrames: -1 }] }), /non-negative/);
});

test("an over-budget batch starts no shot and releases its lock", async (t) => {
  const mock = mockPod(t);
  await assert.rejects(h3.generateH3Batch([{ prompt: "A" }, { prompt: "B" }], { maxEstimatedCostUsd: 0.01 }), /exceeds/);
  assert.ok(!mock.calls.some((c) => /\/(start|stop|prompt)$/.test(c.url)));
  assert.ok(!fs.existsSync(path.join(work, ".h3-render.lock")));
});

test("a batch keeps its lock across shots, chains actual frames and stops once", async (t) => {
  const mock = mockPod(t);
  const results = await h3.generateH3Batch([
    { prompt: "A", width: 96, height: 64, durationSeconds: 3, referenceImageUrl: still },
    { prompt: "B", width: 96, height: 64, durationSeconds: 3, continuityMode: "continue", lastFrameImageUrl: still }
  ], { maxEstimatedCostUsd: 5, onShot: () => assert.throws(() => h3.acquireH3RenderLock(), /already active/) });
  assert.equal(results.length, 2);
  assert.equal(mock.submitted.length, 2);
  assert.ok(mock.submitted[1]["5"].inputs.first_frame);
  assert.ok(mock.submitted[1]["5"].inputs.last_frame);
  assert.equal(mock.calls.filter((c) => c.url.endsWith("/stop")).length, 1);
});

test("animate dry-run uses timeline order and endpoint flags without an LLM call or GPU request", async () => {
  const db = getDb();
  db.prepare("INSERT INTO projects (id,title,aspect_ratio) VALUES ('h3-test','H3 Test','16:9')").run();
  for (const [id, n, x] of [["a", 10, 0], ["b", 1, 280], ["c", 2, 560]]) {
    // Beat numbers deliberately disagree with timeline order.
    db.prepare("INSERT INTO beats (id,project_id,n,title,direction) VALUES (?,?,?,?,?)").run(`beat-${id}`, "h3-test", n, `Shot ${id}`, `Direction ${id}`);
    db.prepare("INSERT INTO storyboard_variants (id,beat_id,n) VALUES (?,?,1)").run(`variant-${id}`, `beat-${id}`);
    db.prepare("INSERT INTO storyboard_rows (beat_id,selected_variant_id) VALUES (?,?)").run(`beat-${id}`, `variant-${id}`);
    db.prepare("INSERT INTO assets (id,target_kind,target_id,kind,url) VALUES (?,?,?,?,?)").run(`frame-${id}`, "storyboard_variant", `variant-${id}`, "image", "/oss/source.png");
    db.prepare("INSERT INTO assets (id,target_kind,target_id,kind,url) VALUES (?,?,?,?,?)").run(`clip-${id}`, "stitch_clip", `node-${id}`, "video", "/oss/source.mp4");
    db.prepare("INSERT INTO stitch_nodes (id,project_id,beat_id,x,duration,variant_id,clip_asset_id) VALUES (?,?,?,?,?,?,?)").run(`node-${id}`, "h3-test", `beat-${id}`, x, 3, `variant-${id}`, `clip-${id}`);
  }
  const route = require("../app/api/stitch/nodes/[id]/animate/route.ts");
  const id = require("../lib/higgsfield/catalog.ts").VIDEO_MODELS.find((m) => m.provider === "minimax_h3").id;
  const request = (body) => route.POST(new Request("http://localhost/api/stitch/nodes/node-b/animate", { method: "POST", body: JSON.stringify({ model: id, dryRun: true, ...body }) }), { params: Promise.resolve({ id: "node-b" }) });
  const response = await request({ continuityMode: "continue", endFrame: true });
  const preview = await response.json();
  assert.equal(response.status, 200, JSON.stringify(preview));
  assert.equal(preview.references.last, "/oss/source.png");
  assert.match(preview.prompt, /CONTINUES FROM: Direction a/);
  assert.ok(!preview.prompt.includes("CONTINUES FROM: Direction c"));
  const expected = path.join(work, "route-expected.png");
  ff(["-i", clip, "-vf", "select=eq(n\\,71)", "-frames:v", "1", expected]);
  assert.ok(pixels(frames.ossFile(preview.references.first, work)).equals(pixels(expected)));
  const cut = await (await request({ continuityMode: "cut" })).json();
  assert.equal(cut.references.first, "/oss/source.png");
  assert.equal(cut.references.last, undefined);
  assert.ok(!cut.prompt.includes("CONTINUES FROM"));
  assert.equal(db.prepare("SELECT clip_state FROM stitch_nodes WHERE id='node-b'").get().clip_state, "none");
});

test("animate records the submitted H3 prompt, fallback warning and boundary metadata", async (t) => {
  mockPod(t);
  const route = require("../app/api/stitch/nodes/[id]/animate/route.ts");
  const id = require("../lib/higgsfield/catalog.ts").VIDEO_MODELS.find((m) => m.provider === "minimax_h3").id;
  const response = await route.POST(new Request("http://localhost/api/stitch/nodes/node-b/animate", { method: "POST", body: JSON.stringify({ model: id, lastFrameImageUrl: "/oss/source.png" }) }), { params: Promise.resolve({ id: "node-b" }) });
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  assert.equal(result.promptExpansion, "fallback");
  assert.ok(result.warnings.length > 0);
  const asset = getDb().prepare("SELECT a.prompt,a.meta FROM assets a JOIN stitch_nodes sn ON sn.clip_asset_id=a.id WHERE sn.id='node-b'").get();
  assert.match(asset.prompt, /PRODUCTION CONSTRAINTS/);
  const meta = JSON.parse(asset.meta);
  assert.equal(meta.references.last, "/oss/source.png");
  assert.equal(meta.promptExpansion, "fallback");
  assert.equal(meta.actual.frames, 72);
  assert.equal(meta.lastFrameUrl, result.lastFrameUrl);
});

test.after(() => {
  // Only the unique test workspace may be removed, never user assets or DBs.
  try { getDb().close(); } catch { /* not all tests open the database */ }
  if (!path.resolve(work).startsWith(auditRoot + path.sep)) throw new Error("Unsafe test cleanup path");
  fs.rmSync(work, { recursive: true, force: true });
});

test("reference workflow wires all four channels and tags them consistently", () => {
  const { workflow: g, prompt } = workflow.buildH3ReferenceWorkflow({
    prompt: "Kalki turns to face the ridge.",
    mode: "continue",
    references: { images: ["sheet_a.png", "sheet_b.png"], video: "prev.mp4", videoAudio: "prev.mp4", audio: ["score.flac"] }
  });
  const inputs = g["5"].inputs;
  assert.equal(g["1"].inputs.unet_name, "minimax_h3_ref2va_pruned_int8_convrot.safetensors");
  // Autogrow inputs must be dicts; flattened top-level keys are rejected by the node.
  assert.deepEqual(Object.keys(inputs.ref_images), ["ref_image_0", "ref_image_1"]);
  assert.deepEqual(Object.keys(inputs.ref_videos), ["ref_video_0"]);
  assert.deepEqual(Object.keys(inputs.ref_video_audios), ["ref_video_audio_0"]);
  assert.deepEqual(Object.keys(inputs.ref_audios), ["ref_audio_0"]);
  // Frames and soundtrack come off one decode, so they cannot desync.
  assert.equal(inputs.ref_videos.ref_video_0[0], inputs.ref_video_audios.ref_video_audio_0[0]);
  // Prompt tags are 1-based per type and must match the wiring order.
  for (const tag of ["<Picture 1>", "<Picture 2>", "<Video 1>", "<Audio 1>", "<Audio 2>"]) {
    assert.ok(prompt.includes(tag), `missing ${tag}`);
  }
});

test("reference workflow distinguishes a cut from a continuation", () => {
  const cut = workflow.buildH3ReferenceWorkflow({
    prompt: "A new location.", mode: "cut", references: { images: ["a.png"], video: "prev.mp4" }
  }).prompt;
  const cont = workflow.buildH3ReferenceWorkflow({
    prompt: "The same moment continues.", mode: "continue", references: { images: ["a.png"], video: "prev.mp4" }
  }).prompt;
  assert.ok(cut.includes("NEW shot"), "a cut must not ask to continue the previous action");
  assert.ok(cont.includes("IMMEDIATELY PRECEDING SHOT"));
});

test("reference workflow rejects the reference mistakes that cost real GPU time", () => {
  const bad = [
    [{ prompt: "x", mode: "continue", references: { images: ["a.png"] } }, "continue without a previous clip"],
    [{ prompt: "x", references: { images: ["a.png"], videoAudio: "p.mp4" } }, "audio without its video"],
    [{ prompt: "x", references: {} }, "no references at all"],
    [{ prompt: "x", references: { images: Array.from({ length: 10 }, (_, i) => `${i}.png`) } }, "more than 9 images"],
    [{ prompt: "x", references: { video: "p.mp4", videoAudio: "p.mp4", audio: ["a.flac", "b.flac", "c.flac"] } }, "more than 3 audio"]
  ];
  for (const [input, why] of bad) {
    assert.throws(() => workflow.buildH3ReferenceWorkflow(input), undefined, `should reject: ${why}`);
  }
});

test("generation and the live monitor share one ComfyUI client id", () => {
  // ComfyUI addresses progress and preview events to the submitting client_id;
  // a per-submission random id makes live progress structurally unobservable.
  assert.equal(typeof h3.H3_CLIENT_ID, "string");
  assert.ok(h3.H3_CLIENT_ID.length > 0);
  const source = fs.readFileSync(path.resolve(__dirname, "../lib/agents/minimax-h3.ts"), "utf8");
  assert.ok(source.includes("client_id: H3_CLIENT_ID"), "submission must use the shared client id");
  const route = fs.readFileSync(path.resolve(__dirname, "../app/api/minimax-h3/stream/route.ts"), "utf8");
  assert.ok(route.includes("H3_CLIENT_ID"), "the live feed must listen on the same client id");
});

test("assets route returns media and entities in one shape, newest first", async () => {
  const db = getDb();
  db.prepare("INSERT INTO projects (id,title,aspect_ratio) VALUES ('as-test','Assets Test','16:9')").run();
  db.prepare("INSERT INTO beats (id,project_id,n,title,direction) VALUES ('as-b1','as-test',1,'Opening','x')").run();
  db.prepare("INSERT INTO storyboard_variants (id,beat_id,n) VALUES ('as-v1','as-b1',1)").run();
  db.prepare("INSERT INTO assets (id,target_kind,target_id,kind,url,created_at) VALUES ('as-img','storyboard_variant','as-v1','image','/oss/a.png','2026-01-01 00:00:01')").run();
  db.prepare("INSERT INTO assets (id,target_kind,target_id,kind,url,created_at) VALUES ('as-seq','sequence','as-test','video','/oss/a.mp4','2026-01-01 00:00:02')").run();
  db.prepare("INSERT INTO characters (id,project_id,name,role) VALUES ('as-c1','as-test','Kalki','Lead')").run();

  const { GET } = require("../app/api/projects/[id]/assets/route.ts");
  const params = Promise.resolve({ id: "as-test" });

  const all = await (await GET(new Request("http://x/api/projects/as-test/assets"), { params })).json();
  const byId = Object.fromEntries(all.items.map((a) => [a.id, a]));

  assert.ok(byId["as-img"], "storyboard frame missing");
  assert.equal(byId["as-img"].kind, "image");
  // The field the composer needs: which H3 channel this can be wired to.
  assert.equal(byId["as-img"].ref_kind, "image");
  assert.equal(byId["as-img"].title, "Beat 01");

  assert.equal(byId["as-seq"].kind, "video", "a rendered sequence is video regardless of its row kind");
  assert.equal(byId["as-seq"].ref_kind, "video");

  assert.equal(byId["as-c1"].kind, "character");
  assert.equal(byId["as-c1"].title, "Kalki");
  assert.equal(byId["as-c1"].mentionable, true);

  // Media and entities come from different tables, so ordering is done in the
  // route; if that sort is dropped the list interleaves by table instead of time.
  const times = all.items.map((a) => a.created_at);
  assert.deepEqual([...times].sort().reverse(), times, "items must be newest first");
});

test("assets route filters by kind and rejects an unknown one", async () => {
  const { GET } = require("../app/api/projects/[id]/assets/route.ts");
  const params = Promise.resolve({ id: "as-test" });

  const imagesRes = await GET(new Request("http://x/a?kind=image"), { params });
  const images = await imagesRes.json();
  assert.ok(images.items.length > 0);
  assert.ok(images.items.every((a) => a.kind === "image"), "kind=image returned other kinds");

  const chars = await (await GET(new Request("http://x/a?kind=character"), { params })).json();
  assert.ok(chars.items.every((a) => a.kind === "character"));

  const bad = await GET(new Request("http://x/a?kind=banana"), { params });
  assert.equal(bad.status, 400, "an unknown kind must fail loudly, not silently return everything");
});

test("assets route paginates with a cursor that survives identical timestamps", async () => {
  const db = getDb();
  // Same created_at on purpose: a timestamp-only cursor cannot separate these,
  // which is why the cursor carries the id too.
  for (const n of [1, 2, 3]) {
    db.prepare("INSERT INTO characters (id,project_id,name,role) VALUES (?,?,?,?)").run(
      `as-p${n}`, "as-test", `Extra ${n}`, "Background"
    );
  }
  db.prepare("UPDATE characters SET created_at='2026-02-02 00:00:00' WHERE project_id='as-test'").run();

  const { GET } = require("../app/api/projects/[id]/assets/route.ts");
  const params = Promise.resolve({ id: "as-test" });

  const first = await (await GET(new Request("http://x/a?kind=character&limit=2"), { params })).json();
  assert.equal(first.items.length, 2);
  assert.ok(first.next_cursor, "more rows remain, so a cursor must be returned");

  const second = await (
    await GET(new Request(`http://x/a?kind=character&limit=2&cursor=${encodeURIComponent(first.next_cursor)}`), { params })
  ).json();

  const firstIds = first.items.map((a) => a.id);
  const secondIds = second.items.map((a) => a.id);
  assert.equal(firstIds.filter((id) => secondIds.includes(id)).length, 0, "pages must not overlap");
});

test("assets route searches titles and subtitles", async () => {
  const { GET } = require("../app/api/projects/[id]/assets/route.ts");
  const params = Promise.resolve({ id: "as-test" });
  const hit = await (await GET(new Request("http://x/a?q=kalki"), { params })).json();
  assert.ok(hit.items.some((a) => a.title === "Kalki"), "case-insensitive search should match");
  const miss = await (await GET(new Request("http://x/a?q=zzzzz"), { params })).json();
  assert.equal(miss.items.length, 0);
});

test("compose creates a beat-less shot that stores its own direction", async () => {
  const db = getDb();
  db.prepare("INSERT INTO projects (id,title,aspect_ratio) VALUES ('cmp','Compose','16:9')").run();

  const { POST } = require("../app/api/projects/[id]/compose/route.ts");
  const params = Promise.resolve({ id: "cmp" });

  const res = await POST(
    new Request("http://x/c", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "Kalki turns to face the ridge." })
    }),
    { params }
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.node_id);

  const row = db.prepare("SELECT beat_id, direction FROM stitch_nodes WHERE id = ?").get(body.node_id);
  // Every other shot inherits its direction from a beat; this one has no beat,
  // so if it did not store the text it would later generate from nothing.
  assert.equal(row.beat_id, null, "a composed shot must not be attached to a beat");
  assert.equal(row.direction, "Kalki turns to face the ridge.");

  const empty = await POST(
    new Request("http://x/c", { method: "POST", body: JSON.stringify({ prompt: "   " }) }),
    { params }
  );
  assert.equal(empty.status, 400, "a shot with no description must be rejected");
});

test("composer references map onto the H3 channel each one belongs to", () => {
  // The chips the user attaches carry ref_kind straight from the assets route.
  // This is the join between the two halves of the feature: if stills stopped
  // landing on ref_images, or a clip's soundtrack stopped riding with it, the
  // references would be silently ignored by the model.
  const { workflow, prompt } = workflow_mod.buildH3ReferenceWorkflow({
    prompt: "The stand on the stair.",
    mode: "continue",
    references: { images: ["kalki.png", "armour.png"], video: "prev.mp4", videoAudio: "prev.mp4" }
  });
  const inputs = workflow["5"].inputs;

  assert.deepEqual(Object.keys(inputs.ref_images), ["ref_image_0", "ref_image_1"]);
  assert.deepEqual(Object.keys(inputs.ref_videos), ["ref_video_0"]);
  assert.deepEqual(Object.keys(inputs.ref_video_audios), ["ref_video_audio_0"]);
  // Frames and sound come off one decode node, so a clip cannot desync from
  // its own soundtrack.
  assert.equal(inputs.ref_videos.ref_video_0[0], inputs.ref_video_audios.ref_video_audio_0[0]);
  // Two stills means <Picture 1> and <Picture 2> must both be named, in order.
  assert.ok(prompt.indexOf("<Picture 1>") < prompt.indexOf("<Picture 2>"));
  assert.ok(prompt.includes("<Video 1>") && prompt.includes("<Audio 1>"));
});
