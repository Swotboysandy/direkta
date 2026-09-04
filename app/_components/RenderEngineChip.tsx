"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Status, type GpuStatus } from "./ui/status";
import { cn } from "@/lib/utils";

export interface H3Status {
  ok: boolean;
  reason?: string;
  podId?: string;
  podStatus: string;
  warm: boolean;
  balanceUsd: number | null;
  hourlyRateUsd?: number;
  canStart?: boolean;
  estimatedCostUsd?: number;
}

/**
 * The GPU, in the language of the people using it (brief §5, §36).
 *
 * H3 runs on a rented pod that bills by the hour and can run out of credit
 * mid-project, so "can I render right now" belongs permanently on screen. But
 * `POD: RUNNING / A100-SXM4-80GB` is a fact about infrastructure, and this is
 * a film tool: the chip says Render Engine · Ready, and the pod id, hourly
 * rate and estimate wait behind a click for whoever needs them.
 *
 * Polls slowly: each read is two RunPod calls and the state changes on the
 * order of minutes. Degrades to "unavailable" rather than disappearing.
 */
export function useRenderEngine(intervalMs = 60_000) {
  const [h3, setH3] = useState<H3Status | null>(null);
  useEffect(() => {
    let live = true;
    const read = async () => {
      try {
        const res = await fetch("/api/minimax-h3/status");
        const body = await res.json();
        if (live) setH3(body);
      } catch {
        if (live) setH3({ ok: false, podStatus: "UNKNOWN", warm: false, balanceUsd: null });
      }
    };
    void read();
    const t = setInterval(read, intervalMs);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [intervalMs]);
  return h3;
}

/** The brief's state map. Rendering-in-progress is added by the Dock, which
 *  is the only thing that knows a shot is mid-flight. */
export function engineState(h3: H3Status | null): { status: GpuStatus | null; label: string } {
  if (!h3) return { status: null, label: "Checking render engine" };
  if (!h3.ok) return { status: "Error", label: "Render engine unavailable" };
  if (h3.warm) return { status: "Ready", label: "Render Engine" };
  if (h3.podStatus === "RUNNING") return { status: "Starting", label: "Preparing render engine" };
  return { status: "Offline", label: "Render Engine" };
}

export function RenderEngineChip({ h3, className }: { h3: H3Status | null; className?: string }) {
  const { status, label } = engineState(h3);
  const balance = typeof h3?.balanceUsd === "number" ? h3.balanceUsd : null;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            // bg-transparent is not redundant: preflight is not loaded, so a
            // bare <button> keeps the browser's grey ButtonFace fill.
            "engine-chip inline-flex h-8 items-center gap-2 rounded-control bg-transparent px-2.5 text-[12px] text-fg-secondary",
            "hover:bg-surface-raised focus-visible:outline-none focus-visible:shadow-(--shadow-focus)",
            className
          )}
          aria-label={`${label}${status ? ` · ${status}` : ""}. Details`}
        >
          <span className="hidden md:inline">{label}</span>
          {status ? (
            <Status domain="gpu" value={status} />
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.02em] text-fg-tertiary">…</span>
          )}
          {balance !== null && (
            <span className="font-mono text-[11px] tabular-nums text-fg-primary">${balance.toFixed(2)}</span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-(--z-overlay) w-[300px] rounded-overlay bg-surface-overlay p-4 text-[12px] text-fg-secondary shadow-(--shadow-3) ui-pop-anchor"
        >
          <p className="mb-3 text-[13px] font-semibold text-fg-primary">Render engine</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-[11px]">
            <dt className="text-fg-tertiary">Model</dt>
            <dd>MiniMax H3 · ComfyUI</dd>
            <dt className="text-fg-tertiary">Pod</dt>
            <dd className="truncate">{h3?.podId ?? "—"}</dd>
            <dt className="text-fg-tertiary">State</dt>
            <dd>
              {h3?.podStatus ?? "—"}
              {h3?.warm ? " · warm" : ""}
            </dd>
            <dt className="text-fg-tertiary">Balance</dt>
            <dd className="tabular-nums">{balance !== null ? `$${balance.toFixed(3)}` : "—"}</dd>
            <dt className="text-fg-tertiary">Rate</dt>
            <dd className="tabular-nums">{h3?.hourlyRateUsd ? `$${h3.hourlyRateUsd.toFixed(2)} / hr` : "—"}</dd>
            <dt className="text-fg-tertiary">One shot</dt>
            <dd className="tabular-nums">
              {typeof h3?.estimatedCostUsd === "number" ? `≈ $${h3.estimatedCostUsd.toFixed(2)}` : "—"}
              {h3?.canStart === false ? " · below the balance needed" : ""}
            </dd>
          </dl>
          {h3?.reason && <p className="mt-3 text-status-error">{h3.reason}</p>}
          <p className="mt-3 text-[11px] text-fg-tertiary">
            The engine starts when a shot is generated and stops when it finishes. Nothing bills while it is offline.
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
