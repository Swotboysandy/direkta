"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Flag, Lock, RefreshCw, Sparkles, Upload, Wand2 } from "../_components/icons";
import { MovieBibleModal } from "../_components/MovieBibleModal";
import { pageIn } from "../_components/motion";
import { ProjectRules } from "../_components/ProjectRules";
import { registerInspector, type InspectorBodyProps } from "../_components/Inspector";
import { Button } from "../_components/ui/button";
import { EmptyState } from "../_components/ui/empty-state";
import { InlineError } from "../_components/ui/inline-error";
import { Status } from "../_components/ui/status";
import { useConfirm } from "../_components/ui/alert-dialog";
import { useSelection } from "../_state/selection";
import { STAGE_LABELS } from "../_lib/stages";
import type { Beat, Bible, Character, Location, Project, WorkspaceId } from "../../lib/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ lines
   A screenplay is a list of lines, each of one kind. The classifier is a
   small Fountain-shaped heuristic — enough to style headings, cues,
   dialogue and transitions on a rendered page and to build the scene
   outline, without a rich editor. The textarea stays the editor; the
   rendered page is what the writer reads. */

type LineKind = "blank" | "heading" | "action" | "character" | "parenthetical" | "dialogue" | "transition" | "note";

interface Line {
  i: number;
  text: string;
  kind: LineKind;
}

const HEADING = /^(INT|EXT|INT\.?\/EXT|I\/E|EST)[.\s]/i;
const TRANSITION = /^(FADE (IN|OUT|TO)|CUT TO|DISSOLVE TO|SMASH CUT|MATCH CUT|THE END)\b.*:?$/;

function classify(text: string): Line[] {
  const raw = text.split("\n");
  const out: Line[] = [];
  let prev: LineKind = "blank";
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i];
    const s = t.trim();
    let kind: LineKind;
    if (!s) kind = "blank";
    else if (/^(\[\[.*\]\]|\/\/)/.test(s)) kind = "note";
    else if (HEADING.test(s) || /^\.[A-Za-z]/.test(s)) kind = "heading";
    else if ((s === s.toUpperCase() && TRANSITION.test(s)) || /^[A-Z][A-Z .]*TO:$/.test(s)) kind = "transition";
    else if (/^\(.*\)$/.test(s) && (prev === "character" || prev === "dialogue" || prev === "parenthetical")) kind = "parenthetical";
    else if (prev === "character" || prev === "parenthetical" || prev === "dialogue") kind = "dialogue";
    else if (
      prev === "blank" &&
      s === s.toUpperCase() &&
      /[A-Z]/.test(s) &&
      s.length <= 40 &&
      !/[.!?]$/.test(s) &&
      (raw[i + 1] ?? "").trim()
    )
      kind = "character";
    else kind = "action";
    out.push({ i, text: t, kind });
    prev = kind;
  }
  return out;
}

function truncate(s: string, n = 60) {
  const one = s.replace(/\s+/g, " ").trim();
  return one.length > n ? one.slice(0, n - 1) + "…" : one;
}

/* ------------------------------------------------------------- inspector
   The beat inspector body reads the beats through a module-level slot the
   workspace keeps current: the registry hands a body only the selection,
   and Screenplay is always mounted, so the slot is never stale while a beat
   can be selected. */

const beatContext: { beats: Beat[]; locations: Location[] } = { beats: [], locations: [] };

function BeatInspector({ selected }: InspectorBodyProps) {
  const beat = beatContext.beats.find((b) => b.id === selected.id);
  if (!beat) return <p className="script-insp-missing">This beat is no longer in the script.</p>;
  const location = beatContext.locations.find((l) => l.id === beat.location_id)?.name;
  const rows: [string, React.ReactNode][] = [
    ["Scene", beat.scene_heading || "—"],
    ["Summary", beat.summary || "—"],
    ["Cast", beat.characters.length ? beat.characters.join(", ") : "—"],
    ["Location", location ?? "—"],
    ["Mood", beat.mood.length ? beat.mood.join(", ") : "—"],
    ["Props", beat.props.length ? beat.props.join(", ") : "—"],
    ["Direction", beat.direction || "—"],
    ["Notes", beat.notes || "—"]
  ];
  return (
    <div className="script-insp">
      <p className="script-insp-title">
        <span className="script-no">{String(beat.n).padStart(2, "0")}</span> {beat.title || "Untitled beat"}
      </p>
      {beat.flag && (
        <span className="script-flag">
          <Flag size={9} /> {beat.flag.toUpperCase()}
        </span>
      )}
      <dl className="script-insp-facts">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

registerInspector("beat", BeatInspector);

/* --------------------------------------------------------------- props */

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

interface Err {
  message: string;
  detail?: string | null;
}

const SUBMIT_WORDS = 50;

/** 502/503 from generate or enhance means there is no text model behind the
 *  route, not that the script was bad. Name where the key goes. */
function modelError(status: number, raw: string | undefined, fallback: string): Err {
  if (status === 502 || status === 503) {
    return {
      message: "No text model is available. Add a model key in the Key Vault (top bar), then try again.",
      detail: raw ?? null
    };
  }
  return { message: raw ?? fallback };
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
  const confirmDialog = useConfirm();
  const { select, primary } = useSelection();
  const [draft, setDraft] = useState(project.script);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<Err | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<"write" | "read">("write");
  const [view, setView] = useState<"script" | "beats">("script");
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [bibleOpen, setBibleOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const lastSavedRef = useRef(project.script);

  beatContext.beats = beats;
  beatContext.locations = locations;

  useEffect(() => {
    setDraft(project.script);
    lastSavedRef.current = project.script;
  }, [project.id, project.script]);

  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const canSubmit = words >= SUBMIT_WORDS && !project.script_submitted;
  const submitted = project.script_submitted;
  const lines = useMemo(() => classify(submitted ? project.script : draft), [submitted, project.script, draft]);
  const headings = useMemo(() => lines.filter((l) => l.kind === "heading"), [lines]);

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
    setStarted(true);
    setMode("write");
    setDraft("");
    try {
      const res = await fetch(`/api/projects/${project.id}/script/generate`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        setGenError(modelError(res.status, err.error, "Generation failed"));
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
      setGenError({ message: "Generation failed", detail: String(err) });
    } finally {
      setGenerating(false);
    }
  }

  /* Rewrite whatever is in the editor into a director's shooting draft —
     deeper subtext plus a per-scene DIRECTION block (shot, move, light, sound,
     continuity) so each beat is filmable frame by frame. */
  async function enhanceScript() {
    if (busy || generating || !draft.trim()) return;
    setGenerating(true);
    setGenError(null);
    setMode("write");
    const source = draft;
    try {
      const res = await fetch(`/api/projects/${project.id}/script/enhance`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ script: source })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Enhance failed" }));
        setGenError(modelError(res.status, err.error, "Enhance failed"));
        return;
      }
      setDraft("");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setDraft(full);
      }
      // A failed/empty stream must not wipe the writer's draft.
      if (!full.trim()) {
        setDraft(source);
        setGenError({ message: "Direct it returned nothing — your draft is restored." });
        return;
      }
      lastSavedRef.current = full;
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ script: full, script_ai_generated: true })
      });
      await onReload();
    } catch (err) {
      setDraft(source);
      setGenError({ message: "Direct it failed — your draft is restored.", detail: String(err) });
    } finally {
      setGenerating(false);
    }
  }

  async function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setGenError(null);
    setStarted(true);

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
        else setGenError({ message: "Could not read that PDF.", detail: data.error ?? null });
      } catch (err) {
        setGenError({ message: "Could not read that PDF.", detail: String(err) });
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

  async function unlock() {
    if (
      !(await confirmDialog({
        title: "Unlock the script for editing?",
        description:
          "Beats will be extracted again when you resubmit. Re-extraction replaces every beat, which also clears the storyboard rows and shots attached to them. Characters and their looks are kept.",
        confirmLabel: "Unlock script"
      }))
    )
      return;
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ script_submitted: false })
    });
    await onReload();
  }

  /* --- selection: the passage under the cursor is the Dock's context --- */

  function selectPassage(text: string, line: number) {
    const passage = text.trim();
    if (passage) {
      select({ kind: "scene", id: `line-${line}`, label: truncate(passage), projectId: project.id });
    } else if (primary?.kind === "scene") {
      select(null);
    }
  }

  function onTextareaSelect(e: React.SyntheticEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;
    const line = draft.slice(0, ta.selectionStart).split("\n").length - 1;
    setActiveLine(line);
    selectPassage(draft.slice(ta.selectionStart, ta.selectionEnd), line);
  }

  function onPageSelect() {
    const sel = window.getSelection();
    if (!sel || !pageRef.current) return;
    const node = sel.anchorNode;
    if (!node || !pageRef.current.contains(node)) return;
    const el = (node instanceof Element ? node : node.parentElement)?.closest<HTMLElement>("[data-line]");
    const line = el ? Number(el.dataset.line) : 0;
    setActiveLine(line);
    selectPassage(sel.toString(), line);
  }

  /* --- jumping: the outline points into the page or the textarea --- */

  function jumpTo(line: number) {
    setActiveLine(line);
    if (!submitted && mode === "write") {
      const ta = textareaRef.current;
      if (!ta) return;
      const pos = lines.slice(0, line).reduce((n, l) => n + l.text.length + 1, 0);
      ta.focus();
      ta.setSelectionRange(pos, pos);
      // The textarea grows with its content, so the page scrolls, not the
      // field. Monospace makes the visual row of a line a cheap estimate:
      // rows so far = for each line, ceil(chars / columns).
      const cs = getComputedStyle(ta);
      const lh = parseFloat(cs.lineHeight);
      const charW = parseFloat(cs.fontSize) * 0.6;
      const cols = Math.max(20, Math.floor((ta.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) / charW));
      const rows = lines.slice(0, line).reduce((n, l) => n + Math.max(1, Math.ceil(l.text.length / cols)), 0);
      const y = ta.getBoundingClientRect().top + parseFloat(cs.paddingTop) + rows * lh;
      const main = ta.closest<HTMLElement>(".main");
      if (main) main.scrollBy({ top: y - main.getBoundingClientRect().top - 96, behavior: "smooth" });
      return;
    }
    pageRef.current?.querySelector(`[data-line="${line}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function selectBeat(beat: Beat) {
    select({ kind: "beat", id: beat.id, label: `Beat ${String(beat.n).padStart(2, "0")} · ${beat.title || "Untitled"}`, projectId: project.id });
    const target = beat.scene_heading?.trim().toLowerCase();
    if (!target) return;
    const hit = headings.find((h) => h.text.trim().toLowerCase() === target) ?? headings.find((h) => h.text.trim().toLowerCase().startsWith(target));
    if (hit && view === "script") jumpTo(hit.i);
  }

  const activeHeading = useMemo(() => {
    if (activeLine === null) return null;
    let cur: number | null = null;
    for (const h of headings) {
      if (h.i <= activeLine) cur = h.i;
      else break;
    }
    return cur;
  }, [headings, activeLine]);

  const locationName = (id: string | null) => locations.find((l) => l.id === id)?.name;
  const hasScript = draft.trim().length > 0;
  const showEditor = submitted || hasScript || started || generating || importing;

  /* ================================================================ */

  return (
    <motion.div className="main-inner script" {...pageIn}>
      <header className="page-head">
        <div>
          <span className="ws-eyebrow">{STAGE_LABELS.screenplay}</span>
          <h1 className="ws-title">{project.title}</h1>
          <p className="ws-lead">
            {!submitted ? (
              <>
                Write or paste the screenplay here. On submit, <strong>Script Reader</strong> breaks it into beats and{" "}
                <strong>Bible Builder</strong> drafts the production bible.
              </>
            ) : beats.length === 0 ? (
              extracting
                ? "Script Reader is reading the screenplay — beats will appear shortly."
                : "Script submitted. Extract beats to break it into scenes."
            ) : (
              `${beats.length} beat${beats.length === 1 ? "" : "s"} extracted. ${
                bible?.built ? "Bible is built." : "Bible Builder is queued."
              } The script is locked — everything downstream builds from this draft.`
            )}
          </p>
        </div>

        <div className="page-head-actions script-actions">
          {!submitted ? (
            <>
              <span className="script-meta" aria-live="polite">
                {words} {words === 1 ? "word" : "words"}
              </span>
              <input ref={fileInputRef} type="file" accept=".txt,.fountain,.fdx,.md,.pdf" hidden onChange={importFile} />
              <Button
                disabled={busy || generating || importing}
                title={generating ? "Wait for generation to finish" : "Import a script file (.txt, .fountain, .fdx, .pdf)"}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} /> {importing ? "Reading PDF…" : "Import file"}
              </Button>
              <Button
                disabled={busy || generating}
                title={generating ? "Generation is running" : project.script_ai_generated ? "Generate a fresh draft" : "Generate a first draft"}
                onClick={generateScript}
              >
                {generating ? (
                  <><Sparkles size={14} /> Generating…</>
                ) : project.script_ai_generated ? (
                  <><RefreshCw size={14} /> Regenerate</>
                ) : (
                  <><Sparkles size={14} /> Generate with AI</>
                )}
              </Button>
              <Button
                disabled={busy || generating || !hasScript}
                title={!hasScript ? "Write or import a script first" : generating ? "Generation is running" : "Rewrite this draft deeper and attach per-scene shot direction"}
                onClick={enhanceScript}
              >
                <Wand2 size={14} /> Direct it
              </Button>
              <span className="script-submit">
                <Button
                  intent="primary"
                  disabled={!canSubmit || busy || generating}
                  title={!canSubmit ? `Needs at least ${SUBMIT_WORDS} words` : undefined}
                  onClick={submit}
                >
                  {busy ? "Reading…" : "Submit to Script Reader"} <ArrowRight size={14} />
                </Button>
                {!canSubmit && !busy && (
                  <span className="script-meta">{SUBMIT_WORDS - words} more words to submit</span>
                )}
              </span>
            </>
          ) : (
            <>
              {extracting ? (
                <Status domain="generation" value="Processing" detail="extracting beats" />
              ) : (
                <Status domain="creative" value="Locked" detail={`draft ${project.draft_version}`} />
              )}
              <Button onClick={unlock} title="Unlocking re-extracts beats on resubmit">
                <Lock size={13} /> Unlock &amp; edit
              </Button>
              <Button
                disabled={!bible}
                title={bible ? "Open the production bible" : "The bible is built after beats are extracted"}
                onClick={() => setBibleOpen(true)}
              >
                <FileText size={14} /> View Bible
              </Button>
              <Button intent="primary" onClick={() => onSwitchWorkspace("casting")}>
                Continue to {STAGE_LABELS.casting} <ArrowRight size={14} />
              </Button>
            </>
          )}
        </div>
      </header>

      {genError && (
        <InlineError
          className="script-error"
          message={genError.message}
          detail={genError.detail}
          onRetry={project.script_ai_generated ? generateScript : undefined}
        />
      )}

      {!submitted && <ProjectRules project={project} />}

      {submitted && (
        <dl className="script-facts">
          <div><dt>Beats</dt><dd>{beats.length}</dd></div>
          <div><dt>Characters</dt><dd>{characters.length}</dd></div>
          <div><dt>Locations</dt><dd>{locations.length}</dd></div>
          <div><dt>Bible</dt><dd>{bible?.built ? `${(bible.word_count ?? 0).toLocaleString()} words` : "pending"}</dd></div>
          {beats.length > 0 && (
            <div className="script-facts-view" role="tablist" aria-label="Breakdown view">
              {(["script", "beats"] as const).map((v) => (
                <Button key={v} size="sm" intent={view === v ? "secondary" : "ghost"} role="tab" aria-selected={view === v} onClick={() => setView(v)}>
                  {v === "script" ? "Script" : "Beats"}
                </Button>
              ))}
            </div>
          )}
        </dl>
      )}

      {!showEditor ? (
        <EmptyState
          className="script-empty"
          title="No script yet"
          why="The script is the source of every beat, character, location and shot downstream. This production has none: nothing has been written, imported or generated."
          action={{
            label: "Write the script",
            onClick: () => {
              setStarted(true);
              setMode("write");
              requestAnimationFrame(() => textareaRef.current?.focus());
            }
          }}
          secondary={{ label: "Import a file", onClick: () => fileInputRef.current?.click() }}
        />
      ) : submitted && view === "beats" ? (
        <div className="script-grid" role="list">
          {beats.map((beat) => (
            <BeatCard
              key={beat.id}
              beat={beat}
              location={locationName(beat.location_id)}
              selected={primary?.kind === "beat" && primary.id === beat.id}
              onSelect={() => selectBeat(beat)}
            />
          ))}
        </div>
      ) : (
        <div className="script-body">
          {/* ── outline ─────────────────────────────────────────── */}
          <aside className="script-outline" aria-label={submitted ? "Beats" : "Scenes"}>
            <p className="script-outline-head">
              {submitted ? "Beats" : "Scenes"}
              <span className="script-meta">{submitted ? beats.length : headings.length}</span>
            </p>
            {submitted ? (
              beats.length === 0 ? (
                <div className="script-outline-empty">
                  <EmptyState
                    title="No beats yet"
                    why={
                      extracting
                        ? "Script Reader is breaking the script into beats — cast, location, mood and props per scene."
                        : "Beats are how the script becomes scenes. They have not been extracted from this draft."
                    }
                    action={{ label: extractError ? "Retry extraction" : "Extract beats", onClick: extractBeats, disabled: extracting }}
                  />
                  {extractError && <InlineError message="Extraction failed." detail={extractError} onRetry={extractBeats} />}
                </div>
              ) : (
                <ol className="script-outline-list">
                  {beats.map((beat) => (
                    <li key={beat.id}>
                      <button
                        type="button"
                        className={cn("script-outline-item", primary?.kind === "beat" && primary.id === beat.id && "is-active")}
                        onClick={() => selectBeat(beat)}
                      >
                        <span className="script-no">{String(beat.n).padStart(2, "0")}</span>
                        <span className="script-outline-copy">
                          <span className="script-outline-title">{beat.title || "Untitled beat"}</span>
                          <span className="script-outline-sub">{beat.scene_heading || "—"}</span>
                          {(beat.characters.length > 0 || beat.location_id) && (
                            <span className="script-chips">
                              {beat.characters.map((c) => (
                                <span key={c} className="script-chip">{c}</span>
                              ))}
                              {locationName(beat.location_id) && (
                                <span className="script-chip is-location">{locationName(beat.location_id)}</span>
                              )}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              )
            ) : headings.length === 0 ? (
              <p className="script-outline-note">
                Scene headings (INT. / EXT.) will appear here as you write them, and help Script Reader find beats.
              </p>
            ) : (
              <ol className="script-outline-list">
                {headings.map((h, n) => (
                  <li key={h.i}>
                    <button
                      type="button"
                      className={cn("script-outline-item", activeHeading === h.i && "is-active")}
                      onClick={() => jumpTo(h.i)}
                    >
                      <span className="script-no">{String(n + 1).padStart(2, "0")}</span>
                      <span className="script-outline-copy">
                        <span className="script-outline-title">{h.text.trim().replace(/^\./, "")}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </aside>

          {/* ── the page ────────────────────────────────────────── */}
          <section className="script-surface" aria-label="Screenplay">
            {!submitted && (
              <div className="script-surface-bar">
                <div role="tablist" aria-label="Editor mode" className="script-modes">
                  {(["write", "read"] as const).map((m) => (
                    <Button key={m} size="sm" intent={mode === m ? "secondary" : "ghost"} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}>
                      {m === "write" ? "Write" : "Read"}
                    </Button>
                  ))}
                </div>
                <span className="script-meta">
                  {generating ? "Streaming…" : draft === lastSavedRef.current ? "Saved" : "Saving…"}
                </span>
              </div>
            )}
            {!submitted && mode === "write" ? (
              <textarea
                ref={textareaRef}
                className="script-type script-editor"
                value={draft}
                readOnly={generating}
                spellCheck={false}
                onChange={(e) => setDraft(e.target.value)}
                onSelect={onTextareaSelect}
                placeholder={`INT. WAREHOUSE — NIGHT\n\nMARCUS, 44, picks his way between rusted crates. A flashlight beam — narrow, tired. The air smells like the river.\n\nHe stops. Something pale on the concrete. He doesn't bring the light up immediately.\n\nMARCUS\n  (quiet, to himself)\nDon't.\n\n…`}
              />
            ) : (
              <div ref={pageRef} className="script-type script-page" onMouseUp={onPageSelect} onKeyUp={onPageSelect} tabIndex={0}>
                {lines.map((l) => (
                  <div key={l.i} data-line={l.i} className={cn("sl", `sl-${l.kind}`, activeHeading === l.i && "is-active")}>
                    {l.kind === "blank" ? " " : l.text.trim().replace(/^\./, "")}
                  </div>
                ))}
              </div>
            )}
            {!submitted && (
              <p className="script-tip">
                Final Draft and Fountain format are both fine. Scene headings (INT./EXT.) help Script Reader detect beats cleanly.
              </p>
            )}
          </section>
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
    </motion.div>
  );
}

/* ------------------------------------------------------------ beat card */

function BeatCard({
  beat,
  location,
  selected,
  onSelect
}: {
  beat: Beat;
  location?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={cn("script-beat", selected && "is-selected")} role="listitem" data-selected={selected || undefined}>
      <button type="button" className="script-beat-hit" onClick={onSelect} aria-label={`Select beat ${beat.n}: ${beat.title || "Untitled beat"}`} />
      <header className="script-beat-head">
        <span className="script-no">{String(beat.n).padStart(2, "0")}</span>
        <span className="script-beat-heading">{beat.scene_heading || "—"}</span>
        {beat.flag && (
          <span className="script-flag">
            <Flag size={9} /> {beat.flag.toUpperCase()}
          </span>
        )}
      </header>
      <h3 className="script-beat-title">{beat.title || "Untitled beat"}</h3>
      {beat.summary && <p className="script-beat-sum">{beat.summary}</p>}
      {(beat.characters.length > 0 || location || beat.mood.length > 0) && (
        <div className="script-chips">
          {beat.characters.map((c) => (
            <span key={c} className="script-chip">{c}</span>
          ))}
          {location && <span className="script-chip is-location">{location}</span>}
          {beat.mood.map((m) => (
            <span key={m} className="script-chip is-mood">{m}</span>
          ))}
        </div>
      )}
    </article>
  );
}
