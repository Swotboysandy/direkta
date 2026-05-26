"use client";

import { useState } from "react";
import { ArrowDown, FileText, Film, ListChecks, BookOpen } from "lucide-react";
import type { Project, WorkspaceId } from "../../lib/types";

interface Props {
  project: Project;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

export function Export({ project }: Props) {
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
          <ExportCard
            icon={Film}
            title="Animatic"
            body="The full assembly — every selected frame stitched together with generated transitions."
            options={[
              {
                label: "Format",
                values: ["MP4 · H.264", "MOV · ProRes", "WebM"]
              },
              {
                label: "Resolution",
                values: ["1080p", "1440p", "4K"]
              },
              {
                label: "Overlay",
                values: ["No overlay", "Beat titles", "Timecode", "Both"]
              }
            ]}
            cta="Export animatic"
          />

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
