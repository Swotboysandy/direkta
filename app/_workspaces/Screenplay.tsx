"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, FileText, Flag, Sparkles } from "lucide-react";
import { MovieBibleModal } from "../_components/MovieBibleModal";
import { ClarificationCards } from "../_components/ClarificationCards";
import type { Beat, Bible, Character, Location, Project, WorkspaceId } from "../../lib/types";

const TILTS = ["var(--tilt-card-a)", "var(--tilt-card-b)", "var(--tilt-card-c)"];

interface Props {
  project: Project;
  beats: Beat[];
  bible: Bible | null;
  characters: Character[];
  locations: Location[];
  onSwitchWorkspace: (ws: WorkspaceId) => void;
  onScriptSubmitted: () => Promise<void> | void;
  onReload: () => Promise<void> | void;
}

export function Screenplay({
  project,
  beats,
  bible,
  characters,
  locations,
  onSwitchWorkspace,
  onScriptSubmitted,
  onReload
}: Props) {
  const [draft, setDraft] = useState(project.script);
  const [busy, setBusy] = useState(false);
  const [activeBeat, setActiveBeat] = useState<string | null>(null);
  const [bibleOpen, setBibleOpen] = useState(false);
  const [view, setView] = useState<"split" | "board">("split");
  const lastSavedRef = useRef(project.script);

  useEffect(() => {
    setDraft(project.script);
    lastSavedRef.current = project.script;
  }, [project.id, project.script]);

  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const canSubmit = words >= 50 && !project.script_submitted;

  // Debounced autosave of the script text (without "submitting" it)
  useEffect(() => {
    if (draft === lastSavedRef.current) return;
    const timer = setTimeout(async () => {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ script: draft })
      });
      lastSavedRef.current = draft;
    }, 800);
    return () => clearTimeout(timer);
  }, [draft, project.id]);

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/script/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ script: draft })
      });
      if (res.ok) {
        await onScriptSubmitted();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!project.script_submitted) {
    return (
      <div className="main-inner screenplay">
        <header className="page-head">
          <div>
            <span className="t-eyebrow crumb">02 / WORKSPACE · SCREENPLAY</span>
            <h1 className="t-display-m" style={{ marginTop: "var(--sp-2)" }}>Screenplay</h1>
            <p className="lead" style={{ marginTop: "var(--sp-3)", maxWidth: "64ch" }}>
              Paste your script or write it here. Once you submit,{" "}
              <strong>Script Reader</strong> breaks it into beats,{" "}
              <strong>Beat Writer</strong> structures them, and{" "}
              <strong>Bible Builder</strong> drafts the production bible.
            </p>
          </div>
          <div className="page-head-actions">
            <span className="pip-state">
              {words} {words === 1 ? "WORD" : "WORDS"}
            </span>
            <button className="btn btn-primary" disabled={!canSubmit || busy} onClick={submit}>
              {busy ? "Reading…" : "Submit to Script Reader"} <ArrowRight size={14} />
            </button>
          </div>
        </header>

        <div className="page-body">
          <div className="card" style={{ padding: 0 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`INT. WAREHOUSE — NIGHT\n\nMARCUS, 44, picks his way between rusted crates. A flashlight beam — narrow, tired. The air smells like the river.\n\nHe stops. Something pale on the concrete. He doesn't bring the light up immediately.\n\nMARCUS\n  (quiet, to himself)\nDon't.\n\n…`}
              style={{
                width: "100%",
                minHeight: 520,
                background: "transparent",
                border: "none",
                boxShadow: "none",
                resize: "vertical",
                padding: "var(--sp-5) var(--sp-6)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                lineHeight: 1.75,
                color: "var(--ink)",
                borderRadius: 0
              }}
            />
          </div>
          <p className="t-mute" style={{ fontSize: 12, marginTop: "var(--sp-3)" }}>
            Tip: Final Draft and Fountain format are both fine. Scene headings (INT./EXT.) help the
            Script Reader detect beats cleanly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-inner screenplay">
      <header className="page-head">
        <div>
          <span className="t-eyebrow crumb">02 / WORKSPACE · SCREENPLAY</span>
          <h1 className="t-display-m" style={{ marginTop: "var(--sp-2)" }}>Screenplay</h1>
          <p className="lead" style={{ marginTop: "var(--sp-3)", maxWidth: "64ch" }}>
            {beats.length === 0
              ? "Script submitted. Run the Screenplay Agent in Claude to import the beat breakdown and Movie Bible."
              : `${beats.length} beats extracted. ${bible?.built ? "Bible is built." : "Bible Builder is queued."}`}
          </p>
        </div>
        <div className="page-head-actions">
          {beats.length > 0 && (
            <div className="view-toggle" role="tablist" aria-label="Breakdown view">
              <button
                role="tab"
                aria-selected={view === "split"}
                data-active={view === "split"}
                onClick={() => setView("split")}
              >
                Split
              </button>
              <button
                role="tab"
                aria-selected={view === "board"}
                data-active={view === "board"}
                onClick={() => setView("board")}
              >
                Board
              </button>
            </div>
          )}
          <span className="pip-state" data-status={beats.length > 0 ? "done" : "working"}>
            {beats.length > 0 ? `${beats.length} BEATS` : "PROCESSING"}
          </span>
          <button className="btn" onClick={() => setBibleOpen(true)}>
            <FileText size={14} /> View Bible
          </button>
          <button className="btn btn-primary" onClick={() => onSwitchWorkspace("casting")}>
            Continue to Casting <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <ClarificationCards projectId={project.id} onResolved={onReload} />

      {view === "board" ? (
        <div className="page-body">
          {beats.length === 0 ? (
            <div className="card">
              <span className="t-eyebrow">
                <Sparkles size={12} /> CREW STANDBY
              </span>
              <p className="t-mute" style={{ marginTop: "var(--sp-2)", fontSize: 13 }}>
                Beats will appear here as scene cards once the Screenplay Agent imports the breakdown.
              </p>
            </div>
          ) : (
            <div className="scene-board">
              {beats.map((beat, i) => (
                <SceneCard key={beat.id} beat={beat} rot={TILTS[i % 3]} />
              ))}
            </div>
          )}
        </div>
      ) : (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.15fr",
          gap: 0,
          height: "calc(100vh - 64px - 220px)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          background: "var(--surface)",
          boxShadow: "var(--shadow-1)"
        }}
      >
        {/* BREAKDOWN — LEFT */}
        <div style={{ overflowY: "auto", borderRight: "1px solid var(--cream-deep)", background: "var(--bg)" }}>
          <div
            style={{
              padding: "var(--sp-4) var(--sp-6)",
              position: "sticky",
              top: 0,
              background: "var(--bg)",
              zIndex: 5,
              borderBottom: "1px solid var(--cream-deep)"
            }}
          >
            <span className="t-eyebrow">
              BREAKDOWN · {beats.length} OF {beats.length} BEATS
            </span>
          </div>

          <div style={{ padding: "var(--sp-5) var(--sp-6) 80px" }}>
            <div
              className="card"
              style={{ marginBottom: "var(--sp-4)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span className="t-eyebrow">BIBLE BUILDER · {bible?.built ? "COMPLETE" : "QUEUED"}</span>
                  <h3 className="t-h3" style={{ marginTop: "var(--sp-2)" }}>Production bible</h3>
                </div>
                {bible?.built && <Check size={18} style={{ color: "var(--accent-3)" }} />}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "var(--sp-3)",
                  marginTop: "var(--sp-4)",
                  paddingTop: "var(--sp-4)",
                  borderTop: "1px solid var(--cream-deep)"
                }}
              >
                <BibleStat n={String(bible?.word_count ?? 0)} lbl="Words" />
                <BibleStat n={String(beats.length)} lbl="Beats" />
                <BibleStat n={String(characters.length)} lbl="Characters" />
                <BibleStat n={String(locations.length)} lbl="Locations" />
              </div>
              <button
                className="btn btn-sm btn-secondary"
                style={{ marginTop: "var(--sp-4)" }}
                onClick={() => setBibleOpen(true)}
              >
                <FileText size={12} /> View full bible
              </button>
            </div>

            {beats.length === 0 && (
              <div className="card">
                <span className="t-eyebrow">
                  <Sparkles size={12} /> CREW STANDBY
                </span>
                <p className="t-mute" style={{ marginTop: "var(--sp-2)", fontSize: 13 }}>
                  Script Reader and Beat Writer are scaffolded but not yet wired in V1 part 1. As
                  soon as the agent pipeline lands, beats will start populating here in real time.
                </p>
              </div>
            )}

            <span className="t-eyebrow" style={{ display: "block", marginTop: "var(--sp-5)", marginBottom: "var(--sp-3)" }}>
              BEATS
            </span>
            {beats.map((beat) => (
              <BeatCard
                key={beat.id}
                beat={beat}
                expanded={activeBeat === beat.id}
                onToggle={() => setActiveBeat(activeBeat === beat.id ? null : beat.id)}
              />
            ))}
          </div>
        </div>

        {/* SCRIPT — RIGHT */}
        <div style={{ overflowY: "auto", background: "var(--surface)" }}>
          <div
            style={{
              padding: "var(--sp-4) var(--sp-6)",
              position: "sticky",
              top: 0,
              background: "var(--surface)",
              zIndex: 5,
              borderBottom: "1px solid var(--cream-deep)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--sp-3)"
            }}
          >
            <div>
              <span className="t-eyebrow">SCRIPT · READ-ONLY</span>
              <h3 className="t-h3" style={{ marginTop: "var(--sp-1)" }}>
                {project.title}
              </h3>
            </div>
            <button
              className="btn btn-sm"
              onClick={async () => {
                if (!confirm("Edit the script? Beat extraction will need to re-run.")) return;
                await fetch(`/api/projects/${project.id}`, {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ script_submitted: false })
                });
                await onReload();
              }}
            >
              Edit script
            </button>
          </div>
          <pre
            style={{
              padding: "var(--sp-5) var(--sp-6) 80px",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              lineHeight: 1.75,
              color: "var(--ink-soft)",
              whiteSpace: "pre-wrap",
              margin: 0
            }}
          >
            {project.script}
          </pre>
        </div>
      </div>
      )}

      {bibleOpen && bible && (
        <MovieBibleModal
          project={project}
          bible={bible}
          beats={beats}
          characters={characters}
          locations={locations}
          onClose={() => setBibleOpen(false)}
        />
      )}
    </div>
  );
}

function BibleStat({ n, lbl }: { n: string; lbl: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 600,
          fontSize: 28,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
          lineHeight: 1
        }}
      >
        {n}
      </div>
      <span className="t-eyebrow" style={{ display: "block", marginTop: "var(--sp-1)" }}>
        {lbl}
      </span>
    </div>
  );
}

function BeatCard({
  beat,
  expanded,
  onToggle
}: {
  beat: Beat;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="card"
      style={{
        width: "100%",
        textAlign: "left",
        marginBottom: "var(--sp-2)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-2)",
        cursor: "pointer"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
        <span
          className="tag tag-accent"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "var(--tracking-eyebrow)"
          }}
        >
          B {String(beat.n).padStart(2, "0")}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--mute)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-eyebrow)"
          }}
        >
          {beat.scene_heading || "—"}
        </span>
        {beat.flag && (
          <span
            className="pip-state"
            data-status="error"
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <Flag size={10} />
            {beat.flag.toUpperCase()}
          </span>
        )}
      </div>
      <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 16, letterSpacing: "-0.005em", color: "var(--ink)" }}>
        {beat.title || "Untitled beat"}
      </div>
      {beat.characters.length > 0 && (
        <div className="tag-strip">
          {beat.characters.map((c) => (
            <span key={c} className="tag">{c}</span>
          ))}
        </div>
      )}
      {expanded && beat.summary && (
        <p className="t-body-s t-mute" style={{ marginTop: "var(--sp-1)" }}>{beat.summary}</p>
      )}
    </button>
  );
}

function SceneCard({ beat, rot }: { beat: Beat; rot: string }) {
  return (
    <article className="scene-card" style={{ "--card-rot": rot } as React.CSSProperties}>
      <div className="scene-card-head">
        <span className="scene-card-no">SCENE {String(beat.n).padStart(2, "0")}</span>
        {beat.flag && (
          <span className="pip-state" data-status="error" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Flag size={10} /> {beat.flag.toUpperCase()}
          </span>
        )}
      </div>
      <div className="scene-card-slug">{beat.scene_heading || "—"}</div>
      <h3 className="scene-card-title">{beat.title || "Untitled beat"}</h3>
      {beat.summary && <p className="scene-card-sum">{beat.summary}</p>}
      {beat.characters.length > 0 && (
        <div className="tag-strip" style={{ marginTop: "auto" }}>
          {beat.characters.map((c) => (
            <span key={c} className="tag">{c}</span>
          ))}
        </div>
      )}
    </article>
  );
}

/* Old single-modal BibleModal removed. Movie Bible lives in
   app/_components/MovieBibleModal.tsx with sidebar nav + 10 sections. */
