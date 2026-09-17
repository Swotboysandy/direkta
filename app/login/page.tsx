"use client";

import { useEffect, useState, type FormEvent } from "react";
import { dropCache } from "../_lib/browser-cache";

/**
 * Sign in. Accounts are made by an admin, so there is no sign-up here and no
 * "forgot password" — the admin resets it.
 *
 * After signing in, the browser's cached production list is dropped: it was
 * painted for whoever used this browser last, and must not flash on screen
 * for the next person.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/");

  useEffect(() => {
    // Only a path on this site, never "//elsewhere" — the parameter is
    // attacker-controllable, and an open redirect after sign-in is a phish.
    const asked = new URLSearchParams(window.location.search).get("next") ?? "";
    if (asked.startsWith("/") && !asked.startsWith("//") && !asked.startsWith("/\\")) setNext(asked);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Could not sign in.");
        return;
      }
      dropCache();
      window.location.replace(next);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <form className="auth-panel" onSubmit={submit} noValidate>
        <div className="auth-head">
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-note">Use the email and password your admin gave you.</p>
        </div>

        <label className="auth-field">
          <span>Email</span>
          <input
            className="input"
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary auth-submit" disabled={busy || !email || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
