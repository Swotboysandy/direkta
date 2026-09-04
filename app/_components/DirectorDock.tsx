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
import type { Project } from "../../lib/types";
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

interface Turn {
  id: string;
  role: "user" | "director";
  text: string;
  suggestions?: Array<{ label: string; prompt: string }>;
}

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
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState<string | null>(null);
  const [plan, setPlan] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
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
  }, [turns, thinking, open]);

  const ask = useCallback(
    async ({ text }: ComposerSubmission) => {
      if (busy) return;
      setOpen(true);
      setBusy(true);
      setThinking("Thinking");
      setTurns((t) => [...t, { id: `u${Date.now()}`, role: "user", text }]);
      const id = `d${Date.now()}`;
      let acc = "";
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ project_id: project.id, message: text })
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
            let event: any;
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }
            if (event.type === "layer") {
              setThinking(event.status === "start" ? `Thinking · ${event.layer}` : null);
            } else if (event.type === "delta") {
              acc += event.text;
              setThinking(null);
              setTurns((t) => [...t.filter((x) => x.id !== id), { id, role: "director", text: acc }]);
            } else if (event.type === "plan") {
              setPlan(event.plan);
            } else if (event.type === "error") {
              acc = acc || event.message || "The director could not answer.";
              setTurns((t) => [...t.filter((x) => x.id !== id), { id, role: "director", text: acc }]);
            }
          }
        }
        setTurns((t) => t.map((x) => (x.id === id ? { ...x, suggestions: extractSuggestions(x.text) } : x)));
      } catch (e: any) {
        setTurns((t) => [...t, { id, role: "director", text: e?.message || "The director is unreachable." }]);
      } finally {
        setThinking(null);
        setBusy(false);
      }
    },
    [busy, project.id]
  );

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
              {turns.length === 0 && !thinking && (
                <p className="dock-hint">
                  Ask for a way into a scene, three framings of this beat, or how two shots should cut. Anything it
                  suggests loads into the bar below.
                </p>
              )}
              {turns.map((t) => (
                <div key={t.id} className={cn("dock-turn", t.role === "user" && "is-user")}>
                  <p className="dock-turn-text">{t.text}</p>
                  {t.suggestions && t.suggestions.length > 0 && (
                    <div className="dock-cards">
                      {t.suggestions.map((s, i) => (
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
              ))}
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
