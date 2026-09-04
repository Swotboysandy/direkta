"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * An error shown next to the thing that failed (brief §41), not in a toast
 * that drifts off the corner of the screen. States what went wrong in plain
 * words; the technical detail, if any, is there but folded.
 */
export function InlineError({
  message,
  detail,
  onRetry,
  className
}: {
  message: string;
  detail?: string | null;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-1 rounded-control border-l-2 border-status-error bg-status-error/8 px-3 py-2 text-[13px]",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-fg-primary">{message}</span>
        {onRetry && (
          <button type="button" className="text-brand hover:underline" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
      {detail && (
        <details className="text-[12px] text-fg-tertiary">
          <summary className="cursor-pointer select-none">Details</summary>
          <pre className="mt-1 max-h-40 overflow-auto font-mono text-[11px] whitespace-pre-wrap">{detail}</pre>
        </details>
      )}
    </div>
  );
}
