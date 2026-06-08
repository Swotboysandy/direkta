"use client";

import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { X, Sparkles, Save, Check } from "lucide-react";
import type { SkillFile } from "../../lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const GROUPS: Array<{ key: "part" | "layer"; label: string; blurb: string }> = [
  {
    key: "part",
    label: "Generation skills",
    blurb: "Direct how the AI generates for each part of the app — frames, portraits, clips, beats."
  },
  {
    key: "layer",
    label: "Agent layers",
    blurb: "The three-layer reasoning pipeline behind the crew's chat."
  }
];

export function SkillsPanel({ open, onClose }: Props) {
  const [skills, setSkills] = useState<SkillFile[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/skills");
    const data = await res.json();
    setSkills(data.skills as SkillFile[]);
    setDrafts(Object.fromEntries((data.skills as SkillFile[]).map((s) => [s.id, s.body])));
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function save(id: string) {
    setSaving(id);
    const res = await fetch("/api/skills", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, body: drafts[id] ?? "" })
    });
    setSaving(null);
    if (res.ok) {
      const data = await res.json();
      const updated = data.skill as SkillFile;
      setSkills((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setSavedId(id);
      setTimeout(() => setSavedId((v) => (v === id ? null : v)), 1600);
    }
  }

  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()} direction="right" shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="kv-overlay" />
        <Drawer.Content className="kv-drawer" aria-describedby={undefined}>
          <Drawer.Title className="kv-drawer-head">
            <div>
              <span className="t-eyebrow">
                <Sparkles size={12} style={{ marginRight: 6, verticalAlign: -1 }} />
                SKILLS
              </span>
              <div className="kv-drawer-title">How your crew works</div>
            </div>
            <button className="btn-ghost btn btn-sm" onClick={onClose} aria-label="Close">
              <X size={14} />
            </button>
          </Drawer.Title>

          <Drawer.Description className="kv-drawer-blurb">
            Skills are the editable instructions your AI crew follows. Tune one and every future
            generation follows your direction — no rebuild needed.
          </Drawer.Description>

          <div className="kv-drawer-body">
            {GROUPS.map((group) => {
              const items = skills.filter((s) => s.kind === group.key);
              if (items.length === 0) return null;
              return (
                <section key={group.key} className="kv-group">
                  <div className="t-eyebrow kv-group-head">
                    {group.label.toUpperCase()} · {items.length}
                  </div>
                  <p className="skill-group-blurb">{group.blurb}</p>
                  <div className="kv-group-list">
                    {items.map((skill) => {
                      const draft = drafts[skill.id] ?? "";
                      const dirty = draft !== skill.body;
                      return (
                        <div key={skill.id} className="skill-edit">
                          <header>
                            <strong>{skill.title}</strong>
                            <span className="skill-pill" data-kind={skill.kind}>
                              {skill.kind === "part" ? skill.part : skill.layer}
                            </span>
                          </header>
                          <p className="skill-edit-desc">{skill.description}</p>
                          <textarea
                            className="skill-edit-body"
                            value={draft}
                            spellCheck={false}
                            rows={6}
                            onChange={(e) => setDrafts((d) => ({ ...d, [skill.id]: e.target.value }))}
                          />
                          <div className="skill-edit-foot">
                            <code>{skill.source}</code>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => save(skill.id)}
                              disabled={saving === skill.id || (!dirty && savedId !== skill.id)}
                            >
                              {saving === skill.id ? (
                                "Saving…"
                              ) : savedId === skill.id ? (
                                <>
                                  <Check size={12} /> Saved
                                </>
                              ) : (
                                <>
                                  <Save size={12} /> Save
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
