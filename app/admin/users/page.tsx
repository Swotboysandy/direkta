"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, UserPlus } from "../../_components/icons";

/**
 * People — the admin's page for beta accounts.
 *
 * Accounts are made here, never by sign-up. A password is shown once, at
 * creation or reset, because the server keeps only its hash; the admin passes
 * it on. Each row is one person and one quiet line of what matters: their
 * role, how much of today's allowance they have used, and when they last
 * signed in.
 */

type Role = "admin" | "user";

interface Person {
  id: string;
  email: string;
  name: string;
  role: Role;
  daily_limit: number | null;
  disabled: boolean;
  created_at: string;
  last_login_at: string | null;
  generations_used: number;
  projects: number;
}

interface Secret {
  email: string;
  password: string;
  reason: "created" | "reset";
}

export default function PeoplePage() {
  const [me, setMe] = useState<{ id: string; role: Role } | null | undefined>(undefined);
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<Secret | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [limit, setLimit] = useState("25");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setPeople(((await res.json()) as { users: Person[] }).users);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.status === 401) {
          window.location.replace("/login?next=/admin/users");
          return;
        }
        const data = res.ok ? await res.json() : null;
        setMe(data?.user ?? null);
        if (data?.user?.role === "admin") await load();
      })
      .catch(() => setMe(null));
  }, [load]);

  function parseLimit(raw: string): number | null | "invalid" {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isInteger(n) && n >= 0 ? n : "invalid";
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    const dailyLimit = parseLimit(limit);
    if (dailyLimit === "invalid") {
      setError("The daily limit must be a whole number, or empty for unlimited.");
      return;
    }
    setBusy("create");
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, name, role, daily_limit: dailyLimit })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Could not create that account.");
        return;
      }
      setSecret({ email: data.user.email, password: data.password, reason: "created" });
      setEmail("");
      setName("");
      setRole("user");
      setLimit("25");
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function patch(person: Person, body: Record<string, unknown>) {
    setBusy(person.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${person.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Could not change that account.");
        return;
      }
      if (data?.password) setSecret({ email: person.email, password: data.password, reason: "reset" });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (me === undefined) return <main className="people" aria-busy="true" />;

  if (!me || me.role !== "admin") {
    return (
      <main className="people">
        <header className="people-head">
          <Link href="/" className="people-back">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1>People</h1>
        </header>
        <p className="people-quiet">Only an admin can manage accounts.</p>
      </main>
    );
  }

  return (
    <main className="people">
      <header className="people-head">
        <Link href="/" className="people-back">
          <ArrowLeft size={16} /> Back
        </Link>
        <h1>People</h1>
      </header>

      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}

      {secret ? (
        <div className="people-secret" role="status">
          <p>
            {secret.reason === "created" ? "Account made for" : "New password for"} <strong>{secret.email}</strong>. It
            is shown only now — send it to them.
          </p>
          <div className="people-secret-row">
            <code>{secret.password}</code>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigator.clipboard?.writeText(secret.password).catch(() => {})}
            >
              <Copy size={14} /> Copy
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setSecret(null)}>
              Done
            </button>
          </div>
        </div>
      ) : null}

      <form className="people-create" onSubmit={create}>
        <label className="auth-field">
          <span>Email</span>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="auth-field">
          <span>Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="auth-field people-narrow">
          <span>Daily limit</span>
          <input
            className="input"
            inputMode="numeric"
            placeholder="Unlimited"
            value={role === "admin" ? "" : limit}
            disabled={role === "admin"}
            onChange={(e) => setLimit(e.target.value)}
          />
        </label>
        <label className="auth-field people-narrow">
          <span>Role</span>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="user">Tester</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy === "create" || !email}>
          <UserPlus size={14} /> {busy === "create" ? "Adding…" : "Add"}
        </button>
      </form>

      <ul className="people-list">
        {people.map((person) => (
          <PersonRow
            key={person.id}
            person={person}
            self={person.id === me.id}
            busy={busy === person.id}
            onPatch={(body) => patch(person, body)}
          />
        ))}
      </ul>
    </main>
  );
}

function PersonRow({
  person,
  self,
  busy,
  onPatch
}: {
  person: Person;
  self: boolean;
  busy: boolean;
  onPatch: (body: Record<string, unknown>) => void;
}) {
  const [limit, setLimit] = useState(person.daily_limit === null ? "" : String(person.daily_limit));
  useEffect(() => setLimit(person.daily_limit === null ? "" : String(person.daily_limit)), [person.daily_limit]);

  const admin = person.role === "admin";
  const allowance = admin || person.daily_limit === null
    ? `${person.generations_used} generated today · unlimited`
    : `${person.generations_used} of ${person.daily_limit} today`;
  const line = [
    admin ? "Admin" : "Tester",
    allowance,
    `${person.projects} production${person.projects === 1 ? "" : "s"}`,
    person.last_login_at ? `last in ${person.last_login_at.slice(0, 16)} UTC` : "never signed in"
  ].join(" · ");

  function saveLimit() {
    const trimmed = limit.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && !(Number.isInteger(next) && next >= 0)) {
      setLimit(person.daily_limit === null ? "" : String(person.daily_limit));
      return;
    }
    if (next !== person.daily_limit) onPatch({ daily_limit: next });
  }

  return (
    <li className={`people-row${person.disabled ? " people-row--off" : ""}`}>
      <div className="people-who">
        <strong>{person.name || person.email}</strong>
        <span className="people-quiet">
          {person.name ? `${person.email} · ` : ""}
          {person.disabled ? "Disabled · " : ""}
          {line}
        </span>
      </div>
      <div className="people-actions">
        {!admin ? (
          <label className="people-limit">
            <span>Limit</span>
            <input
              className="input"
              inputMode="numeric"
              placeholder="∞"
              value={limit}
              disabled={busy}
              onChange={(e) => setLimit(e.target.value)}
              onBlur={saveLimit}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
          </label>
        ) : null}
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => onPatch({ reset_password: true })}>
          Reset password
        </button>
        {!self ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={busy}
            onClick={() => onPatch({ role: admin ? "user" : "admin" })}
          >
            {admin ? "Make tester" : "Make admin"}
          </button>
        ) : null}
        {!self ? (
          <button
            type="button"
            className={`btn btn-sm ${person.disabled ? "btn-secondary" : "btn-tinted btn-tint-danger"}`}
            disabled={busy}
            onClick={() => onPatch({ disabled: !person.disabled })}
          >
            {person.disabled ? "Enable" : "Disable"}
          </button>
        ) : null}
      </div>
    </li>
  );
}
