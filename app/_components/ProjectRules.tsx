"use client";

import { useState } from "react";
import type { Project } from "../../lib/types";

interface Rule {
  key: keyof Pick<
    Project,
    "creative_brief" | "brand_kit" | "style_template" | "continuity_lock" | "set_lock" | "avoid_prompt"
  >;
  label: string;
  hint: string;
  placeholder: string;
}

const RULES: Rule[] = [
  {
    key: "creative_brief",
    label: "Brief",
    hint: "tone, audience, story — steers all generation",
    placeholder: "Warm cinematic family ad, golden light, no dialogue"
  },
  {
    key: "style_template",
    label: "Style",
    hint: "applied to every frame and clip",
    placeholder: "Feature-film 3D animation, raytraced global illumination, shallow depth of field"
  },
  {
    key: "continuity_lock",
    label: "Continuity",
    hint: "who and what must stay identical in every shot",
    placeholder: "Kalki: early twenties, scar through the left eyebrow, indigo armour"
  },
  {
    key: "set_lock",
    label: "Set",
    hint: "room geography — the biggest cause of drift between shots",
    placeholder: "Bedroom: bed left, window right, one desk. Never widen the room"
  },
  {
    key: "brand_kit",
    label: "Brand",
    hint: "products placed into scenes",
    placeholder: "Kindle Coffee — red-logo cup, barista apron, storefront sign"
  },
  {
    key: "avoid_prompt",
    label: "Avoid",
    hint: "negatives appended to every frame and clip",
    placeholder: "No text, no watermark, no extra furniture"
  }
];

/**
 * The project's rules, as a list rather than a grid of boxes.
 *
 * These were six identical outlined textareas in a 2×3 grid: every rule looked
 * equally important, and an empty one occupied exactly as much space as one
 * holding three paragraphs. On a real project two are usually filled and four
 * are not, so most of that screen was empty boxes competing with the two that
 * mattered.
 *
 * As a list, an unset rule costs one line and a set one gets room. The whole
 * set reads as a single object with six entries instead of six objects, so what
 * is actually locked on this project can be seen at a glance rather than by
 * reading into every box.
 */
export function ProjectRules({ project }: { project: Project }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(RULES.map((r) => [r.key, (project[r.key] as string) ?? ""]))
  );
  const [saving, setSaving] = useState<string | null>(null);

  const save = async (key: string, value: string) => {
    setEditing(null);
    if (value === ((project[key as keyof Project] as string) ?? "")) return;
    setSaving(key);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [key]: value })
      });
    } catch {
      /* the value stays on screen; the next save retries it */
    } finally {
      setSaving(null);
    }
  };

  const setCount = RULES.filter((r) => (values[r.key] ?? "").trim()).length;

  return (
    <section className="rules">
      <header className="rules-head">
        <span className="ws-eyebrow">Locks</span>
        <span className="rules-count">
          {setCount} of {RULES.length} set
        </span>
      </header>

      {RULES.map((rule) => {
        const value = values[rule.key] ?? "";
        const isEditing = editing === rule.key;
        const isSet = value.trim().length > 0;
        return (
          <div key={rule.key} className="rules-row" data-set={isSet ? "true" : undefined}>
            <div className="rules-label">
              <span className="rules-name">{rule.label}</span>
              <span className="rules-hint">{rule.hint}</span>
            </div>

            {isEditing ? (
              <textarea
                className="rules-input"
                autoFocus
                defaultValue={value}
                rows={Math.min(10, Math.max(3, value.split("\n").length + 1))}
                maxLength={8000}
                placeholder={rule.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [rule.key]: e.target.value }))}
                onBlur={(e) => save(rule.key, e.target.value)}
                onKeyDown={(e) => {
                  // Escape abandons the edit; the field keeps what it had.
                  if (e.key === "Escape") {
                    setValues((v) => ({ ...v, [rule.key]: (project[rule.key] as string) ?? "" }));
                    setEditing(null);
                  }
                }}
              />
            ) : (
              <button
                className="rules-value"
                onClick={() => setEditing(rule.key)}
                aria-label={`Edit ${rule.label}`}
              >
                {isSet ? value : <span className="rules-unset">{rule.placeholder}</span>}
              </button>
            )}

            {saving === rule.key && <span className="rules-saving">Saving…</span>}
          </div>
        );
      })}
    </section>
  );
}
