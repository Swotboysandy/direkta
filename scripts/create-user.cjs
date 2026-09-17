#!/usr/bin/env node
// Create an account, or reset one's password, from the server's shell.
//
// This is how the first admin is made: there is no sign-up page, and the
// People page needs an admin to open it. Run it in the app directory so it
// uses the same database as the running app (DATA_DIR from .env / .env.local).
//
//   node scripts/create-user.cjs --email you@example.com --admin [--name "You"]
//   node scripts/create-user.cjs --email tester@example.com [--limit 25 | --limit unlimited]
//   node scripts/create-user.cjs --email you@example.com --reset-password
//
// A strong password is generated and printed once; only its hash is stored.
// The first admin created also becomes the owner of every production that
// existed before accounts did.

const path = require("node:path");
const fs = require("node:fs");

const root = path.resolve(__dirname, "..");
process.chdir(root);
// Same precedence as Next: .env.local over .env, and real environment over both.
for (const file of [".env.local", ".env"]) {
  if (fs.existsSync(file)) process.loadEnvFile(file);
}

function usage(message) {
  if (message) console.error(`\n  ${message}\n`);
  console.error(
    [
      "  Usage:",
      "    node scripts/create-user.cjs --email you@example.com --admin [--name \"You\"]",
      "    node scripts/create-user.cjs --email tester@example.com [--name \"Tester\"] [--limit 25|unlimited]",
      "    node scripts/create-user.cjs --email you@example.com --reset-password",
      ""
    ].join("\n")
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (!arg.startsWith("--")) usage(`Unexpected argument: ${arg}`);
  const key = arg.slice(2);
  if (key === "admin" || key === "reset-password") flags[key] = true;
  else if (["email", "name", "limit"].includes(key)) {
    const value = args[++i];
    if (value === undefined || value.startsWith("--")) usage(`--${key} needs a value.`);
    flags[key] = value;
  } else usage(`Unknown option: ${arg}`);
}
if (!flags.email) usage("--email is required.");

require("./register-typescript.cjs");
const { users, sessions, looksLikeEmail, normaliseEmail, DEFAULT_DAILY_LIMIT } = require("../lib/auth/store.ts");
const { generatePassword, hashPassword } = require("../lib/auth/password.ts");

(async () => {
  const email = normaliseEmail(flags.email);
  if (!looksLikeEmail(email)) usage(`"${flags.email}" is not a valid email address.`);
  const existing = users.byEmailWithHash(email);
  const password = generatePassword();

  if (flags["reset-password"]) {
    if (!existing) usage(`No account for ${email}.`);
    users.update(existing.id, { password_hash: await hashPassword(password) });
    sessions.revokeAllFor(existing.id);
    console.log(`\n  New password for ${email} (shown once; they are signed out everywhere):\n\n    ${password}\n`);
    return;
  }

  if (existing) usage(`${email} already has an account. Use --reset-password to issue a new password.`);

  let dailyLimit = DEFAULT_DAILY_LIMIT;
  if (flags.limit !== undefined) {
    if (flags.limit === "unlimited") dailyLimit = null;
    else if (/^\d+$/.test(flags.limit)) dailyLimit = Number(flags.limit);
    else usage("--limit must be a whole number or 'unlimited'.");
  }
  const role = flags.admin ? "admin" : "user";
  const firstAdmin = role === "admin" && users.adminCount() === 0 && users.list().every((u) => u.role !== "admin");

  const user = users.create({
    email,
    name: flags.name ?? "",
    passwordHash: await hashPassword(password),
    role,
    dailyLimit: role === "admin" ? null : dailyLimit
  });

  const allowance = role === "admin" || user.daily_limit === null ? "unlimited" : `${user.daily_limit} generations a day`;
  console.log(`\n  Created ${role === "admin" ? "admin" : "tester"} ${user.email} (${allowance}).`);
  if (firstAdmin) console.log("  As the first admin, this account now owns every production made before accounts existed.");
  console.log(`\n  Password (shown once):\n\n    ${password}\n`);
})().catch((error) => {
  console.error(`\n  ${error?.message || error}\n`);
  process.exit(1);
});
