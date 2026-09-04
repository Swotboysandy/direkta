"use client";

import { cn } from "@/lib/utils";

/**
 * One status vocabulary for the whole product (brief §73).
 *
 * Three domains, each with a fixed set of words. A status is always a dot and
 * a label together, so colour is never the only signal; the dot carries the
 * hue, the label carries the meaning. It is a tag, not a pill: 6px corners,
 * mono eyebrow type, no fill unless the state is active or bad.
 *
 * This replaces three systems that said the same things in different clothes:
 * `.pip-state[data-status]`, Casting's `toneColors()` and Stitch's
 * `TRANSITION_PILL_COLOR`.
 */

export type CreativeStatus = "Draft" | "Approved" | "Rejected" | "Locked";
export type GenerationStatus = "Queued" | "Rendering" | "Processing" | "Complete" | "Failed" | "Cancelled";
export type GpuStatus = "Offline" | "Starting" | "Ready" | "Busy" | "Stopping" | "Error";

type Tone = "neutral" | "active" | "good" | "bad" | "info";

const TONE: Record<string, Tone> = {
  // creative
  Draft: "neutral",
  Approved: "good",
  Rejected: "bad",
  Locked: "info",
  // generation
  Queued: "neutral",
  Rendering: "active",
  Processing: "active",
  Complete: "good",
  Failed: "bad",
  Cancelled: "neutral",
  // gpu
  Offline: "neutral",
  Starting: "active",
  Ready: "good",
  Busy: "active",
  Stopping: "active",
  Error: "bad"
};

const TONE_CLASS: Record<Tone, string> = {
  neutral: "text-fg-tertiary [--dot:var(--text-tertiary)]",
  active: "text-status-warning bg-status-warning/15 [--dot:var(--status-warning)]",
  good: "text-status-success bg-status-success/12 [--dot:var(--status-success)]",
  bad: "text-status-error bg-status-error/12 [--dot:var(--status-error)]",
  info: "text-status-info [--dot:var(--status-info)]"
};

type Props =
  | { domain: "creative"; value: CreativeStatus; className?: string; detail?: string }
  | { domain: "generation"; value: GenerationStatus; className?: string; detail?: string }
  | { domain: "gpu"; value: GpuStatus; className?: string; detail?: string };

export function Status({ value, className, detail }: Props) {
  const tone = TONE[value] ?? "neutral";
  const live = tone === "active";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-control px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.02em] whitespace-nowrap",
        TONE_CLASS[tone],
        className
      )}
      data-tone={tone}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full bg-(--dot)", live && "status-dot-live")}
      />
      <span>{value}</span>
      {detail && <span className="normal-case tracking-normal text-fg-tertiary">· {detail}</span>}
    </span>
  );
}
