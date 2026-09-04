"use client";

import { MediaTile } from "./ui/media-tile";
import { InlineError } from "./ui/inline-error";
import { Button } from "./ui/button";
import type { ToolCost, ToolResult } from "@/lib/agents/director-tools";

/**
 * What the Director is doing, in the language of the person watching
 * (brief §62, §64).
 *
 * Two rules govern everything in this file.
 *
 * **A tool is never named while it runs.** The activity line is the tool's own
 * `running` sentence — "Preparing Shot 08" — and when it finishes the line
 * becomes its `summary`. The tool's name and the arguments it was called with
 * are still there, folded into a disclosure, because a director debugging a bad
 * result needs them; they are just not the headline.
 *
 * **A result that has a shape is drawn, not described.** `render` carries the
 * structure the tool already knows — beats, shots, faces, a cost, a plan — and
 * each one has a form here. Falling back to the summary line is what happens
 * when a tool returns nothing drawable, not the default.
 *
 * Nothing here is a card. The conversation is one column of text at one
 * measure; the only structure is space, a hairline where a section genuinely
 * begins, and the single accent on the one button that spends money.
 */

/* ── Shared bits ──────────────────────────────────────────────────────── */

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

function mediaKind(url: string, hint?: string): "image" | "video" {
  if (hint === "video" || hint === "clip") return "video";
  if (hint === "image" || hint === "frame") return "image";
  return VIDEO_EXT.test(url) ? "video" : "image";
}

function money(n: number | null | undefined): string | null {
  return typeof n === "number" && Number.isFinite(n) ? `$${n.toFixed(2)}` : null;
}

/** What a cost means, said once, the same way everywhere. */
export const COST_WORD: Record<ToolCost, string> = {
  free: "runs immediately",
  spend: "needs approval · spends money",
  destructive: "needs approval · cannot be undone"
};

/** The tool's name and arguments — present, but not the headline (§64). */
export function Technical({ name, args }: { name: string; args: unknown }) {
  let printed: string;
  try {
    printed = args === undefined || args === null ? "" : JSON.stringify(args, null, 1);
  } catch {
    printed = String(args);
  }
  return (
    <details className="dx-tech">
      <summary>Technical detail</summary>
      <pre>
        {name}
        {printed ? `\n${printed}` : ""}
      </pre>
    </details>
  );
}

/* ── The drawn results (§62) ──────────────────────────────────────────── */

function Beats({ beats }: { beats: Extract<NonNullable<ToolResult["render"]>, { as: "beats" }>["beats"] }) {
  if (beats.length === 0) return <p className="dx-empty">No beats.</p>;
  return (
    <ol className="dx-beats">
      {beats.map((b, i) => (
        <li key={`${b.n}-${i}`}>
          <span className="dx-beats-n">{String(b.n).padStart(2, "0")}</span>
          <span className="dx-beats-body">
            <span className="dx-beats-title">{b.title}</span>
            {b.heading && <span className="dx-beats-heading">{b.heading}</span>}
            {b.summary && <span className="dx-beats-summary">{b.summary}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Shots and assets are the same object to a reader: a picture and its name. */
function Strip({
  items
}: {
  items: Array<{ id: string; label: string; url?: string | null; hint?: string; note?: string | null }>;
}) {
  if (items.length === 0) return <p className="dx-empty">Nothing to show.</p>;
  return (
    <ul className="dx-strip">
      {items.map((it) => (
        <li key={it.id} className="dx-strip-item">
          <span className="dx-strip-frame">
            {it.url ? (
              <MediaTile url={it.url} kind={mediaKind(it.url, it.hint)} alt={it.label} className="dx-strip-media" />
            ) : (
              <span className="dx-strip-blank" aria-hidden="true" />
            )}
          </span>
          <span className="dx-strip-name">{it.label}</span>
          {it.note && <span className="dx-strip-note">{it.note}</span>}
        </li>
      ))}
    </ul>
  );
}

function Faces({
  characters
}: {
  characters: Extract<NonNullable<ToolResult["render"]>, { as: "characters" }>["characters"];
}) {
  if (characters.length === 0) return <p className="dx-empty">No cast yet.</p>;
  return (
    <ul className="dx-faces">
      {characters.map((c) => (
        <li key={c.id} className="dx-face">
          <span className="dx-face-img">
            {c.url ? (
              <MediaTile url={c.url} kind={mediaKind(c.url)} alt={c.name} className="dx-face-media" />
            ) : (
              <span className="dx-face-initial">{c.name.slice(0, 1).toUpperCase()}</span>
            )}
          </span>
          <span className="dx-face-name">{c.name}</span>
          <span className="dx-face-note">
            {c.role ?? (c.hasLook === false ? "No look locked" : "")}
            {c.role && c.hasLook === false ? " · no look locked" : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The cost, on one line, never abbreviated away (brief §13, §25). */
export function Estimate({
  estimate
}: {
  estimate: Extract<NonNullable<ToolResult["render"]>, { as: "estimate" }>["estimate"];
}) {
  const cost = money(estimate.costUsd);
  const balance = money(estimate.balanceUsd);
  const blocked = estimate.canStart === false;
  return (
    <p className={`dx-estimate${blocked ? " is-blocked" : ""}`}>
      <span className="dx-estimate-label">{estimate.label}</span>
      <span className="dx-estimate-nums">
        {cost ?? "cost not estimated"}
        {typeof estimate.minutes === "number" ? ` · ≈ ${estimate.minutes} min` : ""}
        {balance ? ` · balance ${balance}` : ""}
      </span>
      {blocked && <span className="dx-estimate-blocked">Below the balance needed to finish this.</span>}
    </p>
  );
}

/** A multi-step intention, before any of it runs (brief §12). */
export function PlanSteps({ steps }: { steps: Array<{ title: string; detail?: string; cost?: ToolCost }> }) {
  if (steps.length === 0) return null;
  return (
    <ol className="dx-plan">
      {steps.map((s, i) => (
        <li key={i}>
          <span className="dx-plan-n">{i + 1}</span>
          <span className="dx-plan-body">
            <span className="dx-plan-title">{s.title}</span>
            {s.detail && <span className="dx-plan-detail">{s.detail}</span>}
            <span className="dx-plan-cost" data-cost={s.cost ?? "free"}>
              {COST_WORD[s.cost ?? "free"]}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Draw a `render` payload, or nothing when there is none. */
export function RenderResult({ render }: { render: ToolResult["render"] }) {
  if (!render) return null;
  switch (render.as) {
    case "beats":
      return <Beats beats={render.beats} />;
    case "shots":
      return (
        <Strip
          items={render.shots.map((s) => ({ id: s.id, label: s.label, url: s.url, note: s.state ?? null }))}
        />
      );
    case "assets":
      return (
        <Strip
          items={render.assets.map((a) => ({ id: a.id, label: a.title, url: a.url, hint: a.kind, note: a.kind }))}
        />
      );
    case "characters":
      return <Faces characters={render.characters} />;
    case "estimate":
      return <Estimate estimate={render.estimate} />;
    case "plan":
      return <PlanSteps steps={render.steps} />;
    case "note":
      return <p className="dx-note">{render.text}</p>;
    default:
      return null;
  }
}

/* ── Tool activity ────────────────────────────────────────────────────── */

export interface ToolView {
  id: string;
  name: string;
  running: string;
  cost: ToolCost;
  args: unknown;
  stage: "running" | "done" | "error";
  result?: ToolResult;
  message?: string;
}

export function ToolActivity({ tool }: { tool: ToolView }) {
  if (tool.stage === "error") {
    return (
      <div className="dx-row">
        <InlineError message={tool.message || "That step did not finish."} />
        <Technical name={tool.name} args={tool.args} />
      </div>
    );
  }
  const running = tool.stage === "running";
  return (
    <div className="dx-row" data-running={running || undefined}>
      <p className="dx-line" aria-live="polite">
        {running && <span className="dx-line-dot" aria-hidden="true" />}
        <span className="dx-line-text">{running ? tool.running : tool.result?.summary || tool.running}</span>
      </p>
      {!running && <RenderResult render={tool.result?.render} />}
      <Technical name={tool.name} args={tool.args} />
    </div>
  );
}

/* ── Approval (brief §13) ─────────────────────────────────────────────── */

export interface ApprovalView {
  id: string;
  name: string;
  running: string;
  cost: ToolCost;
  args: unknown;
  estimate?: ToolResult["render"];
  decision: "pending" | "approved" | "cancelled";
  stage: "waiting" | "running" | "done" | "error";
  result?: ToolResult;
  message?: string;
  /** The approve/cancel POST itself failed — shown next to the buttons. */
  postError?: string;
}

/**
 * The cost sheet. It says what will happen, what it will cost, and offers two
 * plain choices. Nothing here auto-approves and nothing here hides a number:
 * when a tool that spends returns no estimate, that fact is the cost line.
 */
export function ApprovalSheet({
  item,
  busy,
  onApprove,
  onCancel
}: {
  item: ApprovalView;
  busy: boolean;
  onApprove: () => void;
  onCancel: () => void;
}) {
  const estimate = item.estimate;
  return (
    <section className="dx-approval" aria-label="Approval needed">
      <p className="dx-approval-what">{item.running}</p>

      {estimate ? (
        <RenderResult render={estimate} />
      ) : (
        <p className="dx-estimate is-blocked">
          <span className="dx-estimate-nums">
            {item.cost === "destructive"
              ? "This removes work that cannot be recovered."
              : "This spends money, and no estimate came back for it."}
          </span>
        </p>
      )}

      <Technical name={item.name} args={item.args} />

      {item.decision === "pending" ? (
        <div className="dx-approval-actions">
          <Button intent="ghost" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button intent="primary" size="sm" onClick={onApprove} disabled={busy}>
            Approve
          </Button>
        </div>
      ) : (
        <p className="dx-approval-said">
          {item.decision === "cancelled"
            ? "Cancelled — nothing ran."
            : item.stage === "running"
              ? item.running
              : item.stage === "done"
                ? item.result?.summary || "Done."
                : "Approved."}
        </p>
      )}

      {item.postError && <InlineError message={item.postError} />}
      {item.stage === "error" && <InlineError message={item.message || "That step did not finish."} />}
      {item.decision === "approved" && item.stage === "done" && <RenderResult render={item.result?.render} />}
    </section>
  );
}
