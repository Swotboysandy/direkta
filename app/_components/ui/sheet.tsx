"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "../icons";
import { cn } from "@/lib/utils";

/**
 * A panel that slides in from an edge. Same primitive as Dialog, so it has
 * the same focus and Escape behaviour; only the placement differs. Used for
 * the contextual inspector below 1280px and for settings that do not need
 * the centre of the screen.
 */

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const SIDE = {
  right: "inset-y-0 right-0 h-full w-[min(420px,100vw)] border-l ui-slide-right",
  left: "inset-y-0 left-0 h-full w-[min(420px,100vw)] border-r ui-slide-left",
  bottom: "inset-x-0 bottom-0 max-h-[85dvh] border-t rounded-t-overlay ui-slide-up"
} as const;

function SheetContent({
  side = "right",
  className,
  children,
  title,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: keyof typeof SIDE; title: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-(--z-modal) bg-black/50 ui-fade" />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-(--z-modal) flex flex-col bg-surface-overlay text-fg-primary border-border-subtle shadow-(--shadow-3)",
          "pb-[env(safe-area-inset-bottom)] focus:outline-none",
          SIDE[side],
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <DialogPrimitive.Title className="text-[13px] font-semibold">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="inline-flex size-7 items-center justify-center rounded-control text-fg-tertiary hover:bg-surface-raised hover:text-fg-primary focus-visible:outline-none focus-visible:shadow-(--shadow-focus)"
            aria-label="Close"
          >
            <X size={14} />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent };
