"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, BookOpen, Film, FileText, ListChecks, Music, X, type IconType } from "../_components/icons";
import { fadeUp, staggerContainer, staggerItem, tap } from "../_components/motion";
import type { Project, WorkspaceId } from "../../lib/types";

interface Props {
  project: Project;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

interface RenderResult {
  url: string;
  shots: number;
  duration: number;
  titled?: boolean;
  scored?: boolean;
  hasAudio?: boolean;
}

export function Export({ project }: Props) {
  const [rendering, setRendering] = useState(false);
  const [cut, setCut] = useState<RenderResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [score, setScore] = useState<{ attached: boolean; ext: string | null } | null>(null);
  const [scoreBusy, setScoreBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/projects/${project.id}/score`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setScore(d))
      .catch(() => {});
  }, [project.id]);

  async function renderCut() {
    setRendering(true);
    setErr(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/render`, { method: "POST" });
      const data = await res.json();
      if (data.url) setCut(data as RenderResult);
      else setErr(data.error || "Render failed.");
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setRendering(false);
    }
  }

  async function uploadScore(file: File) {
    setScoreBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/projects/${project.id}/score`, { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) setScore({ attached: true, ext: data.ext });
      else setErr(data.error || "Couldn't attach that track.");
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setScoreBusy(false);
    }
  }

  async function removeScore() {
    setScoreBusy(true);
    try {
      await fetch(`/api/projects/${project.id}/score`, { method: "DELETE" });
      setScore({ attached: false, ext: null });
    } finally {
      setScoreBusy(false);
    }
  }

  // The render route always pads/scales to the project's own canvas, so the
  // real output aspect ratio is exactly this — not the mockup's fixed 16:9.
  const aspect = project.aspect_ratio.replace(":", "/");
  const exStatus = rendering ? "RENDERING…" : err ? "ERROR" : cut ? "RENDERED" : "READY";
  const exBtnLabel = rendering ? "Rendering…" : cut ? "Re-render · free" : "Render final cut · free";

  return (
    <div className="main-inner">
      <motion.header className="page-head" {...fadeUp}>
        <div style={{ minWidth: 0, maxWidth: "64ch" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.02em",
              color: "var(--accent)"
            }}
          >
            07 / Workspace · Export
          </span>
          <h1
            style={{
              margin: "8px 0 0",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(24px, 2.4vw, 32px)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--ink)"
            }}
          >
            Export
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontWeight: 500,
              fontSize: 16,
              lineHeight: 1.5,
              color: "var(--ink)",
              maxWidth: "56ch"
            }}
          >
            Hand off the project. Animatic for pitch decks, storyboard for the crew, shot list for
            production, bible for the writers&apos; room.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.02em",
              borderRadius: 999,
              background: "var(--cream-deep)",
              color: "var(--ink-soft)"
            }}
          >
            {project.title}
          </span>
        </div>
      </motion.header>

      <div className="page-body">
        <motion.div
          className="export-grid"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={staggerItem}
            style={{
              padding: 28,
              background: "var(--surface)",
              borderRadius: 18,
              boxShadow: "var(--shadow-2)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 320
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ color: "var(--mute)" }}>
                <Film size={28} />
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  color: "var(--accent)"
                }}
              >
                {exStatus}
              </span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 22, letterSpacing: "-0.01em", color: "var(--ink)", lineHeight: 1.25 }}>
              Final cut
            </div>
            <div style={{ color: "var(--mute)", fontSize: 13, lineHeight: 1.5 }}>
              The full assembly — title card, Ken Burns on stills, crossfades between shots, and a
              fade to black at each end. 1080p, ready to hand off.
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "var(--bg)",
                borderRadius: 14,
                fontSize: 12
              }}
            >
              <Music size={15} style={{ color: score?.attached ? "var(--viridian)" : "var(--mute)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                  {score?.attached ? `Music score attached (.${score.ext})` : "No music score"}
                </div>
                <div style={{ color: "var(--mute)", fontSize: 11 }}>
                  {score?.attached
                    ? "Mixed under the cut on the next render — ducked automatically if a clip has its own audio."
                    : "Attach an MP3/WAV and it rides under the cut with a fade in/out."}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.m4a,.wav,.aac,audio/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadScore(f);
                  e.target.value = "";
                }}
              />
              <motion.button
                {...tap}
                type="button"
                disabled={scoreBusy}
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-sm"
                style={{ background: "var(--surface)", flexShrink: 0 }}
              >
                {scoreBusy ? "…" : score?.attached ? "Replace" : "Attach track"}
              </motion.button>
              {score?.attached && (
                <motion.button
                  {...tap}
                  type="button"
                  disabled={scoreBusy}
                  onClick={removeScore}
                  title="Remove the attached score"
                  className="btn btn-sm"
                  style={{ background: "var(--surface)", color: "var(--tomato)", flexShrink: 0, padding: "8px 10px" }}
                >
                  <X size={12} />
                </motion.button>
              )}
            </div>

            {rendering && (
              <div
                className="shimmer"
                style={{
                  position: "relative",
                  borderRadius: 18,
                  overflow: "hidden",
                  background: "var(--cream-deep)",
                  aspectRatio: aspect,
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.02em",
                    color: "var(--mustard-deep)"
                  }}
                >
                  STITCHING SHOTS + TRANSITIONS…
                </span>
              </div>
            )}

            {!rendering && cut && (
              <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: "#14100c", aspectRatio: aspect }}>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src={cut.url}
                  controls
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: 8,
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    letterSpacing: "0.02em",
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "var(--viridian)",
                    color: "var(--on-accent-3)",
                    pointerEvents: "none"
                  }}
                >
                  {cut.shots} SHOTS · {cut.duration}S
                </span>
              </div>
            )}

            {!rendering && cut && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="pip-state" data-status="done">
                  MASTER FINISH
                </span>
                {cut.titled && (
                  <span className="pip-state" data-status="done">
                    TITLE CARD
                  </span>
                )}
                {cut.scored && (
                  <span className="pip-state" data-status="done">
                    SCORED
                  </span>
                )}
                {cut.hasAudio && !cut.scored && (
                  <span className="pip-state" data-status="done">
                    CLIP AUDIO
                  </span>
                )}
              </div>
            )}

            {err && <div className="cast-error">{err}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: "auto", alignItems: "stretch" }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                disabled={rendering}
                onClick={renderCut}
              >
                {exBtnLabel}
              </button>
              {!rendering && cut && (
                <a
                  className="btn btn-sm"
                  href={cut.url}
                  download
                  style={{ justifyContent: "center", alignItems: "center", background: "var(--bg)" }}
                >
                  <ArrowDown size={14} /> Download
                </a>
              )}
            </div>
          </motion.div>

          <ExportCard
            icon={FileText}
            title="Storyboard PDF"
            body="Selected frames laid out in narrative order. Bring it to a director, a DP, a producer, an investor."
            options={[
              { label: "Layout", values: ["2 frames / page", "1 frame / page", "4 frames / page", "Contact sheet"] },
              { label: "Annotations", values: ["+ Beat description", "Frame only", "+ Scene + cast tags"] }
            ]}
            cta="Export storyboard"
          />

          <ExportCard
            icon={ListChecks}
            title="Shot list"
            body="One row per beat with location, cast, props, mood, and continuity flags. The doc your AD will actually use."
            options={[
              { label: "Format", values: ["CSV", "PDF", "XLSX"] },
              { label: "Sort by", values: ["Beat order", "Location", "Cast", "Day / Night"] }
            ]}
            cta="Export shot list"
          />

          <ExportCard
            icon={BookOpen}
            title="Production bible"
            body="Character profiles, world rules, tone document. Everything the Bible Builder put together — in one file."
            options={[
              { label: "Format", values: ["PDF", "DOCX", "Markdown"] },
              { label: "Sections", values: ["Full bible", "Characters only", "World + tone only"] }
            ]}
            cta="Export bible"
          />
        </motion.div>
      </div>
    </div>
  );
}

function ExportCard({
  icon: Icn,
  title,
  body,
  options
}: {
  icon: IconType;
  title: string;
  body: string;
  options: Array<{ label: string; values: string[] }>;
  cta: string;
}) {
  // These exports aren't wired yet — show them honestly as planned rather than
  // faking a "packaging…" spinner that produces nothing.
  return (
    <motion.div
      variants={staggerItem}
      style={{
        padding: 28,
        background: "var(--surface)",
        borderRadius: 18,
        boxShadow: "var(--shadow-2)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 320,
        opacity: 0.78
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ color: "var(--mute)" }}>
          <Icn size={28} />
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.02em",
            color: "var(--mute)"
          }}
        >
          SOON
        </span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 22, letterSpacing: "-0.01em", color: "var(--ink)", lineHeight: 1.25 }}>
        {title}
      </div>
      <div style={{ color: "var(--mute)", fontSize: 13, lineHeight: 1.5 }}>{body}</div>
      {options.map((opt) => (
        <label
          key={opt.label}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            color: "var(--mute)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.02em"
          }}
        >
          {opt.label}
          <select
            defaultValue={opt.values[0]}
            disabled
            style={{
              padding: "10px 12px",
              background: "var(--bg)",
              color: "var(--ink)",
              border: "none",
              borderRadius: 18,
              boxShadow: "inset 0 0 0 1.5px var(--cream-deep)",
              fontFamily: "var(--font-ui)",
              fontSize: 13,
              fontWeight: 500,
              textTransform: "none",
              letterSpacing: 0
            }}
          >
            {opt.values.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button
        disabled
        title="Not available yet"
        style={{
          marginTop: "auto",
          justifyContent: "center",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          fontWeight: 600,
          fontSize: 14,
          color: "var(--ink)",
          background: "var(--bg)",
          border: "none",
          borderRadius: 999,
          boxShadow: "var(--shadow-1)",
          cursor: "not-allowed",
          opacity: 0.6
        }}
      >
        Coming soon
      </button>
    </motion.div>
  );
}
