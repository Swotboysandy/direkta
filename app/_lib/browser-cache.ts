"use client";

/**
 * A small read-through cache in localStorage.
 *
 * Reopening a production used to mean a spinner until the network answered,
 * even though the answer was almost always the same one as last time. Reads
 * paint from here first and are then revalidated against the server — the
 * cache is what you see first, never what you end up with. It holds the
 * startup payloads only (the production list, a project bundle, the stage
 * gates); media is cached by the browser itself.
 *
 * Every entry is versioned and dated, and every access is wrapped: private
 * mode, a full quota and a corrupt entry all degrade to "no cache" rather
 * than to a broken app.
 */

const PREFIX = "fylmer:cache:v1:";

/** Long enough to survive a day's work, short enough that a stale shape from
 *  an old deploy cannot haunt the UI forever. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type Entry<T> = { t: number; v: T };

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (!entry || typeof entry.t !== "number") return null;
    if (Date.now() - entry.t > MAX_AGE_MS) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.v;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T): void {
  const record = () => localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), v: value }));
  try {
    record();
  } catch {
    // Out of quota. Drop our own entries and try once; if it still fails the
    // value simply goes uncached, which costs a fetch and nothing else.
    dropCache();
    try {
      record();
    } catch {
      /* uncached */
    }
  }
}

/** Clear cached entries — all of them, or one project's (`dropCache(id)`). */
export function dropCache(keyPrefix = ""): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX) && k.slice(PREFIX.length).includes(keyPrefix)) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nothing we can do, and nothing that matters */
  }
}
