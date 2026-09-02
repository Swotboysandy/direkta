"use client";

import { useEffect, useRef, useState } from "react";

interface LiveState {
  connected: boolean;
  error?: string;
  node?: string;
  step?: number;
  steps?: number;
  queueRemaining?: number;
  preview?: string;
  startedAt?: number;
}

/** Live view of what the H3 pod is doing right now.
 *
 *  ComfyUI reports the sampler's step count and emits latent previews while it
 *  works, so a render is watchable instead of a spinner. Nothing here starts or
 *  stops a job; it only observes. */
export function H3LiveMonitor() {
  const [state, setState] = useState<LiveState>({ connected: false });
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | undefined>(undefined);

  useEffect(() => {
    const source = new EventSource("/api/minimax-h3/stream");
    const on = (name: string, handler: (data: any) => void) =>
      source.addEventListener(name, (event) => {
        try { handler(JSON.parse((event as MessageEvent).data)); } catch {}
      });

    on("open", () => setState((s) => ({ ...s, connected: true, error: undefined })));
    on("error", (d) => setState((s) => ({ ...s, connected: false, error: d.message })));
    on("status", (d) =>
      setState((s) => ({ ...s, queueRemaining: d?.status?.exec_info?.queue_remaining })));
    on("execution_start", () => {
      startedAt.current = Date.now();
      setState((s) => ({ ...s, step: 0, preview: undefined }));
    });
    on("executing", (d) => {
      if (d?.node == null) {
        startedAt.current = undefined;
        setState((s) => ({ ...s, node: undefined, step: undefined, steps: undefined }));
      } else {
        setState((s) => ({ ...s, node: String(d.node) }));
      }
    });
    on("progress", (d) => setState((s) => ({ ...s, step: d.value, steps: d.max })));
    on("preview", (d) => setState((s) => ({ ...s, preview: d.image })));

    source.onerror = () => setState((s) => ({ ...s, connected: false }));
    const tick = setInterval(() => {
      setElapsed(startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0);
    }, 1000);

    return () => { clearInterval(tick); source.close(); };
  }, []);

  const running = state.step != null && state.steps != null && state.steps > 0;
  const pct = running ? Math.round((state.step! / state.steps!) * 100) : 0;
  // Step pace is steady on this graph, so remaining time is a fair estimate.
  const eta = running && state.step! > 0 && elapsed > 0
    ? Math.round((elapsed / state.step!) * (state.steps! - state.step!))
    : null;

  return (
    <div className="h3-live">
      <div className="h3-live-head">
        <span className={`h3-live-dot${state.connected ? " is-on" : ""}`} />
        <strong>Pod</strong>
        <span className="h3-live-meta">
          {state.error
            ? state.error
            : state.connected
              ? running ? `rendering · node ${state.node ?? "?"}` : "connected · idle"
              : "connecting…"}
        </span>
        {state.queueRemaining != null && (
          <span className="h3-live-meta">queue {state.queueRemaining}</span>
        )}
      </div>

      {running && (
        <>
          <div className="h3-live-bar"><span style={{ width: `${pct}%` }} /></div>
          <div className="h3-live-meta">
            step {state.step} / {state.steps} · {elapsed}s elapsed
            {eta != null && ` · ~${eta}s left`}
          </div>
        </>
      )}

      {state.preview && (
        // Latent preview straight off the pod as a data URL; next/image cannot help here.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="h3-live-preview" src={state.preview} alt="Latest preview frame from the running render" />
      )}
    </div>
  );
}
