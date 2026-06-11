"use client";

import { useState } from "react";
import { ArrowDown, FileText, Film, ListChecks, BookOpen } from "lucide-react";
import type { Project, WorkspaceId } from "../../lib/types";

interface Props {
  project: Project;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

export function Export({ project }: Props) {
  const [rendering, setRendering] = useState(false);
  const [cut, setCut] = useState<{ url: string; shots: number; duration: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function renderCut() {
    setRendering(true);
    setErr(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/render`, { method: "POST" });
      const data = await res.json();
      if (data.url) setCut({ url: data.url, shots: data.shots, duration: data.duration });
      else setErr(data.error || "Render failed.");
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setRendering(false);
    }
  }

  return (
    <div className="main-inner">
      <header className="page-head">
        <div>
          <div className="crumb">07 / WORKSPACE · EXPORT</div>
          <h1>Export</h1>
          <div className="sub">
            Hand off the project. Animatic for pitch decks, storyboard for the crew, shot list for
            production, bible for the writers&apos; room.
          </div>
        </div>
        <div className="actions">
          <span className="pip-state">{project.title.toUpperCase()}</span>
        </div>
      </header>

      <div className="page-body">
        <div className="export-grid">
          <div className="export-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ color: "var(--tungsten)" }}>
                <Film size={28} />
              </span>
              <span className="eb">{cut ? "RENDERED" : "READY"}</span>
            </div>
            <div className="title">Final cut</div>
            <div className="body">
              The full assembly — every shot on the Stitch board, in scene order, each held for its
              duration, rendered to a single MP4 with ffmpeg.
            </div>
            {cut && (
              <div style={{ borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--ink)" }}>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={cut.url} controls style={{ display: "block", width: "100%" }} />
              </div>
            )}
            {err && <div className="cast-error">{err}</div>}
            <div style={{ display: "flex", gap: "var(--sp-2)", marginTop: "auto", alignItems: "stretch" }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                disabled={rendering}
                onClick={renderCut}
              >
                <Film size={14} /> {rendering ? "Rendering…" : cut ? "Re-render" : "Render final cut"}
              </button>
              {cut && (
                <a className="btn btn-sm" href={cut.url} download style={{ justifyContent: "center", alignItems: "center" }}>
                  <ArrowDown size={14} /> Download
                </a>
              )}
            </div>
            {cut && (
              <span className="t-mute" style={{ fontSize: 11 }}>
                {cut.shots} shots · {cut.duration}s
              </span>
            )}
          </div>

          <ExportCard
            icon={FileText}
            title="Storyboard PDF"
            body="Selected frames laid out in narrative order. Bring it to a director, a DP, a producer, an investor."
            options={[
              {
                label: "Layout",
                values: ["1 frame / page", "2 frames / page", "4 frames / page", "Contact sheet"]
              },
              {
                label: "Annotations",
                values: ["Frame only", "+ Beat description", "+ Scene + cast tags"]
              }
            ]}
            cta="Export storyboard"
          />

          <ExportCard
            icon={ListChecks}
            title="Shot list"
            body="One row per beat with location, cast, props, mood, and continuity flags. The doc your AD will actually use."
            options={[
              {
                label: "Format",
                values: ["PDF", "CSV", "XLSX"]
              },
              {
                label: "Sort by",
                values: ["Beat order", "Location", "Cast", "Day / Night"]
              }
            ]}
            cta="Export shot list"
          />

          <ExportCard
            icon={BookOpen}
            title="Production bible"
            body="Character profiles, world rules, tone document. Everything the Bible Builder put together — in one file."
            options={[
              {
                label: "Format",
                values: ["PDF", "DOCX", "Markdown"]
              },
              {
                label: "Sections",
                values: ["Full bible", "Characters only", "World + tone only"]
              }
            ]}
            cta="Export bible"
          />
        </div>
      </div>
    </div>
  );
}

function ExportCard({
  icon: Icn,
  title,
  body,
  options,
  cta
}: {
  icon: typeof Film;
  title: string;
  body: string;
  options: Array<{ label: string; values: string[] }>;
  cta: string;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="export-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ color: "var(--tungsten)" }}>
          <Icn size={28} />
        </span>
        <span className="eb">READY</span>
      </div>
      <div className="title">{title}</div>
      <div className="body">{body}</div>
      <div className="options">
        {options.map((opt) => (
          <label key={opt.label}>
            {opt.label}
            <select defaultValue={opt.values[0]}>
              {opt.values.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button
        className="btn btn-primary"
        style={{ marginTop: "auto", justifyContent: "center" }}
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setTimeout(() => setBusy(false), 1400);
        }}
      >
        <ArrowDown size={14} /> {busy ? "Packaging…" : cta}
      </button>
    </div>
  );
}
