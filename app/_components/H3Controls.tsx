"use client";

import { useEffect, useState } from "react";
import type { H3ContinuityMode } from "../../lib/agents/h3-settings";

export interface H3ShotOptions { continuityMode: H3ContinuityMode; endFrame: boolean }

export function H3Controls({ duration, aspectRatio, value, onChange, onReady }: {
  duration: number;
  aspectRatio: string;
  value: H3ShotOptions;
  onChange: (value: H3ShotOptions) => void;
  onReady: (ready: boolean) => void;
}) {
  const [preview, setPreview] = useState<{ error?: string; estimatedCostUsd?: number; requiredBalanceUsd?: number; balanceUsd?: number; canStart?: boolean; promptExpansionAvailable?: boolean } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setPreview(null);
    onReady(false);
    fetch("/api/minimax-h3/preflight", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ durationSeconds: duration, aspectRatio }), signal: controller.signal
    }).then(async (res) => {
      const result = await res.json();
      if (controller.signal.aborted) return;
      setPreview(result);
      onReady(res.ok && result.canStart === true);
    }).catch(() => {
      if (!controller.signal.aborted) setPreview({ error: "Could not verify RunPod balance. Generation stays blocked." });
    });
    return () => controller.abort();
  }, [duration, aspectRatio, onReady]);
  return <fieldset style={{ border: "1px solid var(--cream-deep)", borderRadius: "var(--r-md)", padding: 10, margin: 0, fontSize: 12 }}>
    <legend>H3 continuity and budget</legend>
    <label style={{ display: "grid", gap: 5 }}>
      Opening
      <select aria-label="H3 shot continuity" value={value.continuityMode} onChange={(e) => onChange({ continuityMode: e.target.value as H3ContinuityMode, endFrame: false })}>
        <option value="cut">Deliberate cut — this storyboard frame</option>
        <option value="continue">Continue — previous clip’s final frame</option>
      </select>
    </label>
    <label style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input type="checkbox" checked={value.endFrame} disabled={value.continuityMode !== "continue"}
        onChange={(e) => onChange({ ...value, endFrame: e.target.checked })} />
      Also pin the next storyboard frame
    </label>
    <p style={{ color: "var(--mute)", margin: "8px 0", lineHeight: 1.45 }}>Pin only a compatible end state in the same action. Matching output pixels are not guaranteed.</p>
    <div role="status" aria-live="polite" style={{ lineHeight: 1.45 }}>
      {!preview ? "Checking cost without starting the pod…" : preview.error ||
        `Estimated $${preview.estimatedCostUsd?.toFixed(2)} · balance $${preview.balanceUsd?.toFixed(2)} · required with reserve $${preview.requiredBalanceUsd?.toFixed(2)}.`}
      {preview && !preview.error && !preview.canStart && <p>Insufficient balance. The pod will stay stopped.</p>}
      {preview?.promptExpansionAvailable === false && <p style={{ color: "var(--accent)" }}>No text-model key is configured. H3 will use your original direction without prompt expansion.</p>}
    </div>
    <p style={{ color: "var(--mute)", marginBottom: 0 }}>Includes startup allowance. This estimate is not a hard billing cap.</p>
  </fieldset>;
}
