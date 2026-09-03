"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING_SMOOTH } from "./motion";
import { X } from "./icons";

interface Live {
  connected: boolean;
  /** Sampler progress within the running job. */
  step?: number;
  steps?: number;
  /** Jobs waiting behind this one. */
  queued?: number;
  /** Latest latent preview, when the server is emitting them. */
  preview?: string;
  error?: string;
}

/**
 * What the generator is doing, right now.
 *
 * The pipeline already streamed this — ComfyUI reports the sampler's step count
 * over its own websocket and the app has relayed it as SSE since the H3 work —
 * but it was rendered by one small panel inside the Stitch inspector, so a
 * render that takes fifteen minutes looked like nothing happening from anywhere
 * else in the app.
 *
 * It only appears while something is running, sits above the composer where the
 * work was started from, and reports the two numbers that matter: how far
 * through this shot is, and how many are behind it.
 *
 * Progress reaches this at all only because generation and this feed share one
 * ComfyUI client id — that service addresses progress events to the submitting
 * client, so a listener using any other id sees the queue count and nothing
 * else.
 */
export function GenerationMonitor({ onFinished }: { onFinished?: () => void }) {
  const [live, setLive] = useState<Live>({ connected: false });
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | undefined>(undefined);
  // Held in a ref so the subscription is not torn down and rebuilt each time
  // the parent re-renders with a new inline callback.
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;

  useEffect(() => {
    const source = new EventSource("/api/minimax-h3/stream");
    const on = (name: string, handler: (data: any) => void) =>
      source.addEventListener(name, (event) => {
        try {
          handler(JSON.parse((event as MessageEvent).data));
        } catch {
          /* the text channel is JSON only; anything else is not ours */
        }
      });

    on("open", () => setLive((l) => ({ ...l, connected: true, error: undefined })));
    on("error", (d) => setLive((l) => ({ ...l, connected: false, error: d?.message })));
    on("status", (d) =>
      setLive((l) => ({ ...l, queued: d?.status?.exec_info?.queue_remaining })));
    on("execution_start", () => {
      startedAt.current = Date.now();
      setLive((l) => ({ ...l, step: 0, preview: undefined }));
    });
    on("executing", (d) => {
      if (d?.node == null) {
        // A null node marks the end of a job, not a node with no id — which is
        // the only signal that a result now exists to be shown.
        startedAt.current = undefined;
        setLive((l) => ({ ...l, step: undefined, steps: undefined, preview: undefined }));
        finishedRef.current?.();
      }
    });
    on("progress", (d) => setLive((l) => ({ ...l, step: d?.value, steps: d?.max })));
    on("preview", (d) => setLive((l) => ({ ...l, preview: d?.image })));

    const tick = setInterval(() => {
      setElapsed(startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0);
    }, 1000);

    return () => {
      clearInterval(tick);
      source.close();
    };
  }, []);

  const running = live.step != null && live.steps != null && live.steps > 0;
  const pct = running ? Math.min(100, Math.round((live.step! / live.steps!) * 100)) : 0;
  // Steps on this graph are evenly paced, so remaining time is a fair estimate
  // rather than a guess.
  const eta =
    running && live.step! > 0 && elapsed > 0
      ? Math.round((elapsed / live.step!) * (live.steps! - live.step!))
      : null;

  const show = running || (live.queued ?? 0) > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="genmon"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={SPRING_SMOOTH}
          role="status"
          aria-live="polite"
        >
          {live.preview && (
            // Only present when the server runs with a preview method; the panel
            // is useful without it, so its absence is not reported as a fault.
            // eslint-disable-next-line @next/next/no-img-element
            <img className="genmon-preview" src={live.preview} alt="" />
          )}

          <div className="genmon-body">
            <div className="genmon-top">
              <span className="genmon-label">
                {running ? "Generating" : "Queued"}
              </span>
              {running && (
                <span className="genmon-nums">
                  {live.step}/{live.steps} · {elapsed}s{eta != null ? ` · ~${eta}s left` : ""}
                </span>
              )}
              {!running && (live.queued ?? 0) > 0 && (
                <span className="genmon-nums">
                  {live.queued} in queue
                </span>
              )}
            </div>

            <div className="genmon-track">
              <span style={{ width: `${pct}%` }} />
            </div>

            {(live.queued ?? 0) > 1 && running && (
              <span className="genmon-after">{(live.queued ?? 0) - 1} more after this</span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
