"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Flag } from "lucide-react";
import type { Clarification } from "../../lib/types";

/**
 * Director's-decision cards — the gaps the Screenplay Agent raised (propose-don't-commit).
 * Self-fetches pending clarifications for a project; the director picks an option or types an
 * answer, which resolves the gap. Renders nothing when there are no open questions.
 */
export function ClarificationCards({
  projectId,
  onResolved
}: {
  projectId: string;
  onResolved?: () => Promise<void> | void;
}) {
  const [items, setItems] = useState<Clarification[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/clarifications`);
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.clarifications ?? []);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (id: string, resolution: string) => {
    const text = resolution.trim();
    if (!text) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/clarifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution: text })
      });
      if (res.ok) {
        setItems((xs) => xs.filter((x) => x.id !== id));
        await onResolved?.();
      }
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <section style={{ marginBottom: "var(--sp-4)", display: "grid", gap: "var(--sp-3)" }}>
      <span className="t-eyebrow">
        <Flag size={12} /> DIRECTOR&apos;S DECISIONS · {items.length} OPEN
      </span>
      {items.map((c) => (
        <div key={c.id} className="card" style={{ display: "grid", gap: "var(--sp-3)" }}>
          <p style={{ fontWeight: 600, lineHeight: 1.4 }}>{c.question}</p>
          {c.options.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)" }}>
              {c.options.map((o) => (
                <button key={o.value} className="btn" disabled={busy === c.id} onClick={() => resolve(c.id, o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: "var(--sp-2)" }}>
            <input
              className="input"
              placeholder="Or tell me…"
              value={drafts[c.id] ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") void resolve(c.id, drafts[c.id] ?? "");
              }}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              disabled={busy === c.id || !(drafts[c.id]?.trim())}
              onClick={() => void resolve(c.id, drafts[c.id] ?? "")}
            >
              <Check size={14} /> Resolve
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
