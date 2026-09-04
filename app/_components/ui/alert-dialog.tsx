"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { Button } from "./button";
import { cn } from "@/lib/utils";

/**
 * Confirmation for anything destructive or expensive (brief §71).
 *
 * Two ways in. The components below compose like shadcn's. The `useConfirm`
 * hook is for the six places that used to call `window.confirm()` inside an
 * async handler: it returns a promise, so `if (!(await confirm({...}))) return`
 * drops in where the old call was, and the dialog explains the impact instead
 * of asking a bare question.
 */

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-(--z-modal) bg-black/60 ui-fade" />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-(--z-modal) w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2",
          "rounded-overlay bg-surface-overlay text-fg-primary shadow-(--shadow-3) ui-pop p-5 focus:outline-none",
          className
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn("text-[15px] font-semibold tracking-[-0.01em] text-balance", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn("mt-1.5 mb-0 text-[13px] leading-relaxed text-fg-secondary text-pretty whitespace-pre-line", className)}
      {...props}
    />
  );
}

const AlertDialogCancel = AlertDialogPrimitive.Cancel;
const AlertDialogAction = AlertDialogPrimitive.Action;

/* ------------------------------------------------------------------ hook */

export interface ConfirmOptions {
  /** What is about to happen, as a short statement. */
  title: string;
  /** The impact. Say what is lost and what survives. */
  description?: string;
  /** The verb on the confirming button. Defaults to "Confirm". */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive actions get the red button; expensive ones do not. */
  destructive?: boolean;
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

const ConfirmContext = React.createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState<Pending | null>(null);

  const confirm = React.useCallback(
    (o: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...o, resolve });
      }),
    []
  );

  const settle = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && settle(false)}>
        {pending && (
          <AlertDialogContent>
            <AlertDialogTitle>{pending.title}</AlertDialogTitle>
            {pending.description && <AlertDialogDescription>{pending.description}</AlertDialogDescription>}
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialogCancel asChild>
                <Button intent="ghost" onClick={() => settle(false)}>
                  {pending.cancelLabel ?? "Cancel"}
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button intent={pending.destructive ? "danger" : "primary"} onClick={() => settle(true)}>
                  {pending.confirmLabel ?? "Confirm"}
                </Button>
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

/** `const confirm = useConfirm(); if (!(await confirm({ title, description }))) return;` */
export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm needs a <ConfirmProvider> above it");
  return ctx;
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction
};
