"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING_SMOOTH } from "./motion";
import { Composer, type ComposerSubmission } from "./Composer";
import { GenerationMonitor } from "./GenerationMonitor";
import { engineState, type H3Status } from "./RenderEngineChip";
import { Status } from "./ui/status";
import { useSelection } from "../_state/selection";
import { ArrowRight, ChevronDown, ChevronUp, Sparkles } from "./icons";
import { InlineError } from "./ui/inline-error";
import {
  ApprovalSheet,
  PlanSteps,
  ToolActivity,
  type ApprovalView,
  type ToolView
} from "./DirectorActivity";
import type { Project } from "../../lib/types";
import type { DirectorEvent, ToolCost, ToolResult } from "../../lib/agents/director-tools";
import { cn } from "@/lib/utils";

interface Props {
  project: Project;
  h3: H3Status | null;
  /** Generate a shot from the prompt and its references. Expensive: starts the GPU. */
  onGenerate: (value: ComposerSubmission) => void | Promise<void>;
  generating: boolean;
  generateNote: string | null;
  /** A generation finished; the canvas should refetch. */
  onFinished: () => void;
  /** Create opens the Dock in Generate; a production opens it in Direct. */
  initialMode?: Mode;
}

type Mode = "direct" | "generate";

interface Suggestion {
  label: string;
  prompt: string;
}

type PlanStep = { title: string; detail?: string; cost?: ToolCost };

/**
 * One entry in the conversation. Prose, a tool doing something, a tool asking
 * permission, a plan, or a failure — in the order they happened, so what the
 * Director did reads as a sequence rather than as a chat log with side effects
 * hidden behind it.
 */
type Item =
  | { kind: "user"; id: string; text: string }
  | { kind: "say"; id: string; text: string; suggestions?: Suggestion[] }
  | { kind: "plan"; id: string; steps: PlanStep[] }
  | { kind: "failed"; id: string; message: string }
  | ({ kind: "tool" } & ToolView)
  | ({ kind: "approval" } & ApprovalView);

/** "**Label** — prompt" lines become cards that load into the input. */
function extractSuggestions(text: string) {
  const out: Array<{ label: string; prompt: string }> = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(?:[-*]\s*)?\*\*(.+?)\*\*\s*[—:-]\s*(.+)$/);
    if (m && m[2].trim().length > 24) out.push({ label: m[1].trim(), prompt: m[2].trim() });
  }
  return out.slice(0, 4);
}

/**
 * The Director Dock (brief §10–§13).
 *
 * One compact bar along the bottom edge of the workspace. It knows what is
 * selected, so "make this slower" needs no noun; it carries the references as
 * thumbnails, not file names; and it says what a render will cost before the
 * button that starts one. It replaces three things that used to be separate:
 * the composer strip, the agent panel docked on the right, and the progress
 * monitor — the same conversation, the same input, the same result, in one
 * place.
 *
 * Two modes. **Direct** talks to the director: cheap, immediate, streams over
 * /api/chat. **Generate** renders a shot: it starts a GPU, so the cost and the
 * balance stand next to the button and the button refuses when the balance
 * cannot cover a finished render.
 *
 * Expanding does not enlarge a chat window. Director Mode lays out the
 * conversation beside what the director is reasoning over — the selection,
 * the production, the attached references — and any plan it proposes.
 * The panel is an overlay rising from the bar on transform and opacity; it
 * never pushes the workspace, so nothing reflows.
 */
export function DirectorDock({ project, h3, onGenerate, generating, generateNote, onFinished, initialMode = "direct" }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  useEffect(() => setMode(initialMode), [initialMode]);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [thinking, setThinking] = useState<string | null>(null);
  const [plan, setPlan] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  /** Approvals whose answer is in flight, so a button cannot be pressed twice. */
  const [answering, setAnswering] = useState<string[]>([]);
  const [seed, setSeed] = useState<string | null>(null);
  const [pendingRefs, setPendingRefs] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const { primary } = useSelection();

  // The dock's height is a fact other layout needs: the Shots board sizes to
  // the space above it and the toast clears it. Published once as a variable.
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const publish = () => document.documentElement.style.setProperty("--dock-h", `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty("--dock-h", "0px");
    };
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [items, thinking, open]);

  /** A tool that finished may have changed the canvas; say so once. */
  const settle = useCallback(
    (result: ToolResult | undefined) => {
      if (result?.invalidates && result.invalidates.length > 0) onFinished();
    },
    [onFinished]
  );

  const ask = useCallback(
    async ({ text }: ComposerSubmission) => {
      if (busy) return;
      setOpen(true);
      setBusy(true);
      setThinking("Thinking");
      const stamp = Date.now();
      setItems((prev) => [...prev, { kind: "user", id: `u${stamp}`, text }]);

      // Prose accumulates into one bubble until something else happens — a
      // tool, a plan, an approval — after which the next words start a new one,
      // so the reply reads in the order the work happened.
      let sayId: string | null = null;
      let acc = "";
      let n = 0;
      const nextId = () => `d${stamp}-${n++}`;
      const interrupt = () => {
        sayId = null;
        acc = "";
        setThinking(null);
      };

      /** Attach a finished or failed outcome to the tool that asked for it. */
      const resolve = (
        id: string,
        patch: { stage: "done" | "error"; result?: ToolResult; message?: string; name?: string }
      ) => {
        setItems((prev) => {
          const at = prev.findIndex((x) => (x.kind === "tool" || x.kind === "approval") && x.id === id);
          if (at === -1) {
            return [
              ...prev,
              {
                kind: "tool",
                id,
                name: patch.name ?? id,
                running: patch.result?.summary ?? patch.message ?? "",
                cost: "free",
                args: null,
                stage: patch.stage,
                result: patch.result,
                message: patch.message
              }
            ];
          }
          const next = prev.slice();
          const found = next[at];
          if (found.kind === "tool" || found.kind === "approval") {
            next[at] = { ...found, stage: patch.stage, result: patch.result, message: patch.message };
          }
          return next;
        });
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          // The selection travels with the message: it is what makes "this
          // shot" mean something without the director naming it (brief §10).
          body: JSON.stringify({
            project_id: project.id,
            message: text,
            selection: primary ? { kind: primary.kind, id: primary.id, label: primary.label } : null
          })
        });
        if (!res.ok || !res.body) throw new Error(`The director did not respond (${res.status}).`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        // SSE frames end with a blank line and can split across reads.
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            const line = frame.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            // `layer` predates the tool protocol and is not in DirectorEvent;
            // it is still emitted by the pipeline that is being replaced.
            let event: (DirectorEvent | { type: "layer"; layer?: string; status?: string }) & Record<string, any>;
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (event.type === "layer") {
              setThinking(event.status === "start" ? `Thinking · ${event.layer}` : null);
            } else if (event.type === "thinking") {
              setThinking(typeof event.text === "string" && event.text ? event.text : "Thinking");
            } else if (event.type === "delta") {
              acc += event.text;
              setThinking(null);
              const id = sayId ?? (sayId = nextId());
              const said = acc;
              setItems((prev) => {
                const at = prev.findIndex((x) => x.id === id);
                if (at === -1) return [...prev, { kind: "say", id, text: said }];
                const next = prev.slice();
                next[at] = { kind: "say", id, text: said };
                return next;
              });
            } else if (event.type === "tool") {
              interrupt();
              const id = String(event.id);
              setItems((prev) => {
                // An approved tool starts running under the id it was approved
                // with; that is the same entry, not a second one.
                const at = prev.findIndex((x) => x.kind === "approval" && x.id === id);
                if (at !== -1) {
                  const next = prev.slice();
                  const found = next[at];
                  if (found.kind === "approval") next[at] = { ...found, stage: "running" };
                  return next;
                }
                return [
                  ...prev,
                  {
                    kind: "tool",
                    id,
                    name: event.name,
                    running: event.running,
                    cost: event.cost,
                    args: event.args,
                    stage: "running"
                  }
                ];
              });
            } else if (event.type === "approval") {
              interrupt();
              setItems((prev) => [
                ...prev,
                {
                  kind: "approval",
                  id: String(event.id),
                  name: event.name,
                  running: event.running,
                  cost: event.cost,
                  args: event.args,
                  estimate: event.estimate,
                  decision: "pending",
                  stage: "waiting"
                }
              ]);
            } else if (event.type === "tool_result") {
              interrupt();
              resolve(String(event.id), { stage: "done", result: event.result, name: event.name });
              settle(event.result);
            } else if (event.type === "tool_error") {
              interrupt();
              resolve(String(event.id), { stage: "error", message: event.message, name: event.name });
            } else if (event.type === "plan") {
              // The new event carries steps; the pipeline being replaced sends
              // a free-form `plan`, which still goes to the side column.
              if (Array.isArray(event.steps)) {
                interrupt();
                const steps = event.steps as PlanStep[];
                setItems((prev) => [...prev, { kind: "plan", id: nextId(), steps }]);
              } else {
                setPlan(event.plan);
              }
            } else if (event.type === "error") {
              interrupt();
              const message = event.message || "The director could not answer.";
              setItems((prev) => [...prev, { kind: "failed", id: nextId(), message }]);
            }
          }
        }
        setItems((prev) =>
          prev.map((x) => (x.kind === "say" ? { ...x, suggestions: extractSuggestions(x.text) } : x))
        );
      } catch (e: any) {
        const message = e?.message || "The director is unreachable.";
        setItems((prev) => [...prev, { kind: "failed", id: nextId(), message }]);
      } finally {
        setThinking(null);
        setBusy(false);
      }
    },
    // `primary` is read when the message is sent, so a stale closure would
    // send the selection the director had a moment ago.
    [busy, project.id, settle, primary]
  );

  /**
   * Answer an approval (brief §13). The stream is still open and waiting on
   * this, so a cancel has to be sent too — otherwise the run hangs. A refusal
   * from the route is shown beside the buttons rather than swallowed, and the
   * sheet stays answerable.
   */
  const answer = useCallback(async (id: string, approved: boolean) => {
    setAnswering((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setItems((prev) =>
      prev.map((x) => (x.kind === "approval" && x.id === id ? { ...x, postError: undefined } : x))
    );
    try {
      const res = await fetch("/api/chat/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ approval_id: id, approved })
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(
          `That answer did not reach the director (${res.status}).${detail ? ` ${detail.slice(0, 200)}` : ""}`
        );
      }
      // The approve route runs the tool and returns its result in this
      // response — there is no second stream event to wait for, because the
      // conversation that asked has already finished. So what the tool did is
      // shown from here, on the sheet that asked for it.
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; approved?: boolean; result?: ToolResult }
        | null;
      setItems((prev) =>
        prev.map((x) =>
          x.kind === "approval" && x.id === id
            ? {
                ...x,
                decision: approved ? "approved" : "cancelled",
                stage: "done",
                result: approved ? body?.result ?? x.result : x.result
              }
            : x
        )
      );
      if (approved && body?.result?.invalidates?.length) onFinished();
    } catch (e: any) {
      const message = e?.message || "That answer did not reach the director.";
      setItems((prev) => prev.map((x) => (x.kind === "approval" && x.id === id ? { ...x, postError: message } : x)));
    } finally {
      setAnswering((prev) => prev.filter((x) => x !== id));
    }
  }, [onFinished]);

  const submit = useCallback(
    (v: ComposerSubmission) => (mode === "generate" ? onGenerate(v) : ask(v)),
    [mode, onGenerate, ask]
  );

  const engine = engineState(h3);
  const canGenerate = h3?.ok === true && h3.canStart === true;
  const estimate = typeof h3?.estimatedCostUsd === "number" ? h3.estimatedCostUsd : null;
  const contextLabel = primary?.label ?? project.title;

  return (
    <div className="dock" data-open={open || undefined}>
      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            className="dock-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={SPRING_SMOOTH}
            aria-label="Director"
          >
            <div className="dock-col dock-col--talk" ref={scroller}>
              {items.length === 0 && !thinking && (
                <p className="dock-hint">
                  Ask for a way into a scene, three framings of this beat, or how two shots should cut. Anything it
                  suggests loads into the bar below.
                </p>
              )}
              {items.map((it) => {
                if (it.kind === "tool") return <ToolActivity key={it.id} tool={it} />;
                if (it.kind === "approval")
                  return (
                    <ApprovalSheet
                      key={it.id}
                      item={it}
                      busy={answering.includes(it.id)}
                      onApprove={() => void answer(it.id, true)}
                      onCancel={() => void answer(it.id, false)}
                    />
                  );
                if (it.kind === "plan")
                  return (
                    <div key={it.id} className="dx-row">
                      <p className="dx-line">
                        <span className="dx-line-text">Here is what that takes.</span>
                      </p>
                      <PlanSteps steps={it.steps} />
                    </div>
                  );
                if (it.kind === "failed") return <InlineError key={it.id} message={it.message} />;
                return (
                  <div key={it.id} className={cn("dock-turn", it.kind === "user" && "is-user")}>
                    <p className="dock-turn-text">{it.text}</p>
                    {it.kind === "say" && it.suggestions && it.suggestions.length > 0 && (
                      <div className="dock-cards">
                        {it.suggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            className="dock-card"
                            onClick={() => {
                              setMode("generate");
                              setSeed(s.prompt);
                            }}
                          >
                            <span className="dock-card-label">{s.label}</span>
                            <span className="dock-card-text">{s.prompt}</span>
                            <span className="dock-card-use">
                              Use <ArrowRight size={11} />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {thinking && (
                <div className="dock-thinking" aria-live="polite">
                  <span className="dock-thinking-dot" />
                  {thinking}
                </div>
              )}
            </div>

            <aside className="dock-col dock-col--side">
              <div className="dock-block">
                <h3 className="dock-block-title">Context</h3>
                <dl className="dock-kv">
                  <dt>Production</dt>
                  <dd>{project.title}</dd>
                  <dt>Selected</dt>
                  <dd>{primary ? primary.label : "Nothing — the whole production"}</dd>
                  <dt>References</dt>
                  <dd>{pendingRefs > 0 ? `${pendingRefs} attached` : "None attached"}</dd>
                  <dt>Aspect</dt>
                  <dd className="font-mono">{project.aspect_ratio}</dd>
                </dl>
              </div>
              <div className="dock-block">
                <h3 className="dock-block-title">Render engine</h3>
                <div className="flex items-center gap-2">
                  {engine.status ? <Status domain="gpu" value={engine.status} /> : <span className="dock-muted">Checking…</span>}
                  {typeof h3?.balanceUsd === "number" && (
                    <span className="font-mono text-[11px] tabular-nums">${h3.balanceUsd.toFixed(2)}</span>
                  )}
                </div>
                {estimate !== null && (
                  <p className="dock-muted mt-1">
                    One 5-second shot ≈ ${estimate.toFixed(2)}
                    {h3?.canStart === false ? " — below the balance needed to finish a render." : "."}
                  </p>
                )}
              </div>
              {plan != null && (
                <div className="dock-block">
                  <h3 className="dock-block-title">Plan</h3>
                  {Array.isArray(plan) ? (
                    <ol className="dock-plan">
                      {plan.map((step: any, i: number) => (
                        <li key={i}>{typeof step === "string" ? step : step?.title ?? step?.task ?? JSON.stringify(step)}</li>
                      ))}
                    </ol>
                  ) : (
                    <pre className="dock-plan-raw">{typeof plan === "string" ? plan : JSON.stringify(plan, null, 1)}</pre>
                  )}
                </div>
              )}
            </aside>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="dock-bar" ref={barRef}>
        <GenerationMonitor onFinished={onFinished} />

        <div className="dock-row">
          <button
            type="button"
            className="dock-context"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close Director Mode" : "Open Director Mode"}
            title={contextLabel}
          >
            <Sparkles size={13} />
            <span className="dock-context-label">{contextLabel}</span>
            {open ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>

          <div className="dock-mode" role="radiogroup" aria-label="Mode">
            {(["direct", "generate"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                className={cn("dock-mode-btn", mode === m && "is-active")}
                onClick={() => setMode(m)}
              >
                {mode === m && <motion.span layoutId="dock-mode-active" transition={SPRING_SMOOTH} className="dock-mode-active" />}
                <span>{m === "direct" ? "Direct" : "Generate"}</span>
              </button>
            ))}
          </div>

          {mode === "generate" && (
            <span className={cn("dock-cost", !canGenerate && "is-blocked")}>
              {estimate !== null ? `≈ $${estimate.toFixed(2)} · 1 shot · 5.2 s` : "Estimating…"}
              {h3?.ok && h3.canStart === false && " · add funds to render"}
              {h3 && !h3.ok && " · engine unavailable"}
            </span>
          )}
        </div>

        <Composer
          projectId={project.id}
          onSubmit={submit}
          busy={busy || (mode === "generate" && (generating || !canGenerate))}
          placeholder={
            mode === "generate"
              ? `Describe the shot${primary ? ` for ${primary.label}` : ""}.  @ to reference a character, place or frame.`
              : `Direct${primary ? ` ${primary.label}` : ""}…  ask for framings, a way in, or what to change.`
          }
          seed={seed}
          onSeedConsumed={() => setSeed(null)}
          onRefsChange={setPendingRefs}
        />
        {generateNote && <p className="dock-note">{generateNote}</p>}
      </div>
    </div>
  );
}
