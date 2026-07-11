"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "./icons";
import { pageIn, tap } from "./motion";
import type { AspectRatio, LengthEstimate, ProjectFormat } from "../../lib/types";

const FORMATS: ProjectFormat[] = ["Short Film", "Music Video", "Ad", "Series", "Feature", "Other"];
const LENGTHS: LengthEstimate[] = ["Under 1 min", "Under 5 min", "5–15 min", "15–30 min", "30+ min"];
const ASPECTS: { value: AspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9 landscape" },
  { value: "9:16", label: "9:16 portrait" },
  { value: "1:1", label: "1:1 square" },
  { value: "4:5", label: "4:5 social" },
  { value: "21:9", label: "21:9 ultrawide" }
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    title: string;
    logline: string;
    creative_brief: string;
    brand_kit: string;
    format: ProjectFormat;
    length_estimate: LengthEstimate;
    aspect_ratio: AspectRatio;
  }) => Promise<void>;
}

const fieldLabelStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: "0.02em",
  color: "var(--mute)"
};

const fieldInputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 16px",
  fontFamily: "var(--font-ui)",
  fontSize: 15,
  color: "var(--ink)",
  background: "var(--bg)",
  border: "none",
  borderRadius: 18,
  boxShadow: "inset 0 0 0 1.5px var(--cream-deep)",
  outline: "none",
  boxSizing: "border-box"
};

const ghostPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 18px",
  fontFamily: "var(--font-ui)",
  fontWeight: 600,
  fontSize: 14,
  color: "var(--ink)",
  backdropFilter: "blur(10px)",
  background: "color-mix(in srgb, var(--ink) 5%, transparent)",
  border: 0,
  boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--ink) 22%, transparent)",
  borderRadius: 999,
  cursor: "pointer"
};

const primaryPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 18px",
  fontFamily: "var(--font-ui)",
  fontWeight: 600,
  fontSize: 14,
  color: "var(--on-accent)",
  background: "var(--accent)",
  border: "none",
  borderRadius: 999,
  boxShadow: "var(--shadow-1)",
  cursor: "pointer"
};

/* `tap` (motion.ts) covers the press; hover is a background swap only —
   the mockup's ghost vs. primary pill hover, no motion. */
const GHOST_HOVER = { background: "color-mix(in srgb, var(--ink) 14%, transparent)" };
const PRIMARY_HOVER = { background: "var(--accent-hover)" };

function disabledStyle(disabled: boolean): CSSProperties {
  return disabled ? { opacity: 0.5, pointerEvents: "none" } : {};
}

function chipStyle(active: boolean, mono = false): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 14px",
    fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
    fontWeight: 600,
    fontSize: 13,
    color: active ? "var(--accent)" : "var(--ink-soft)",
    background: "var(--bg)",
    border: "none",
    borderRadius: 999,
    boxShadow: active ? "inset 0 0 0 1.5px var(--accent)" : "inset 0 0 0 1px var(--cream-deep)",
    cursor: "pointer"
  };
}

export function NewProjectModal({ open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [logline, setLogline] = useState("");
  const [brief, setBrief] = useState("");
  const [brand, setBrand] = useState("");
  const [format, setFormat] = useState<ProjectFormat>("Short Film");
  const [length, setLength] = useState<LengthEstimate>("Under 5 min");
  const [aspect, setAspect] = useState<AspectRatio>("16:9");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await onCreate({
        title: title.trim(),
        logline: logline.trim(),
        creative_brief: brief.trim(),
        brand_kit: brand.trim(),
        format,
        length_estimate: length,
        aspect_ratio: aspect
      });
      setTitle("");
      setLogline("");
      setBrief("");
      setBrand("");
      setFormat("Short Film");
      setLength("Under 5 min");
      setAspect("16:9");
    } finally {
      setBusy(false);
    }
  }

  const submitDisabled = !title.trim() || busy;

  return (
    <motion.div
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.62)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 130,
        padding: 28
      }}
    >
      <motion.form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        {...pageIn}
        style={{
          backdropFilter: "blur(24px)",
          background: "var(--surface)",
          borderRadius: 24,
          padding: 32,
          maxWidth: 480,
          width: "100%",
          boxShadow: "var(--shadow-3)",
          maxHeight: "calc(100vh - 56px)",
          overflow: "auto"
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em", color: "var(--accent)" }}>
          New project
        </span>
        <h2 style={{ margin: "8px 0 0", fontWeight: 600, fontSize: 22, letterSpacing: "-0.01em", color: "var(--ink)" }}>
          Brief the crew
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>Project title</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Lisbon Pact"
              required
              style={fieldInputStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>Logline (optional)</span>
            <textarea
              value={logline}
              onChange={(e) => setLogline(e.target.value)}
              placeholder="One sentence. What's the story?"
              rows={2}
              style={{ ...fieldInputStyle, resize: "vertical" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>Creative brief (optional — steers every generation)</span>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="What is this? Tone, audience, story you want — e.g. 'funny 20s meme about Monday mornings' or 'warm cinematic ad, family feeling, golden light'"
              rows={3}
              style={{ ...fieldInputStyle, resize: "vertical" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>Brand &amp; products (optional — placed into scenes)</span>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Kindle Coffee — red-logo cups, barista aprons, storefront sign"
              style={fieldInputStyle}
            />
          </label>

          <div>
            <span style={fieldLabelStyle}>Format</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {FORMATS.map((option) => (
                <motion.button
                  type="button"
                  key={option}
                  {...tap}
                  onClick={() => setFormat(option)}
                  style={chipStyle(format === option)}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <span style={fieldLabelStyle}>Estimated length</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {LENGTHS.map((option) => (
                <motion.button
                  type="button"
                  key={option}
                  {...tap}
                  onClick={() => setLength(option)}
                  style={chipStyle(length === option)}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <span style={fieldLabelStyle}>Aspect ratio</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {ASPECTS.map((option) => (
                <motion.button
                  type="button"
                  key={option.value}
                  {...tap}
                  onClick={() => setAspect(option.value)}
                  title={option.label}
                  style={chipStyle(aspect === option.value, true)}
                >
                  {option.value}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
          <motion.button
            type="button"
            {...tap}
            whileHover={GHOST_HOVER}
            onClick={onClose}
            style={ghostPillStyle}
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            {...tap}
            whileHover={PRIMARY_HOVER}
            disabled={submitDisabled}
            style={{ ...primaryPillStyle, ...disabledStyle(submitDisabled) }}
          >
            {busy ? "Creating…" : "Assemble crew"} <ArrowRight size={14} />
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}
