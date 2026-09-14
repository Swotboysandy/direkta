"use client";

import { useEffect, useState } from "react";

export interface H3Live {
  connected: boolean;
  error?: string;
  /** The ComfyUI node currently executing, when one is. */
  node?: string;
  /** Sampler progress within the running job. */
  step?: number;
  steps?: number;
  /** Jobs waiting, including the running one. */
  queued?: number;
  /** Latest latent preview, as a data URL. Only present when the pod runs with
   *  --preview-method; its absence is a server flag, not a fault. */
  preview?: string;
  /** When the running job started, for elapsed/ETA. */
  startedAt?: number;
}

type Listener = (state: H3Live) => void;

/* One feed, shared.
 *
 * Both the Director dock and the shot inspector want this, and each used to open
 * its own EventSource — which meant two SSE routes, two websockets to the pod,
 * and every latent preview base64-decoded twice while a render was already
 * saturating the box. The feed is read-only and identical for every consumer, so
 * there is no reason for more than one.
 *
 * The connection opens on the first subscriber and closes on the last, so a page
 * with no monitor mounted holds nothing open. */
let state: H3Live = { connected: false };
let source: EventSource | null = null;
const listeners = new Set<Listener>();
const onFinish = new Set<() => void>();

function publish(next: Partial<H3Live>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
}

function connect() {
  if (source) return;
  const es = new EventSource("/api/minimax-h3/stream");
  source = es;

  const on = (name: string, handler: (data: any) => void) =>
    es.addEventListener(name, (event) => {
      try {
        handler(JSON.parse((event as MessageEvent).data));
      } catch {
        /* the text channel is JSON only; anything else is not ours */
      }
    });

  on("open", () => publish({ connected: true, error: undefined }));
  on("error", (d) => publish({ connected: false, error: d?.message }));
  on("status", (d) => publish({ queued: d?.status?.exec_info?.queue_remaining }));
  on("execution_start", () => publish({ startedAt: Date.now(), step: 0, preview: undefined }));
  on("executing", (d) => {
    if (d?.node == null) {
      // A null node marks the end of a job, not a node without an id — the only
      // signal that a result now exists to be shown.
      publish({ node: undefined, step: undefined, steps: undefined, startedAt: undefined });
      onFinish.forEach((fn) => fn());
    } else {
      publish({ node: String(d.node) });
    }
  });
  on("progress", (d) => publish({ step: d?.value, steps: d?.max }));
  on("preview", (d) => publish({ preview: d?.image }));

  es.onerror = () => publish({ connected: false });
}

function disconnect() {
  try {
    source?.close();
  } catch {
    /* already gone */
  }
  source = null;
  state = { connected: false };
}

/** Subscribe to the live generation feed. Pass `onFinished` to be called when a
 *  job completes — it is held by reference, so an inline callback is fine. */
export function useH3Live(onFinished?: () => void): H3Live {
  const [local, setLocal] = useState<H3Live>(state);

  useEffect(() => {
    listeners.add(setLocal);
    connect();
    setLocal(state);
    return () => {
      listeners.delete(setLocal);
      if (listeners.size === 0) disconnect();
    };
  }, []);

  useEffect(() => {
    if (!onFinished) return;
    onFinish.add(onFinished);
    return () => {
      onFinish.delete(onFinished);
    };
  }, [onFinished]);

  return local;
}

/** Seconds since the running job started, ticking once per second. Returns 0
 *  when nothing is running. Separate from the feed so a component that only
 *  wants progress does not re-render every second. */
export function useElapsed(startedAt?: number): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.round((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}
