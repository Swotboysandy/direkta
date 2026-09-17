"use client";

import { useCallback, useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { BookOpen, Key, Settings, SignOut, Trash2, Users } from "./icons";
import { dropCache } from "../_lib/browser-cache";

/**
 * The account button and its menu.
 *
 * The header names who is signed in and how much of today's generation
 * allowance is left — the one number a tester needs before starting a render.
 * Keys, skills, settings and people change the instance for everyone, so they
 * are listed for admins only; the server refuses them to anyone else anyway.
 *
 * Signing out, and a session that has ended (expired, or the account was
 * disabled), both drop the browser's cached production list and go to the
 * sign-in page, so the next person on this browser never sees the last one's
 * work painted from cache.
 *
 * "Clear local cache" clears only that browser copy. Nothing on the server is
 * touched, which is why it asks for no confirmation.
 */

interface Me {
  user: { id: string; email: string; name: string; role: "admin" | "user" };
  generations: { used: number; limit: number | null };
}

export function AccountMenu({
  onOpenKeys,
  onOpenSkills
}: {
  onOpenKeys: () => void;
  onOpenSkills: () => void;
}) {
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.status === 401) {
        dropCache();
        window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }
      if (res.ok) setMe((await res.json()) as Me);
    } catch {
      /* offline: keep what we had */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      dropCache();
      window.location.replace("/login");
    }
  }

  const admin = me?.user.role === "admin";
  const usage = !me
    ? ""
    : me.generations.limit === null
    ? `${admin ? "Admin" : "Tester"} · ${me.generations.used} generated today`
    : `${me.generations.used} of ${me.generations.limit} generations today`;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void refresh();
      }}
    >
      <Popover.Trigger asChild>
        <button type="button" className="nav-avatar" aria-label="Account and settings" title="Account">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8.6" r="3.6" fill="currentColor" />
            <path d="M4.8 20.2c0-3.7 3.2-6.2 7.2-6.2s7.2 2.5 7.2 6.2" fill="currentColor" />
          </svg>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="acct" side="right" align="end" sideOffset={10} collisionPadding={16}>
          <div className="acct-head">
            <span className="acct-host">{me ? me.user.name || me.user.email : "Signed in"}</span>
            <span className="acct-kind">{usage}</span>
          </div>

          {admin ? (
            <div className="acct-group">
              <button
                type="button"
                className="acct-item"
                onClick={() => {
                  setOpen(false);
                  onOpenKeys();
                }}
              >
                <Key size={14} />
                <span>Keys and connections</span>
              </button>
              <button
                type="button"
                className="acct-item"
                onClick={() => {
                  setOpen(false);
                  onOpenSkills();
                }}
              >
                <BookOpen size={14} />
                <span>Skills</span>
              </button>
              <a className="acct-item" href="/settings">
                <Settings size={14} />
                <span>Settings</span>
              </a>
              <a className="acct-item" href="/admin/users">
                <Users size={14} />
                <span>People</span>
              </a>
            </div>
          ) : null}

          <div className="acct-group">
            <button type="button" className="acct-item" onClick={() => void signOut()}>
              <SignOut size={14} />
              <span>Sign out</span>
            </button>
          </div>

          <button
            type="button"
            className="acct-item acct-item--danger"
            onClick={() => {
              dropCache();
              window.location.reload();
            }}
          >
            <Trash2 size={14} />
            <span>Clear local cache</span>
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
