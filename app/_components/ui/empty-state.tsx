"use client";

import * as React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

/**
 * An empty state answers three questions or it is not finished (brief §40):
 * what this is, why it is empty, what to do next. All three are required
 * props, so a caller cannot ship "Nothing here yet" with no way forward.
 *
 * It is not a card. It is a short block of text with one action, left-aligned
 * like the content it stands in for.
 */
export function EmptyState({
  title,
  why,
  action,
  secondary,
  className
}: {
  title: string;
  why: string;
  action: { label: string; onClick: () => void; disabled?: boolean };
  secondary?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div className={cn("flex max-w-[52ch] flex-col items-start gap-3 py-6", className)} role="status">
      <div className="flex flex-col gap-1">
        <p className="m-0 text-[14px] font-semibold text-fg-primary text-balance">{title}</p>
        <p className="m-0 text-[13px] leading-relaxed text-fg-secondary text-pretty">{why}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button intent="primary" size="sm" onClick={action.onClick} disabled={action.disabled}>
          {action.label}
        </Button>
        {secondary && (
          <Button intent="ghost" size="sm" onClick={secondary.onClick}>
            {secondary.label}
          </Button>
        )}
      </div>
    </div>
  );
}
