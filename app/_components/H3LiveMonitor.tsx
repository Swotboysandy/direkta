"use client";

import { useH3Live, useElapsed } from "./useH3Live";

/** Live view of what the H3 pod is doing right now.
 *
 *  ComfyUI reports the sampler's step count and emits latent previews while it
 *  works, so a render is watchable instead of a spinner. Nothing here starts or
 *  stops a job; it only observes.
 *
 *  The feed itself is shared with the Director dock's monitor — see useH3Live. */
export function H3LiveMonitor() {
  const live = useH3Live();
  const elapsed = useElapsed(live.startedAt);

  const running = live.step != null && live.steps != null && live.steps > 0;
  const pct = running ? Math.min(100, Math.round((live.step! / live.steps!) * 100)) : 0;
  // Step pace is steady on this graph, so remaining time is a fair estimate.
  const eta =
    running && live.step! > 0 && elapsed > 0
      ? Math.round((elapsed / live.step!) * (live.steps! - live.step!))
      : null;

  return (
    <div className="h3-live">
      <div className="h3-live-head">
        <span className={`h3-live-dot${live.connected ? " is-on" : ""}`} />
        <strong>Pod</strong>
        <span className="h3-live-meta">
          {live.error
            ? live.error
            : live.connected
              ? running
                ? `rendering · node ${live.node ?? "?"}`
                : "connected · idle"
              : "connecting…"}
        </span>
        {live.queued != null && <span className="h3-live-meta">queue {live.queued}</span>}
      </div>

      {running && (
        <>
          <div className="h3-live-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
          <div className="h3-live-meta">
            step {live.step} / {live.steps} · {elapsed}s elapsed
            {eta != null && ` · ~${eta}s left`}
          </div>
        </>
      )}

      {live.preview && (
        // Latent preview straight off the pod as a data URL; next/image cannot help here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="h3-live-preview"
          src={live.preview}
          alt="Latest preview frame from the running render"
        />
      )}
    </div>
  );
}
