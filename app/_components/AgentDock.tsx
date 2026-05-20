"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Layers } from "lucide-react";
import type { AgentLayer } from "../../lib/types";

interface LayerEntry {
  layer: AgentLayer;
  text: string;
  status: "running" | "done";
}

interface Turn {
  id: string;
  prompt: string;
  layers: LayerEntry[];
  error?: string;
}

interface Props {
  projectId: string;
  onNodeProduced: () => void;
}

export function AgentDock({ projectId, onNodeProduced }: Props) {
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  async function submit() {
    const message = draft.trim();
    if (!message || busy) return;
    setDraft("");
    setBusy(true);
    const id = crypto.randomUUID();
    setTurns((prev) => [...prev, { id, prompt: message, layers: [] }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: projectId, message })
      });
      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          if (!raw.startsWith("data:")) continue;
          const json = raw.slice(5).trim();
          if (!json) continue;
          const event = JSON.parse(json);
          setTurns((prev) =>
            prev.map((turn) => {
              if (turn.id !== id) return turn;
              if (event.type === "layer") {
                const existing = turn.layers.find((entry) => entry.layer === event.layer);
                if (existing && event.status === "end") {
                  return {
                    ...turn,
                    layers: turn.layers.map((entry) =>
                      entry.layer === event.layer ? { ...entry, status: "done" as const } : entry
                    )
                  };
                }
                if (!existing) {
                  return {
                    ...turn,
                    layers: [...turn.layers, { layer: event.layer, text: "", status: "running" as const }]
                  };
                }
                return turn;
              }
              if (event.type === "delta") {
                return {
                  ...turn,
                  layers: turn.layers.map((entry) =>
                    entry.layer === event.layer ? { ...entry, text: entry.text + event.text } : entry
                  )
                };
              }
              if (event.type === "error") {
                return { ...turn, error: event.message };
              }
              return turn;
            })
          );
          if (event.type === "node") {
            onNodeProduced();
          }
        }
      }
    } catch (error: any) {
      setTurns((prev) =>
        prev.map((turn) => (turn.id === id ? { ...turn, error: error.message ?? String(error) } : turn))
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="agent-dock">
      <header>
        <Layers size={18} />
        <strong>Agent</strong>
        <span>three-layer pipeline</span>
      </header>
      <div ref={scrollRef} className="agent-log">
        {turns.length === 0 && (
          <p className="agent-empty">
            Ask Zinema to write a script beat, design a character, build a storyboard, or plan a render.
            Each task flows through Decision → Execution → Supervision and lands as a node on the canvas.
          </p>
        )}
        {turns.map((turn) => (
          <article key={turn.id} className="agent-turn">
            <div className="agent-prompt">{turn.prompt}</div>
            {turn.layers.map((entry) => (
              <div key={entry.layer} className={clsx("agent-layer", `layer-${entry.layer}`, entry.status)}>
                <header>
                  <i />
                  <strong>{entry.layer}</strong>
                  <span>{entry.status === "running" ? "thinking" : "done"}</span>
                </header>
                <pre>{entry.text || "…"}</pre>
              </div>
            ))}
            {turn.error && <div className="agent-error">{turn.error}</div>}
          </article>
        ))}
      </div>
      <form
        className="agent-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Plan a cold open, design the lead character, board the chase..."
          rows={3}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <button type="submit" disabled={busy || !draft.trim()} aria-label="Send">
          {busy ? <Sparkles size={18} /> : <Send size={18} />}
        </button>
      </form>
    </aside>
  );
}
