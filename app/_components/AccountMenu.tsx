"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { BookOpen, Key, Settings, Trash2 } from "./icons";
import { dropCache } from "../_lib/browser-cache";

/**
 * The account button and its menu.
 *
 * Fylmer is self-hosted and has no sign-in, so this deliberately does not
 * invent an identity: the header names the instance you are actually looking
 * at, which is the thing worth knowing when the same person runs it locally
 * and on a box. Everything below it is a real destination.
 *
 * The one destructive item clears the browser's copy of the production list,
 * bundle and stage gates — the cache the shell paints from before the network
 * answers. Nothing on the server is touched, which is why it asks for no
 * confirmation; it reloads so the next paint comes from the network.
 */
export function AccountMenu({
  onOpenKeys,
  onOpenSkills
}: {
  onOpenKeys: () => void;
  onOpenSkills: () => void;
}) {
  const [host, setHost] = useState("");
  const [open, setOpen] = useState(false);

  // After mount: the server does not know the host the browser reached it on.
  useEffect(() => setHost(window.location.host), []);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
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
            <span className="acct-host">{host || "this instance"}</span>
            <span className="acct-kind">Self-hosted · no sign-in</span>
          </div>

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
