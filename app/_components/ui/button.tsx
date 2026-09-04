"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * The button. Four intents, two sizes, one radius.
 *
 * `primary` is the one accented action on a view; everything else is quiet.
 * `danger` is reserved for destructive confirmations inside an AlertDialog —
 * a red button loose on a page is a trap, not an affordance.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-control font-medium whitespace-nowrap select-none " +
    "transition-[background-color,color,opacity] duration-(--dur-1) ease-(--ease-out-fylmer) " +
    "disabled:pointer-events-none disabled:opacity-45 " +
    "focus-visible:outline-none focus-visible:shadow-(--shadow-focus)",
  {
    variants: {
      intent: {
        primary: "bg-brand text-on-brand hover:bg-brand-hover",
        secondary: "bg-surface-raised text-fg-primary hover:bg-surface-3",
        ghost: "bg-transparent text-fg-secondary hover:bg-surface-raised hover:text-fg-primary",
        danger: "bg-status-error text-white hover:brightness-110"
      },
      size: {
        sm: "h-7 px-2.5 text-[12px]",
        md: "h-8 px-3 text-[13px]"
      }
    },
    defaultVariants: { intent: "secondary", size: "md" }
  }
);

export type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, intent, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} data-slot="button" className={cn(buttonVariants({ intent, size }), className)} {...props} />;
}

/**
 * A button that is only a glyph. `label` is required, not optional: it is the
 * accessible name and the tooltip, and a glyph without one is a guess.
 */
export function IconButton({
  label,
  className,
  size = "md",
  intent = "ghost",
  children,
  ...props
}: Omit<ButtonProps, "children"> & { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      data-slot="icon-button"
      aria-label={label}
      title={label}
      className={cn(
        buttonVariants({ intent, size }),
        size === "sm" ? "w-7 px-0" : "w-8 px-0",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { buttonVariants };
