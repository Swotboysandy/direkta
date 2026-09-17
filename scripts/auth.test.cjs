// Accounts, ownership and the daily limit — run offline against a throwaway
// database. Every API handler is discovered from the filesystem, so a route
// added later without a guard fails here rather than in front of a tester.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
require("./register-typescript.cjs");

const work = fs.mkdtempSync(path.join(os.tmpdir(), "direkta-auth-tests-"));
process.env.OSS_DIR = work;
process.env.DATA_DIR = work;
process.env.SEED_DEMO = "0";
process.env.RUNPOD_API_KEY = "test-key-never-sent-to-network";
process.env.RUNPOD_H3_POD_ID = "test-pod";
delete process.env.DIREKTA_MCP_TOKEN;
// A missing mock must fail, never reach a paid service.
let fetchCalls = 0;
const offline = async (input) => {
  fetchCalls++;
  throw new Error(`Unexpected network request in offline auth tests: ${String(input)}`);
};
global.fetch = offline;

const { getDb } = require("../lib/db/client.ts");
const { users, sessions } = require("../lib/auth/store.ts");
const { hashPassword } = require("../lib/auth/password.ts");
const limits = require("../lib/auth/limits.ts");

const API = path.resolve(__dirname, "../app/api");

/* ── helpers ─────────────────────────────────────────────────────────── */

function cookieFor(user) {
  return `direkta_session=${sessions.create(user.id).token}`;
}

function request(url, { cookie, method = "GET", body, headers = {} } = {}) {
  const h = new Headers(headers);
  if (cookie) h.set("cookie", cookie);
  if (body !== undefined) h.set("content-type", "application/json");
  return new Request(`http://localhost${url}`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

async function json(response) {
  return response.json().catch(() => null);
}

/** Resolve, or fail the test instead of hanging the run on a stuck handler. */
function withTimeout(promise, label, ms = 15_000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} did not answer within ${ms}ms`)), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

/** Every exported handler, with the guard its first lines call. */
function discoverHandlers() {
  const out = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "route.ts") {
        const route = path.relative(API, dir).split(path.sep).join("/");
        const src = fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n");
        const re = /export async function (GET|POST|PUT|PATCH|DELETE|OPTIONS)\s*\(/g;
        const starts = [];
        let m;
        while ((m = re.exec(src))) starts.push({ method: m[1], at: m.index });
        starts.forEach((s, i) => {
          const head = src
            .slice(s.at, i + 1 < starts.length ? starts[i + 1].at : src.length)
            .split("\n")
            .slice(0, 25)
            .join("\n");
          // MCP's POST is guarded by its own authed(): its token, or an admin session.
          const guard = head.match(/\b(requireAccess|requireUser|requireAdmin|requireCollection|currentUser|authed)\(/)?.[1] ?? null;
          const kind = head.match(/requireAccess\(req, "(\w+)", (id|beatId|\(await params\)\.id)\)/)?.[1] ?? null;
          out.push({ route, file: full, method: s.method, guard, kind });
        });
      }
    }
  })(API);
  return out;
}

function call(handler, req, params) {
  const mod = require(handler.file);
  return withTimeout(
    Promise.resolve(mod[handler.method](req, { params: Promise.resolve(params) })),
    `${handler.method} /api/${handler.route}`
  );
}

/* ── fixture ─────────────────────────────────────────────────────────── */

const admin = users.create({ email: "admin@example.com", name: "Admin", passwordHash: "unused", role: "admin", dailyLimit: null });
const alice = users.create({ email: "alice@example.com", name: "Alice", passwordHash: "unused", role: "user", dailyLimit: 25 });
const bob = users.create({ email: "bob@example.com", name: "Bob", passwordHash: "unused", role: "user", dailyLimit: 25 });
const adminCookie = cookieFor(admin);
const aliceCookie = cookieFor(alice);
const bobCookie = cookieFor(bob);

/** Alice's production and one of everything inside it. */
const own = {};

test.before(async () => {
  const { POST } = require("../app/api/projects/route.ts");
  const created = await json(await POST(request("/api/projects", { cookie: aliceCookie, method: "POST", body: { title: "Alice's film" } })));
  own.project = created.project.id;

  const db = getDb();
  const P = own.project;
  own.character = "c-alice";
  own.location = "l-alice";
  own.prop = "p-alice";
  own.node = "n-alice";
  own.node2 = "n2-alice";
  own.edge = "e-alice";
  own.beat = "b-alice";
  own.variant = "v-alice";
  own.stitch_node = "sn-alice";
  own.asset = "a-alice";
  db.prepare("INSERT INTO characters (id, project_id, name) VALUES (?, ?, 'Hero')").run(own.character, P);
  db.prepare("INSERT INTO locations (id, project_id, name) VALUES (?, ?, 'Roof')").run(own.location, P);
  db.prepare("INSERT INTO props (id, project_id, name) VALUES (?, ?, 'Lamp')").run(own.prop, P);
  db.prepare("INSERT INTO nodes (id, project_id, kind, title) VALUES (?, ?, 'note', 'One')").run(own.node, P);
  db.prepare("INSERT INTO nodes (id, project_id, kind, title) VALUES (?, ?, 'note', 'Two')").run(own.node2, P);
  db.prepare("INSERT INTO edges (id, project_id, source, target) VALUES (?, ?, ?, ?)").run(own.edge, P, own.node, own.node2);
  db.prepare("INSERT INTO beats (id, project_id, n, title, direction) VALUES (?, ?, 1, 'Open', 'Wide')").run(own.beat, P);
  db.prepare("INSERT INTO storyboard_variants (id, beat_id, n) VALUES (?, ?, 1)").run(own.variant, own.beat);
  db.prepare("INSERT INTO storyboard_rows (beat_id, selected_variant_id) VALUES (?, ?)").run(own.beat, own.variant);
  db.prepare("INSERT INTO stitch_nodes (id, project_id, beat_id, variant_id, duration) VALUES (?, ?, ?, ?, 3)").run(own.stitch_node, P, own.beat, own.variant);
  db.prepare("INSERT INTO assets (id, target_kind, target_id, kind, url) VALUES (?, 'storyboard_variant', ?, 'image', '/oss/alice.png')").run(own.asset, own.variant);
});

function fixtureCounts() {
  const db = getDb();
  const one = (sql, id) => db.prepare(sql).get(id).n;
  return {
    project: one("SELECT COUNT(*) AS n FROM projects WHERE id = ?", own.project),
    character: one("SELECT COUNT(*) AS n FROM characters WHERE id = ?", own.character),
    location: one("SELECT COUNT(*) AS n FROM locations WHERE id = ?", own.location),
    prop: one("SELECT COUNT(*) AS n FROM props WHERE id = ?", own.prop),
    node: one("SELECT COUNT(*) AS n FROM nodes WHERE id = ?", own.node),
    edge: one("SELECT COUNT(*) AS n FROM edges WHERE id = ?", own.edge),
    beat: one("SELECT COUNT(*) AS n FROM beats WHERE id = ?", own.beat),
    variant: one("SELECT COUNT(*) AS n FROM storyboard_variants WHERE id = ?", own.variant),
    stitch_node: one("SELECT COUNT(*) AS n FROM stitch_nodes WHERE id = ?", own.stitch_node),
    asset: one("SELECT COUNT(*) AS n FROM assets WHERE id = ?", own.asset)
  };
}

const PUBLIC = new Set(["auth/login POST", "auth/logout POST", "mcp GET"]);
const handlers = discoverHandlers();

/* ── the gate ────────────────────────────────────────────────────────── */

test("every handler except sign-in, sign-out and MCP discovery names a guard in its first lines", () => {
  const unguarded = handlers
    .filter((h) => h.method !== "OPTIONS" && !PUBLIC.has(`${h.route} ${h.method}`) && !h.guard)
    .map((h) => `${h.method} /api/${h.route}`);
  assert.deepEqual(unguarded, []);
  assert.ok(handlers.length > 90, `expected the whole API, found ${handlers.length} handlers`);
});

test("signed out, every handler refuses with 401 and does no work", async () => {
  // Bodies that satisfy the handlers which validate input before the guard,
  // so the 401 cannot hide behind a 400.
  const body = {
    project_id: own.project, source: own.node, target: own.node2, kind: "note", title: "t",
    message: "hello", variant_id: own.variant, name: "n", email: "x@example.com", approval_id: "a"
  };
  const before = fixtureCounts();
  const wrong = [];
  for (const h of handlers) {
    if (h.method === "OPTIONS" || PUBLIC.has(`${h.route} ${h.method}`)) continue;
    const req = request(`/api/${h.route}`, { method: h.method, body: h.method === "GET" ? undefined : body });
    const res = await call(h, req, { id: own.project, beatId: own.beat });
    if (res.status !== 401) wrong.push(`${h.method} /api/${h.route} → ${res.status}`);
  }
  assert.deepEqual(wrong, []);
  assert.deepEqual(fixtureCounts(), before);
  assert.equal(fetchCalls, 0, "a signed-out request reached the network");
});

test("a forged or ended session is refused like no session", async () => {
  const { GET } = require("../app/api/projects/route.ts");
  assert.equal((await GET(request("/api/projects", { cookie: "direkta_session=forged" }))).status, 401);
  const token = sessions.create(bob.id).token;
  sessions.revoke(token);
  assert.equal((await GET(request("/api/projects", { cookie: `direkta_session=${token}` }))).status, 401);
});

/* ── privacy between testers ─────────────────────────────────────────── */

test("another tester gets 404 from every handler that takes one of Alice's things, and nothing changes", async () => {
  const before = fixtureCounts();
  const body = { title: "hijack", name: "hijack", prompt: "hijack", favourite: true, kind: "image", item_id: own.asset };
  const wrong = [];
  let checked = 0;
  for (const h of handlers) {
    if (h.guard !== "requireAccess" || !h.kind || !(h.kind in own)) continue;
    const id = own[h.kind];
    const req = request(`/api/${h.route}`, { cookie: bobCookie, method: h.method, body: h.method === "GET" ? undefined : body });
    const res = await call(h, req, { id, beatId: id });
    checked++;
    if (res.status !== 404) wrong.push(`${h.method} /api/${h.route} (${h.kind}) → ${res.status}`);
  }
  assert.deepEqual(wrong, []);
  assert.ok(checked > 55, `expected every ownership handler, checked ${checked}`);
  assert.deepEqual(fixtureCounts(), before);
  assert.equal(fetchCalls, 0);
});

test("Alice and the admin both get past the ownership guard on reads", async () => {
  const wrong = [];
  for (const h of handlers) {
    if (h.guard !== "requireAccess" || !h.kind || !(h.kind in own) || h.method !== "GET") continue;
    const id = own[h.kind];
    for (const [who, cookie] of [["alice", aliceCookie], ["admin", adminCookie]]) {
      const res = await call(h, request(`/api/${h.route}`, { cookie }), { id, beatId: id });
      const data = res.status === 404 ? await json(res.clone()) : null;
      if (res.status === 401 || res.status === 403 || data?.error === "Not found.") {
        wrong.push(`${who}: GET /api/${h.route} → ${res.status}`);
      }
    }
  }
  assert.deepEqual(wrong, []);
});

test("the production list shows each tester only their own; the admin sees all", async () => {
  const { GET, POST } = require("../app/api/projects/route.ts");
  const bobs = await json(await POST(request("/api/projects", { cookie: bobCookie, method: "POST", body: { title: "Bob's film" } })));
  const owner = getDb().prepare("SELECT owner_id FROM projects WHERE id = ?").get(bobs.project.id).owner_id;
  assert.equal(owner, bob.id);

  const ids = async (cookie) => (await json(await GET(request("/api/projects?withCounts=1", { cookie })))).projects.map((p) => p.id);
  const forBob = await ids(bobCookie);
  const forAlice = await ids(aliceCookie);
  const forAdmin = await ids(adminCookie);
  assert.ok(forBob.includes(bobs.project.id) && !forBob.includes(own.project));
  assert.ok(forAlice.includes(own.project) && !forAlice.includes(bobs.project.id));
  assert.ok(forAdmin.includes(own.project) && forAdmin.includes(bobs.project.id));
});

test("handlers that take ids in the body check them too", async () => {
  const nodes = require("../app/api/nodes/route.ts");
  const edges = require("../app/api/edges/route.ts");
  const stitch = require("../app/api/stitch/nodes/route.ts");
  const chat = require("../app/api/chat/route.ts");
  const before = fixtureCounts();

  const addNode = await nodes.POST(request("/api/nodes", { cookie: bobCookie, method: "POST", body: { project_id: own.project, kind: "note", title: "x" } }));
  assert.equal(addNode.status, 404);
  const addEdge = await edges.POST(request("/api/edges", { cookie: bobCookie, method: "POST", body: { source: own.node, target: own.node2 } }));
  assert.equal(addEdge.status, 404);
  const addShot = await stitch.POST(request("/api/stitch/nodes", { cookie: bobCookie, method: "POST", body: { variant_id: own.variant } }));
  assert.equal(addShot.status, 404);
  const addBeat = await stitch.POST(request("/api/stitch/nodes", { cookie: bobCookie, method: "POST", body: { beat_id: own.beat } }));
  assert.equal(addBeat.status, 404);
  const removeShot = await stitch.DELETE(request(`/api/stitch/nodes?node_id=${own.stitch_node}`, { cookie: bobCookie, method: "DELETE" }));
  assert.equal(removeShot.status, 404);
  const removeByVariant = await stitch.DELETE(request(`/api/stitch/nodes?variant_id=${own.variant}`, { cookie: bobCookie, method: "DELETE" }));
  assert.equal(removeByVariant.status, 404);
  // Removing something that is not there is still fine, as before.
  const removeNothing = await stitch.DELETE(request("/api/stitch/nodes?node_id=missing", { cookie: bobCookie, method: "DELETE" }));
  assert.equal(removeNothing.status, 200);
  const talk = await chat.POST(request("/api/chat", { cookie: bobCookie, method: "POST", body: { project_id: own.project, message: "read the script" } }));
  assert.equal(talk.status, 404);

  assert.deepEqual(fixtureCounts(), before);
  // Alice can still do all of it.
  const aliceNode = await nodes.POST(request("/api/nodes", { cookie: aliceCookie, method: "POST", body: { project_id: own.project, kind: "note", title: "mine" } }));
  assert.equal(aliceNode.status, 201);
});

test("collections belong to their maker and only gather from reachable productions", async () => {
  const list = require("../app/api/collections/route.ts");
  const one = require("../app/api/collections/[id]/route.ts");
  const make = async (cookie, name) => json(await list.POST(request("/api/collections", { cookie, method: "POST", body: { name } })));

  const alices = (await make(aliceCookie, "Night plates")).collection;
  const bobs = await make(bobCookie, "Night plates");
  assert.notEqual(bobs.collection.id, alices.id, "same name, different people: two collections");
  assert.equal(bobs.existed, undefined);

  const names = async (cookie) => (await json(await list.GET(request("/api/collections", { cookie })))).collections.map((c) => c.id);
  assert.deepEqual(await names(bobCookie), [bobs.collection.id]);
  assert.ok((await names(adminCookie)).includes(alices.id));

  const params = (id) => ({ params: Promise.resolve({ id }) });
  const item = { project_id: own.project, kind: "image", item_id: own.asset, member: true };
  // Filing Alice's frame into Bob's own collection: refused.
  assert.equal((await one.PUT(request("/x", { cookie: bobCookie, method: "PUT", body: item }), params(bobs.collection.id))).status, 404);
  // Touching Alice's collection at all: refused.
  assert.equal((await one.PUT(request("/x", { cookie: bobCookie, method: "PUT", body: item }), params(alices.id))).status, 404);
  assert.equal((await one.DELETE(request("/x", { cookie: bobCookie, method: "DELETE" }), params(alices.id))).status, 404);
  assert.ok((await names(aliceCookie)).includes(alices.id));
  // Alice files her own frame.
  assert.equal((await one.PUT(request("/x", { cookie: aliceCookie, method: "PUT", body: item }), params(alices.id))).status, 200);
});

test("a Director approval can only be answered by the person it was asked of", async () => {
  const { pendingApprovals } = require("../lib/agents/director.ts");
  const approve = require("../app/api/chat/approve/route.ts");
  pendingApprovals.set(`${alice.id}:render-1`, { name: "no_such_tool", args: {}, projectId: own.project, userId: alice.id, admin: false, at: Date.now() });

  const asBob = await approve.POST(request("/api/chat/approve", { cookie: bobCookie, method: "POST", body: { approval_id: "render-1", approved: true } }));
  assert.equal(asBob.status, 410);
  assert.ok(pendingApprovals.has(`${alice.id}:render-1`), "someone else's answer must not use up the approval");

  const asAlice = await approve.POST(request("/api/chat/approve", { cookie: aliceCookie, method: "POST", body: { approval_id: "render-1", approved: false } }));
  assert.equal(asAlice.status, 200);
  assert.equal((await json(asAlice)).approved, false);
  assert.ok(!pendingApprovals.has(`${alice.id}:render-1`));
});

/* ── admin ───────────────────────────────────────────────────────────── */

test("admin-only handlers refuse testers with 403, and let the admin in", async () => {
  const wrong = [];
  for (const h of handlers) {
    if (h.guard !== "requireAdmin") continue;
    const res = await call(h, request(`/api/${h.route}`, { cookie: bobCookie, method: h.method, body: h.method === "GET" ? undefined : {} }), { id: bob.id });
    if (res.status !== 403) wrong.push(`${h.method} /api/${h.route} → ${res.status}`);
  }
  assert.deepEqual(wrong, []);
  for (const route of ["admin/users", "usage", "vendors", "settings/flags", "skills"]) {
    const h = handlers.find((x) => x.route === route && x.method === "GET");
    const res = await call(h, request(`/api/${route}`, { cookie: adminCookie }), {});
    assert.ok(![401, 403].includes(res.status), `admin GET /api/${route} → ${res.status}`);
  }
});

test("the admin makes accounts, and the password is shown once and works", async () => {
  const create = require("../app/api/admin/users/route.ts");
  const login = require("../app/api/auth/login/route.ts");
  const me = require("../app/api/auth/me/route.ts");

  const made = await create.POST(request("/api/admin/users", { cookie: adminCookie, method: "POST", body: { email: "Carol@Example.com", name: "Carol", daily_limit: 3 } }));
  assert.equal(made.status, 201);
  const { user, password } = await json(made);
  assert.equal(user.email, "carol@example.com");
  assert.equal(user.daily_limit, 3);
  assert.equal(typeof password, "string");
  assert.ok(password.length >= 12);
  assert.ok(!getDb().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id).password_hash.includes(password));

  const dup = await create.POST(request("/api/admin/users", { cookie: adminCookie, method: "POST", body: { email: "carol@example.com" } }));
  assert.equal(dup.status, 409);
  const byTester = await create.POST(request("/api/admin/users", { cookie: bobCookie, method: "POST", body: { email: "sneaky@example.com", role: "admin" } }));
  assert.equal(byTester.status, 403);

  const headers = { "x-forwarded-for": "10.0.0.1" };
  const signedIn = await login.POST(request("/api/auth/login", { method: "POST", headers, body: { email: "CAROL@example.com", password } }));
  assert.equal(signedIn.status, 200);
  const setCookie = signedIn.headers.get("set-cookie");
  assert.match(setCookie, /direkta_session=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=lax/i);
  const cookie = setCookie.split(";")[0];
  const who = await json(await me.GET(request("/api/auth/me", { cookie })));
  assert.equal(who.user.email, "carol@example.com");
  assert.deepEqual(who.generations, { used: 0, limit: 3 });
});

test("sign-in gives one message for a wrong email or password, and stops a guesser", async () => {
  const login = require("../app/api/auth/login/route.ts");
  const passwordHash = await hashPassword("correct horse battery");
  users.create({ email: "dave@example.com", name: "Dave", passwordHash, role: "user", dailyLimit: 5 });
  const attempt = (email, password, ip) =>
    login.POST(request("/api/auth/login", { method: "POST", headers: { "x-forwarded-for": ip }, body: { email, password } }));

  const wrongPassword = await attempt("dave@example.com", "nope nope nope", "10.0.0.2");
  const wrongEmail = await attempt("nobody@example.com", "nope nope nope", "10.0.0.2");
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongEmail.status, 401);
  assert.equal((await json(wrongPassword)).error, (await json(wrongEmail)).error);

  for (let i = 0; i < 8; i++) await attempt("dave@example.com", "still wrong", "10.0.0.3");
  const locked = await attempt("dave@example.com", "correct horse battery", "10.0.0.3");
  assert.equal(locked.status, 429, "after eight failures even the right password waits");
  const elsewhere = await attempt("dave@example.com", "correct horse battery", "10.0.0.4");
  assert.equal(elsewhere.status, 200);
});

test("disabling an account or resetting its password signs it out at once", async () => {
  const patch = require("../app/api/admin/users/[id]/route.ts");
  const me = require("../app/api/auth/me/route.ts");
  const erin = users.create({ email: "erin@example.com", name: "Erin", passwordHash: "unused", role: "user", dailyLimit: 5 });
  const params = (id) => ({ params: Promise.resolve({ id }) });

  let cookie = cookieFor(erin);
  assert.equal((await me.GET(request("/api/auth/me", { cookie }))).status, 200);
  const reset = await patch.PATCH(request("/x", { cookie: adminCookie, method: "PATCH", body: { reset_password: true } }), params(erin.id));
  assert.equal(reset.status, 200);
  assert.equal(typeof (await json(reset)).password, "string");
  assert.equal((await me.GET(request("/api/auth/me", { cookie }))).status, 401);

  cookie = cookieFor(erin);
  const disabled = await patch.PATCH(request("/x", { cookie: adminCookie, method: "PATCH", body: { disabled: true } }), params(erin.id));
  assert.equal(disabled.status, 200);
  assert.equal((await me.GET(request("/api/auth/me", { cookie }))).status, 401);
  assert.equal(sessions.userFor(cookieFor(erin).split("=")[1]), null, "a disabled account cannot hold a session");

  assert.equal((await patch.PATCH(request("/x", { cookie: adminCookie, method: "PATCH", body: { disabled: true } }), params(admin.id))).status, 409);
  assert.equal((await patch.PATCH(request("/x", { cookie: adminCookie, method: "PATCH", body: { role: "user" } }), params(admin.id))).status, 409);
  assert.equal((await patch.PATCH(request("/x", { cookie: bobCookie, method: "PATCH", body: { daily_limit: 9999 } }), params(bob.id))).status, 403);
});

/* ── the daily limit ─────────────────────────────────────────────────── */

test("the allowance is reserved before a vendor call, refunded when it fails, and refused at the limit", async () => {
  const route = require("../app/api/nodes/[id]/image/route.ts");
  const db = getDb();
  const frank = users.create({ email: "frank@example.com", name: "Frank", passwordHash: "unused", role: "user", dailyLimit: 1 });
  const cookie = cookieFor(frank);
  const { POST } = require("../app/api/projects/route.ts");
  const project = (await json(await POST(request("/api/projects", { cookie, method: "POST", body: { title: "Frank's" } })))).project.id;
  db.prepare("INSERT INTO nodes (id, project_id, kind, title) VALUES ('n-frank', ?, 'shot', 'Wide')").run(project);
  db.prepare("UPDATE vendors SET enabled = 1, api_key = 'test-key' WHERE id = 'fal-default'").run();
  const params = { params: Promise.resolve({ id: "n-frank" }) };

  try {
    const callsBefore = fetchCalls;
    const failed = await route.POST(request("/api/nodes/n-frank/image", { cookie, method: "POST" }), params);
    assert.equal(failed.status, 500, "the offline vendor call fails");
    assert.ok(fetchCalls > callsBefore, "the vendor was actually attempted");
    assert.equal(limits.generationsUsed(frank.id), 0, "a failed generation is refunded");

    limits.reserveGenerations(users.get(frank.id), 1, "node_image"); // one delivered
    const callsAtLimit = fetchCalls;
    const refused = await route.POST(request("/api/nodes/n-frank/image", { cookie, method: "POST" }), { params: Promise.resolve({ id: "n-frank" }) });
    assert.equal(refused.status, 429);
    assert.deepEqual((await json(refused)).dailyLimit, { used: 1, limit: 1, requested: 1 });
    assert.equal(fetchCalls, callsAtLimit, "over the limit, no vendor is called");
  } finally {
    db.prepare("UPDATE vendors SET api_key = '' WHERE id = 'fal-default'").run();
  }
});

test("reservations count units, refund part of a batch, and never limit admins or unlimited accounts", () => {
  const gina = users.create({ email: "gina@example.com", name: "Gina", passwordHash: "unused", role: "user", dailyLimit: 4 });
  const batch = limits.reserveGenerations(gina, 4, "storyboard_frame");
  assert.equal(limits.generationsUsed(gina.id), 4);
  assert.throws(() => limits.reserveGenerations(gina, 1, "clip"), limits.DailyLimitError);
  batch.refund(3); // three of four frames failed
  assert.equal(limits.generationsUsed(gina.id), 1);
  batch.refund(); // the rest
  assert.equal(limits.generationsUsed(gina.id), 0);
  batch.refund(); // refunding twice gives back nothing more
  assert.equal(limits.generationsUsed(gina.id), 0);

  assert.doesNotThrow(() => limits.reserveGenerations(users.get(admin.id), 10_000, "clip"));
  const henry = users.create({ email: "henry@example.com", name: "Henry", passwordHash: "unused", role: "user", dailyLimit: null });
  assert.doesNotThrow(() => limits.reserveGenerations(henry, 10_000, "clip"));
  const refusal = limits.reserveOrRefuse(gina, 5, "storyboard_frame");
  assert.ok(refusal instanceof Response);
  assert.equal(refusal.status, 429);
});

/* ── MCP, GPU money, and the cross-site gate ─────────────────────────── */

test("MCP without a token is closed to everyone but a signed-in admin", async () => {
  const mcp = require("../app/api/mcp/route.ts");
  const ping = (cookie) => mcp.POST(request("/api/mcp", { cookie, method: "POST", body: { jsonrpc: "2.0", id: 1, method: "ping" } }));
  assert.equal((await ping()).status, 401);
  assert.equal((await ping(bobCookie)).status, 401);
  const asAdmin = await ping(adminCookie);
  assert.equal(asAdmin.status, 200);
  assert.deepEqual((await json(asAdmin)).result, {});
});

test("testers see whether the GPU can run, never the account balance", async (t) => {
  const reply = (value) => new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });
  global.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/graphql")) return reply({ data: { myself: { clientBalance: 100 } } });
    if (url.endsWith("/pods/test-pod")) return reply({ desiredStatus: "RUNNING", adjustedCostPerHr: 1.39, ports: ["8188/http"] });
    if (url.endsWith("/system_stats")) return new Response("{}", { status: 200 });
    throw new Error(`Unmocked request: ${url}`);
  };
  t.after(() => { global.fetch = offline; });

  const status = require("../app/api/minimax-h3/status/route.ts");
  const preflight = require("../app/api/minimax-h3/preflight/route.ts");
  const forAdmin = await json(await status.GET(request("/api/minimax-h3/status", { cookie: adminCookie })));
  const forBob = await json(await status.GET(request("/api/minimax-h3/status", { cookie: bobCookie })));
  assert.equal(forAdmin.balanceUsd, 100);
  assert.equal(forBob.balanceUsd, null);
  assert.equal(forBob.ok, true);

  const estimate = (cookie) => preflight.POST(request("/api/minimax-h3/preflight", { cookie, method: "POST", body: { shotCount: 1 } }));
  const adminEstimate = await json(await estimate(adminCookie));
  const bobEstimate = await json(await estimate(bobCookie));
  assert.equal(adminEstimate.balanceUsd, 100);
  assert.equal(bobEstimate.balanceUsd, null);
  assert.equal(bobEstimate.requiredBalanceUsd, null);
  assert.equal(typeof bobEstimate.estimatedCostUsd, "number");
});

test("the middleware sends signed-out pages to sign-in and refuses cross-site writes", () => {
  const { NextRequest } = require("next/server");
  const { middleware } = require("../middleware.ts");
  const run = (url, init = {}) => middleware(new NextRequest(`http://localhost${url}`, init));
  const passes = (res) => res.headers.get("x-middleware-next") === "1";
  const session = { cookie: bobCookie };

  assert.equal(run("/api/projects").status, 401);
  const home = run("/");
  assert.ok([307, 308].includes(home.status));
  assert.equal(new URL(home.headers.get("location")).pathname, "/login");
  assert.equal(new URL(home.headers.get("location")).search, "");
  const deep = run("/admin/users?tab=1");
  assert.equal(new URL(deep.headers.get("location")).searchParams.get("next"), "/admin/users?tab=1");
  assert.ok(passes(run("/login")));
  assert.ok(passes(run("/oss/frame.png")));
  assert.ok(passes(run("/api/projects", { headers: session })));

  const write = (url, origin, headers = {}) =>
    run(url, { method: "POST", headers: { host: "localhost", ...(origin ? { origin } : {}), ...headers } });
  assert.equal(write("/api/projects", "https://evil.nip.io", session).status, 403);
  assert.equal(write("/api/auth/login", "https://evil.nip.io").status, 403, "no signing a victim into another account");
  assert.equal(write("/api/projects", "null", session).status, 403);
  assert.ok(passes(write("/api/projects", "http://localhost", session)));
  assert.ok(passes(write("/api/projects", null, session)), "non-browser clients send no Origin");
  assert.ok(passes(write("/api/mcp", "https://claude.ai")), "an MCP client with a token may call from anywhere");
  assert.equal(write("/api/mcp", "https://evil.nip.io", session).status, 403, "but not with someone's session");
});

test.after(() => {
  try { getDb().close(); } catch { /* already closed */ }
  if (!path.basename(work).startsWith("direkta-auth-tests-")) throw new Error("Unsafe test cleanup path");
  fs.rmSync(work, { recursive: true, force: true });
});
