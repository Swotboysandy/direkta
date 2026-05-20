"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { AspectRatio, Project } from "../../lib/types";

interface Props {
  current: Project | null;
  onSwitch: (id: string) => void;
  onCreate: (input: { title: string; premise: string; aspect_ratio: AspectRatio }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectPicker({ current, onSwitch, onCreate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({ title: "", premise: "", aspect_ratio: "16:9" as AspectRatio });
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/projects")
      .then((response) => response.json())
      .then((data) => setProjects(data.projects));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onCreate({
        title: form.title.trim(),
        premise: form.premise.trim(),
        aspect_ratio: form.aspect_ratio
      });
      setCreating(false);
      setForm({ title: "", premise: "", aspect_ratio: "16:9" });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="project-picker" ref={ref}>
      <button className="picker-trigger" onClick={() => setOpen((value) => !value)}>
        <span>{current?.title ?? "No project"}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="picker-menu">
          <div className="picker-list">
            {projects.map((project) => (
              <button
                key={project.id}
                className={clsx("picker-item", project.id === current?.id && "active")}
                onClick={() => {
                  onSwitch(project.id);
                  setOpen(false);
                }}
              >
                <div>
                  <strong>{project.title}</strong>
                  <span>{project.aspect_ratio}</span>
                </div>
                {projects.length > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="picker-delete"
                    title="Delete project"
                    onClick={async (event) => {
                      event.stopPropagation();
                      if (!confirm(`Delete project "${project.title}"? This removes all its nodes.`)) return;
                      await onDelete(project.id);
                      setProjects((prev) => prev.filter((p) => p.id !== project.id));
                    }}
                  >
                    <Trash2 size={14} />
                  </span>
                )}
              </button>
            ))}
          </div>

          {creating ? (
            <form className="picker-form" onSubmit={submit}>
              <label>
                Title
                <input
                  autoFocus
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="Glass City"
                />
              </label>
              <label>
                Premise
                <textarea
                  rows={3}
                  value={form.premise}
                  onChange={(event) => setForm({ ...form, premise: event.target.value })}
                  placeholder="A detective follows a memory trail through mirrored towers..."
                />
              </label>
              <label>
                Format
                <select
                  value={form.aspect_ratio}
                  onChange={(event) => setForm({ ...form, aspect_ratio: event.target.value as AspectRatio })}
                >
                  <option value="16:9">16:9 landscape</option>
                  <option value="9:16">9:16 portrait</option>
                  <option value="1:1">1:1 square</option>
                  <option value="4:5">4:5 social</option>
                  <option value="21:9">21:9 ultrawide</option>
                </select>
              </label>
              <div className="picker-form-actions">
                <button type="button" onClick={() => setCreating(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={!form.title.trim() || submitting}>
                  {submitting ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          ) : (
            <button className="picker-new" onClick={() => setCreating(true)}>
              <Plus size={14} /> New project
            </button>
          )}
        </div>
      )}
    </div>
  );
}
