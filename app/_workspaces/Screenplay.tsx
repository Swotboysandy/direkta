"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, FileText, Flag, Lock, RefreshCw, Sparkles, Upload } from "../_components/icons";
import { MovieBibleModal } from "../_components/MovieBibleModal";
import { fadeUp, pageIn, staggerContainer, staggerItem, tap } from "../_components/motion";
import type { Beat, Bible, Character, Location, Project, WorkspaceId } from "../../lib/types";

const TILTS = ["var(--tilt-card-a)", "var(--tilt-card-b)", "var(--tilt-card-c)"];

/* Shared inline-style fragments — the mockup's small mono "eyebrow" labels
   (10px / weight 500 / 0.02em tracking, mixed case) recur across the header,
   pills and stat cells. Kept local to this file rather than a global class so
   we don't disturb the app-wide .t-eyebrow convention (all-caps, wide tracking). */
const mono10: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.02em"
};

/* Glass panel base for the split-view chrome (stat strip, beat rail, script
   pane) — surface + 18px radius + shadow-1, no padding/hover baked in since
   each panel controls its own inner spacing. */
const panelStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: 18,
  boxShadow: "var(--shadow-1)",
  overflow: "hidden"
};

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
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [activeBeat, setActiveBeat] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  async function generateScript() {
    if (busy || generating) return;
    setGenerating(true);
    setGenError(null);
    setDraft("");
    try {
      const res = await fetch(`/api/projects/${project.id}/script/generate`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        setGenError(err.error ?? "Generation failed");
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setDraft(full);
      }
      // Persist immediately — mark as AI-generated so "Regenerate" shows next time
      lastSavedRef.current = full;
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ script: full, script_ai_generated: true })
      });
      await onReload();
    } catch (err) {
      setGenError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setGenError(null);

    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (isPdf) {
      // PDFs are compressed binary — extract text server-side, not via readAsText.
      setImporting(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/projects/${project.id}/script/import`, { method: "POST", body: fd });
        const data = await res.json().catch(() => ({ error: "Could not read PDF" }));
        if (res.ok && typeof data.text === "string") setDraft(data.text);
        else setGenError(data.error ?? "Could not read PDF");
      } catch (err) {
        setGenError(String(err));
      } finally {
        setImporting(false);
      }
      return;
    }

    // Plain-text formats (.txt/.fountain/.fdx/.md) read fine in the browser.
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") setDraft(text);
    };
    reader.readAsText(file);
  }

  async function extractBeats() {
    if (extracting) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/beats/extract`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Extraction failed" }));
        setExtractError(data.error ?? "Extraction failed");
      } else {
        await onReload();
      }
    } catch (err) {
      setExtractError(String(err));
    } finally {
      setExtracting(false);
    }
  }

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
        // Auto-trigger beat extraction; update view when done
        extractBeats();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!project.script_submitted) {
    return (
      <div className="main-inner screenplay">
        <motion.header className="page-head" {...fadeUp}>
          <div>
            <span style={{ ...mono10, color: "var(--accent)" }}>02 / Workspace · Screenplay</span>
            <h1
              style={{
                margin: "8px 0 0",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(24px,2.4vw,32px)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "var(--ink)"
              }}
            >
              Screenplay
            </h1>
            <p style={{ margin: "12px 0 0", fontWeight: 500, fontSize: 16, lineHeight: 1.5, color: "var(--ink)", maxWidth: "56ch" }}>
              Paste your script or write it here. Once you submit, <strong>Script Reader</strong> breaks it
              into beats and <strong>Bible Builder</strong> drafts the production bible.
            </p>
          </div>
          <div className="page-head-actions">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", ...mono10, borderRadius: 999, background: "var(--cream-deep)", color: "var(--ink-soft)" }}>
              {words} {words === 1 ? "word" : "words"}
            </span>
            {/* Hidden file input — accepts .txt .fountain .fdx .md */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.fountain,.fdx,.md,.pdf"
              style={{ display: "none" }}
              onChange={importFile}
            />
            <motion.button
              {...tap}
              className="btn"
              disabled={busy || generating || importing}
              onClick={() => fileInputRef.current?.click()}
              title="Import a script file (.txt, .fountain, .fdx, .pdf)"
            >
              <Upload size={14} /> {importing ? "Reading PDF…" : "Import file"}
            </motion.button>
            <motion.button
              {...tap}
              className={project.script_ai_generated ? "btn btn-primary" : "btn"}
              disabled={busy || generating}
              onClick={generateScript}
            >
              {generating ? (
                <><Sparkles size={14} /> Generating…</>
              ) : project.script_ai_generated ? (
                <><RefreshCw size={14} /> Regenerate</>
              ) : (
                <><Sparkles size={14} /> Generate with AI</>
              )}
            </motion.button>
            <motion.button {...tap} className="btn btn-primary" disabled={!canSubmit || busy || generating} onClick={submit}>
              {busy ? "Reading…" : "Submit to Script Reader"} <ArrowRight size={14} />
            </motion.button>
          </div>
        </motion.header>

        <motion.div className="page-body" {...pageIn}>
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 18,
              boxShadow: "var(--shadow-2)",
              overflow: "hidden",
              opacity: generating ? 0.85 : 1
            }}
          >
            <textarea
              value={draft}
              readOnly={generating}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`INT. WAREHOUSE — NIGHT\n\nMARCUS, 44, picks his way between rusted crates. A flashlight beam — narrow, tired. The air smells like the river.\n\nHe stops. Something pale on the concrete. He doesn't bring the light up immediately.\n\nMARCUS\n  (quiet, to himself)\nDon't.\n\n…`}
              style={{
                width: "100%",
                minHeight: 520,
                background: "transparent",
                border: "none",
                boxShadow: "none",
                resize: "vertical",
                padding: "28px 32px",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                lineHeight: 1.75,
                color: "var(--ink)",
                borderRadius: 0,
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
          <p className="t-mute" style={{ fontSize: 12, marginTop: "var(--sp-3)" }}>
            Tip: Final Draft and Fountain format are both fine. Scene headings (INT./EXT.) help the
            Script Reader detect beats cleanly.
          </p>
          {genError && (
            <p style={{ fontSize: 12, marginTop: "var(--sp-2)", color: "var(--tomato)" }}>
              {genError}
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  const beatsPillBg =
    beats.length > 0 ? "rgba(61,168,155,0.18)" : extracting ? "rgba(242,184,60,0.20)" : "var(--cream-deep)";
  const beatsPillFg =
    beats.length > 0 ? "var(--viridian-deep)" : extracting ? "var(--mustard-deep)" : "var(--mute)";
  const beatsPillLabel =
    beats.length > 0
      ? `${beats.length} beat${beats.length === 1 ? "" : "s"} · locked`
      : extracting
      ? "Extracting…"
      : "Awaiting extraction";

  return (
    <div className="main-inner screenplay">
      <motion.header className="page-head" {...fadeUp}>
        <div>
          <span style={{ ...mono10, color: "var(--accent)" }}>02 / Workspace · Screenplay</span>
          <h1
            style={{
              margin: "8px 0 0",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(24px,2.4vw,32px)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--ink)"
            }}
          >
            Screenplay
          </h1>
          <p style={{ margin: "12px 0 0", fontWeight: 500, fontSize: 16, lineHeight: 1.5, color: "var(--ink)", maxWidth: "56ch" }}>
            {beats.length === 0
              ? extracting
                ? "Script Reader is reading your screenplay — beats will appear shortly."
                : "Script submitted. Click Extract beats to break it into scenes."
              : `${beats.length} beat${beats.length === 1 ? "" : "s"} extracted. ${
                  bible?.built ? "Bible is built." : "Bible Builder is queued."
                } The script is locked — everything downstream builds from this draft.`}
          </p>
        </div>
        <div className="page-head-actions">
          {beats.length > 0 && (
            <div role="tablist" aria-label="Breakdown view" style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: 3, background: "var(--surface-2)", borderRadius: 999 }}>
              <button
                role="tab"
                aria-selected={view === "split"}
                data-active={view === "split"}
                onClick={() => setView("split")}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 400,
                  letterSpacing: "0.02em",
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  color: view === "split" ? "var(--ink)" : "var(--mute)",
                  background: view === "split" ? "var(--surface)" : "transparent",
                  boxShadow: view === "split" ? "var(--shadow-1)" : "none"
                }}
              >
                Split
              </button>
              <button
                role="tab"
                aria-selected={view === "board"}
                data-active={view === "board"}
                onClick={() => setView("board")}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 400,
                  letterSpacing: "0.02em",
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  color: view === "board" ? "var(--ink)" : "var(--mute)",
                  background: view === "board" ? "var(--surface)" : "transparent",
                  boxShadow: view === "board" ? "var(--shadow-1)" : "none"
                }}
              >
                Board
              </button>
            </div>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", ...mono10, borderRadius: 999, background: beatsPillBg, color: beatsPillFg }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", opacity: 0.6 }} />
            {beatsPillLabel}
          </span>
          <motion.button {...tap} className="btn" onClick={() => setBibleOpen(true)}>
            <FileText size={14} /> View Bible
          </motion.button>
          <motion.button {...tap} className="btn btn-primary" onClick={() => onSwitchWorkspace("casting")}>
            Continue to Casting <ArrowRight size={14} />
          </motion.button>
        </div>
      </motion.header>

      {view === "board" ? (
        <motion.div className="page-body" {...pageIn}>
          {beats.length === 0 ? (
            <div className="card" style={{ borderRadius: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, ...mono10, color: "var(--accent)" }}>
                <Sparkles size={12} /> Script Reader
              </span>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-soft)", margin: 0 }}>
                {extracting ? "Reading script — extracting beats…" : "Beats will appear here as scene cards once extracted."}
              </p>
              {extractError && (
                <p style={{ fontSize: 12, color: "var(--tomato)", margin: 0 }}>{extractError}</p>
              )}
              {!extracting && (
                <motion.button {...tap} className="btn btn-sm btn-primary" style={{ alignSelf: "flex-start" }} onClick={extractBeats}>
                  <Sparkles size={12} /> {extractError ? "Retry extraction" : "Extract beats"}
                </motion.button>
              )}
              {extracting && (
                <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", ...mono10, borderRadius: 999, background: "rgba(242,184,60,0.20)", color: "var(--mustard-deep)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", opacity: 0.6 }} />
                  Working
                </span>
              )}
            </div>
          ) : (
            <motion.div className="scene-board" variants={staggerContainer} initial="hidden" animate="show">
              {beats.map((beat, i) => (
                <SceneCard key={beat.id} beat={beat} rot={TILTS[i % 3]} />
              ))}
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div className="page-body" {...pageIn}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            style={{ ...panelStyle, display: "grid", gridTemplateColumns: "repeat(4, 1fr) auto", marginBottom: 16 }}
          >
            <StatCell value={(bible?.word_count ?? 0).toLocaleString()} label="Bible words" />
            <StatCell value={String(beats.length)} label="Beats" />
            <StatCell value={String(characters.length)} label="Characters" />
            <StatCell value={String(locations.length)} label="Locations" />
            <motion.div variants={staggerItem} style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              {bible?.built ? (
                <Check size={16} style={{ color: "var(--viridian)" }} />
              ) : (
                <Sparkles size={16} style={{ color: "var(--mustard)" }} />
              )}
              <span style={{ ...mono10, color: "var(--mute)" }}>{bible?.built ? "Bible built" : "Bible pending"}</span>
            </motion.div>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "250px minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
            {/* BEAT INDEX — LEFT RAIL */}
            <div
              style={{
                ...panelStyle,
                position: "sticky",
                top: 16,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                maxHeight: "calc(100vh - 180px)",
                overflow: "auto"
              }}
            >
              <div style={{ padding: "8px 10px", ...mono10, color: "var(--mute)" }}>Beat index</div>
              {beats.length === 0 ? (
                <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-soft)", margin: 0 }}>
                    {extracting
                      ? "Reading script — extracting beats and scene structure…"
                      : "AI will break your script into beats, detect characters, locations, mood, and props."}
                  </p>
                  {extractError && (
                    <p style={{ fontSize: 11, color: "var(--tomato)", margin: 0 }}>{extractError}</p>
                  )}
                  {!extracting && (
                    <motion.button {...tap} className="btn btn-sm btn-primary" style={{ alignSelf: "flex-start" }} onClick={extractBeats}>
                      <Sparkles size={12} /> {extractError ? "Retry" : "Extract beats"}
                    </motion.button>
                  )}
                </div>
              ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {beats.map((beat) => (
                    <RailBeatItem
                      key={beat.id}
                      beat={beat}
                      expanded={activeBeat === beat.id}
                      onToggle={() => setActiveBeat(activeBeat === beat.id ? null : beat.id)}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* SCRIPT — RIGHT PANEL */}
            <div style={panelStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 32px",
                  borderBottom: "1px solid var(--cream-deep)"
                }}
              >
                <div>
                  <span style={{ ...mono10, color: "var(--mute)" }}>Script · Locked · Read-only</span>
                  <h3 style={{ margin: "4px 0 0", fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em", color: "var(--ink)" }}>
                    {project.title}
                  </h3>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", ...mono10, borderRadius: 999, background: "rgba(95,191,143,0.16)", color: "var(--viridian-deep)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", opacity: 0.6 }} />
                    Draft {project.draft_version}
                  </span>
                  <motion.button
                    {...tap}
                    className="btn btn-sm"
                    style={{ background: "var(--bg)" }}
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
                    <Lock size={12} /> Unlock & edit
                  </motion.button>
                </div>
              </div>
              <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 48px 120px" }}>
                <pre
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    lineHeight: 1.95,
                    color: "var(--ink-soft)",
                    whiteSpace: "pre-wrap",
                    margin: 0
                  }}
                >
                  {project.script}
                </pre>
              </div>
            </div>
          </div>
        </motion.div>
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

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      variants={staggerItem}
      style={{ padding: "14px 20px", borderRight: "1px solid var(--cream-deep)", display: "flex", flexDirection: "column", gap: 2 }}
    >
      <span style={{ fontWeight: 600, fontSize: 20, color: "var(--ink)", lineHeight: 1.2 }}>{value}</span>
      <span style={{ ...mono10, color: "var(--mute)" }}>{label}</span>
    </motion.div>
  );
}

function RailBeatItem({
  beat,
  expanded,
  onToggle
}: {
  beat: Beat;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pad = String(beat.n).padStart(2, "0");
  return (
    <motion.button
      type="button"
      variants={staggerItem}
      onClick={onToggle}
      style={{
        display: "grid",
        gridTemplateColumns: "30px 1fr",
        gap: 10,
        alignItems: "start",
        textAlign: "left",
        width: "100%",
        padding: 10,
        border: 0,
        borderRadius: 12,
        cursor: "pointer",
        background: expanded ? "var(--cream-deep)" : "transparent",
        color: "var(--ink)",
        fontFamily: "var(--font-ui)"
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: expanded ? "var(--accent)" : "var(--mute)", paddingTop: 2 }}>
        {pad}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <span style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.35 }}>{beat.title || "Untitled beat"}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.02em", color: "var(--mute)" }}>
          {beat.scene_heading || "—"}
        </span>
        {beat.flag && (
          <span
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.02em",
              borderRadius: 999,
              background: "rgba(232,74,53,0.16)",
              color: "var(--tomato-deep)"
            }}
          >
            <Flag size={8} /> {beat.flag.toUpperCase()}
          </span>
        )}
        {expanded && beat.summary && (
          <span style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-soft)", marginTop: 2 }}>{beat.summary}</span>
        )}
      </span>
    </motion.button>
  );
}

function SceneCard({ beat, rot }: { beat: Beat; rot: string }) {
  return (
    <motion.article
      className="scene-card"
      variants={staggerItem}
      style={{ "--card-rot": rot, borderRadius: 18 } as React.CSSProperties}
    >
      <div className="scene-card-head">
        <span className="scene-card-no" style={{ letterSpacing: "0.02em" }}>
          SCENE {String(beat.n).padStart(2, "0")}
        </span>
        {beat.flag && (
          <span
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.02em",
              borderRadius: 999,
              background: "rgba(232,74,53,0.16)",
              color: "var(--tomato-deep)"
            }}
          >
            <Flag size={10} /> {beat.flag.toUpperCase()}
          </span>
        )}
      </div>
      <div className="scene-card-slug">{beat.scene_heading || "—"}</div>
      <h3 className="scene-card-title" style={{ fontWeight: 600 }}>
        {beat.title || "Untitled beat"}
      </h3>
      {beat.summary && <p className="scene-card-sum">{beat.summary}</p>}
      {beat.characters.length > 0 && (
        <div className="tag-strip" style={{ marginTop: "auto" }}>
          {beat.characters.map((c) => (
            <span key={c} className="tag" style={{ background: "var(--bg)" }}>
              {c}
            </span>
          ))}
        </div>
      )}
    </motion.article>
  );
}

/* Old single-modal BibleModal removed. Movie Bible lives in
   app/_components/MovieBibleModal.tsx with sidebar nav + 10 sections. */
