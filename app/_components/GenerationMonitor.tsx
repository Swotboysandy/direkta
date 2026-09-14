"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SPRING_SMOOTH } from "./motion";
import { useH3Live, useElapsed } from "./useH3Live";

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
 * else. The preview image needs the pod started with --preview-method; without
 * it the panel still works, it just has no picture to show.
 */
export function GenerationMonitor({ onFinished }: { onFinished?: () => void }) {
  const live = useH3Live(onFinished);
  const elapsed = useElapsed(live.startedAt);

  const running = live.step != null && live.steps != null && live.steps > 0;
  const pct = running ? Math.min(100, Math.round((live.step! / live.steps!) * 100)) : 0;
  // Steps on this graph are evenly paced, so remaining time is a fair estimate
  // rather than a guess.
  const eta =
    running && live.step! > 0 && elapsed > 0
      ? Math.round((elapsed / live.step!) * (live.steps! - live.step!))
      : null;

  const queued = live.queued ?? 0;
  const show = running || queued > 0;

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
              <span className="genmon-label">{running ? "Generating" : "Queued"}</span>
              {running && (
                <span className="genmon-nums">
                  {live.step}/{live.steps} · {elapsed}s{eta != null ? ` · ~${eta}s left` : ""}
                </span>
              )}
              {!running && queued > 0 && <span className="genmon-nums">{queued} in queue</span>}
            </div>

            <div className="genmon-track">
              <span style={{ width: `${pct}%` }} />
            </div>

            {queued > 1 && running && (
              <span className="genmon-after">{queued - 1} more after this</span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
