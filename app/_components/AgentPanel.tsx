"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING_SMOOTH } from "./motion";
import { ArrowRight, Sparkles, X } from "./icons";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  open: boolean;
  onClose: () => void;
  /** Load a suggestion into the composer rather than generating from here. */
  onUsePrompt: (text: string) => void;
}

interface Turn {
  id: string;
  role: "user" | "agent";
  text: string;
  /** Ready-to-run shot prompts the agent offered. */
  suggestions?: Array<{ label: string; prompt: string }>;
}

/** Split "**Label** — prompt text" lines out of the agent's reply.
 *
 *  The agent answers in prose, and a paragraph of ideas is something you have
 *  to re-type. Anything it formats as a bolded label followed by a sentence is
 *  lifted into a card you can load straight into the composer.
 */
function extractSuggestions(text: string): Array<{ label: string; prompt: string }> {
  const out: Array<{ label: string; prompt: string }> = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(?:[-*]\s*)?\*\*(.+?)\*\*\s*[—:-]\s*(.+)$/);
    if (m && m[2].trim().length > 24) out.push({ label: m[1].trim(), prompt: m[2].trim() });
  }
  return out.slice(0, 4);
}

/**
 * The agent, docked right.
 *
 * It streams over the existing /api/chat SSE endpoint, which emits the
 * orchestrator's layer/delta/error events rather than plain tokens, so the
 * panel shows a real thinking state while the decision layer runs and only
 * starts printing once text arrives.
 *
 * Suggestions are the point of it. A paragraph of ideas is something you then
 * have to re-type; a card you can press loads straight into the composer, where
 * references can be attached before it runs.
 */
export function AgentPanel({ projectId, open, onClose, onUsePrompt }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  const send = useCallback(async () => {
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    setThinking("Thinking");
    setTurns((t) => [...t, { id: `u${Date.now()}`, role: "user", text: message }]);

    const agentId = `a${Date.now()}`;
    let acc = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: projectId, message })
      });
      if (!res.ok || !res.body) throw new Error(`The agent did not respond (${res.status}).`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // SSE frames are separated by a blank line and can be split across reads,
      // so the tail is carried forward rather than parsed as a whole chunk.
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
            setTurns((t) => {
              const rest = t.filter((x) => x.id !== agentId);
              return [...rest, { id: agentId, role: "agent", text: acc }];
            });
          } else if (event.type === "error") {
            acc = acc || event.message || "The agent could not answer.";
            setTurns((t) => {
              const rest = t.filter((x) => x.id !== agentId);
              return [...rest, { id: agentId, role: "agent", text: acc }];
            });
          }
        }
      }

      setTurns((t) =>
        t.map((x) => (x.id === agentId ? { ...x, suggestions: extractSuggestions(x.text) } : x))
      );
    } catch (e: any) {
      setTurns((t) => [
        ...t,
        { id: agentId, role: "agent", text: e?.message || "The agent is unreachable." }
      ]);
    } finally {
      setThinking(null);
      setBusy(false);
    }
  }, [input, busy, projectId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="agent"
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          transition={SPRING_SMOOTH}
          aria-label="Agent"
        >
          <header className="agent-head">
            <Sparkles size={14} />
            <span className="agent-title">Agent</span>
            <button className="agent-x" onClick={onClose} aria-label="Close agent">
              <X size={13} />
            </button>
          </header>

          <div className="agent-scroll" ref={scroller}>
            {turns.length === 0 && !thinking && (
              <p className="agent-hint">
                Ask for shot ideas, a way into a scene, or how to make two shots cut together.
                Anything it suggests can be loaded into the composer.
              </p>
            )}

            {turns.map((t) => (
              <motion.div
                key={t.id}
                className={cn("agent-turn", t.role === "user" && "is-user")}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={SPRING_SMOOTH}
              >
                <p className="agent-text">{t.text}</p>
                {t.suggestions && t.suggestions.length > 0 && (
                  <div className="agent-cards">
                    {t.suggestions.map((s, i) => (
                      <button key={i} className="agent-card" onClick={() => onUsePrompt(s.prompt)}>
                        <span className="agent-card-label">{s.label}</span>
                        <span className="agent-card-text">{s.prompt}</span>
                        <span className="agent-card-use">
                          Use <ArrowRight size={11} />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}

            {thinking && (
              <motion.div
                className="agent-thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                aria-live="polite"
              >
                <span className="agent-thinking-dot" />
                {thinking}
              </motion.div>
            )}
          </div>

          <div className="agent-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={2}
              placeholder="Ask the agent…"
              aria-label="Message the agent"
            />
            <button className="agent-send" onClick={send} disabled={busy || !input.trim()} aria-label="Send">
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
