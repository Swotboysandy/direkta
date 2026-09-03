"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Four states, because two are not enough.
 *
 *  Surfaces here previously held data as `T | null` and rendered nothing while
 *  it was null. That collapses three different situations into one blank
 *  screen: still loading, loaded and genuinely empty, and failed. The Dashboard
 *  showed no frames at all during a slow fetch, which is indistinguishable from
 *  a project with no frames — and a failed request looked identical to both.
 *
 *  `status` separates them so a caller must decide what each one looks like.
 */
export type AsyncStatus = "loading" | "ready" | "empty" | "error";

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
  /** Re-run the fetch — the retry action an error state needs to offer. */
  reload: () => void;
}

export interface UseAsyncOptions<T> {
  /** Decides whether a successful result counts as empty. Defaults to an empty array. */
  isEmpty?: (data: T) => boolean;
  /** Skip fetching entirely (e.g. a panel that is closed). */
  enabled?: boolean;
}

function defaultIsEmpty(data: unknown): boolean {
  return Array.isArray(data) && data.length === 0;
}

/**
 * Fetch JSON with an explicit four-state result.
 *
 * @param url      Request URL, or null to stay idle.
 * @param select   Map the parsed body to what the component actually renders.
 */
export function useAsync<T>(
  url: string | null,
  select: (body: any) => T,
  options: UseAsyncOptions<T> = {}
): AsyncState<T> {
  const { isEmpty = defaultIsEmpty, enabled = true } = options;

  const [status, setStatus] = useState<AsyncStatus>("loading");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Held in refs so changing an inline `select`/`isEmpty` lambda on every render
  // does not restart the request.
  const selectRef = useRef(select);
  const isEmptyRef = useRef(isEmpty);
  selectRef.current = select;
  isEmptyRef.current = isEmpty;

  useEffect(() => {
    if (!url || !enabled) return;

    const controller = new AbortController();
    let live = true;
    setStatus("loading");
    setError(null);

    (async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        const body = await res.json().catch(() => null);
        if (!live) return;
        if (!res.ok) {
          throw new Error(body?.error || `Request failed (${res.status}).`);
        }
        const selected = selectRef.current(body);
        setData(selected);
        setStatus(isEmptyRef.current(selected) ? "empty" : "ready");
      } catch (e: any) {
        if (!live || e?.name === "AbortError") return;
        setData(null);
        setError(e?.message || "Something went wrong loading this.");
        setStatus("error");
      }
    })();

    return () => {
      live = false;
      controller.abort();
    };
  }, [url, enabled, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { status, data, error, reload };
}
