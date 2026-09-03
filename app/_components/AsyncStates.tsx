"use client";

import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

/** Placeholders and fallbacks shared by every async surface.
 *
 *  A skeleton is only useful if it occupies the same space the real content
 *  will: a generic grey bar that gets replaced by a 16:9 card still causes the
 *  layout jump it was supposed to prevent. So these mirror the geometry of the
 *  things they stand in for — aspect ratio, column count, row height — rather
 *  than being decorative shimmer.
 */

/** A run of 16:9 media cards, matching .dash-frames / the asset canvas. */
export function SkeletonFrames({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("dash-frames", className)} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="aspect-video w-full rounded-[var(--r-md)]" />
      ))}
    </div>
  );
}

/** One large 16:9 frame — the dashboard hero. */
export function SkeletonHeroFrame() {
  return <Skeleton className="aspect-video w-full rounded-[var(--r-lg)]" aria-hidden="true" />;
}

/** Text rows with a leading glyph — activity log and crew list. */
export function SkeletonRows({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col", className)} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 py-3"
          style={{ borderBottom: "1px solid var(--cream-deep)" }}
        >
          <Skeleton className="size-3.5 rounded-full" />
          {/* Varying widths so a stack of rows doesn't read as a solid block. */}
          <Skeleton className="h-3.5" style={{ width: `${[92, 74, 84, 63, 88][i % 5]}%` }} />
          <Skeleton className="h-2.5 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Generic paragraph placeholder for prose panes. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="h-3.5" style={{ width: i === lines - 1 ? "58%" : "100%" }} />
      ))}
    </div>
  );
}

/** What a failed fetch shows. States what broke and offers the one action
 *  that can fix it, rather than an apology. */
export function ErrorState({
  message,
  onRetry,
  className
}: {
  message: string | null;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 py-4", className)} role="alert">
      <span className="text-[13px]" style={{ color: "var(--signal-danger)" }}>
        {message || "This didn't load."}
      </span>
      {onRetry && (
        <button className="dash-link" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/** What a successful-but-empty fetch shows: what's missing and where to go. */
export function EmptyState({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("dash-empty", className)}>{children}</p>;
}

/** Stand-in for a whole workspace while its code chunk downloads, or while the
 *  project bundle is in flight. Mirrors the dashboard's rhythm — title block,
 *  hero frame, a strip — so the page does not reflow when the real thing lands.
 *  The previous placeholder was an empty div, which read as a broken screen. */
export function SkeletonWorkspace() {
  return (
    <div className="main-inner dash" aria-busy="true" aria-live="polite">
      <div className="dash-head">
        <div className="dash-head-copy">
          <Skeleton className="h-2.5 w-32" />
          <Skeleton className="h-9 w-[min(420px,70%)]" />
          <Skeleton className="h-4 w-[min(560px,90%)]" />
          <Skeleton className="h-3 w-[min(380px,60%)]" />
        </div>
      </div>
      <SkeletonHeroFrame />
      <SkeletonFrames count={5} />
    </div>
  );
}
