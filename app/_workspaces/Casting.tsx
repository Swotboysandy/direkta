"use client";

import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import { ArrowRight, Check, Plus, RefreshCcw, Sparkles, X } from "../_components/icons";
import { fadeUp, pageIn, staggerContainer, staggerItem, tap } from "../_components/motion";
import type { Character, Location, Project, WorkspaceId } from "../../lib/types";

const LOOK_GRADS = [
  "linear-gradient(150deg, var(--tomato), var(--tomato-deep))",
  "linear-gradient(150deg, var(--mustard), var(--mustard-deep))",
  "linear-gradient(150deg, var(--viridian), var(--viridian-deep))",
  "linear-gradient(150deg, var(--cocoa-soft), var(--cocoa))"
];
function hashName(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function gradFor(name: string, seed: number): string {
  return LOOK_GRADS[(hashName(name) + seed) % LOOK_GRADS.length];
}

type Tone = "success" | "warning" | "danger" | "neutral";

/** Status-pip colors — mirrors the mockup's per-state `pipBg`/`pipFg` pairs. */
function toneColors(tone: Tone): { bg: string; fg: string } {
  if (tone === "success") return { bg: "color-mix(in srgb, var(--viridian) 18%, transparent)", fg: "var(--viridian-deep)" };
  if (tone === "warning") return { bg: "color-mix(in srgb, var(--mustard) 20%, transparent)", fg: "var(--mustard-deep)" };
  if (tone === "danger") return { bg: "color-mix(in srgb, var(--tomato) 16%, transparent)", fg: "var(--tomato-deep)" };
  return { bg: "var(--cream-deep)", fg: "var(--ink-soft)" };
}

/**
 * The mockup pairs every hoverable element with a `style` + `style-hover`.
 * Inline styles can't express `:hover` on their own, so these two primitives
 * track pointer-over state and merge `hoverStyle` on top — a direct
 * translation of that mockup convention into real React. `HoverButton` also
 * carries the shared `tap` press/lift feel and restores the dim-when-disabled
 * behavior the old shared `.btn[disabled]` rule used to give every button.
 */
type HoverButtonRestProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  // framer-motion's HTMLMotionProps redeclares these drag/animation handlers
  // with its own (incompatible) signatures — drop the plain-DOM versions.
  "style" | "disabled" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>;

function HoverButton({
  style,
  hoverStyle,
  disabled,
  ...rest
}: HoverButtonRestProps & {
  style: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const base = hovered && hoverStyle && !disabled ? { ...style, ...hoverStyle } : style;
  return (
    <motion.button
      {...tap}
      {...rest}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={disabled ? { ...base, opacity: 0.5, pointerEvents: "none" } : base}
    />
  );
}

function HoverDiv({
  style,
  hoverStyle,
  ...rest
}: Omit<React.ComponentPropsWithoutRef<"div">, "style"> & {
  style: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      {...rest}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={hovered && hoverStyle ? { ...style, ...hoverStyle } : style}
    />
  );
}

interface Props {
  project: Project;
  characters: Character[];
  locations: Location[];
  onSwitchWorkspace: (ws: WorkspaceId) => void;
  onReload: () => Promise<void> | void;
}

export function Casting({ project, characters, locations, onSwitchWorkspace, onReload }: Props) {
  const [adding, setAdding] = useState<"character" | "location" | null>(null);
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState<string | null>(null);

  const trained = characters.filter((c) => c.soul_id_state === "trained").length;
  const total = characters.length;
  const castTone = toneColors(trained >= total && total > 0 ? "success" : "warning");

  /** Wipe every character's generated looks (files stay on disk; frames
   *  already generated keep them). Characters revert to "not started". */
  async function clearAllLooks() {
    const withLooks = characters.filter((c) => (c.refs ?? []).length > 0);
    if (withLooks.length === 0) return;
    const totalImages = withLooks.reduce((n, c) => n + (c.refs?.length ?? 0), 0);
    if (
      !confirm(
        `Delete all cast images?\n\n${totalImages} look(s) across ${withLooks.length} character(s) will be removed. Frames already generated keep their picture, but new frames won't be reference-locked until you cast new looks.`
      )
    )
      return;
    setImportNote(`Clearing looks for ${withLooks.length} character(s)…`);
    for (const c of withLooks) {
      await fetch(`/api/characters/${c.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refs: [], soul_id_state: "empty" })
      }).catch(() => {});
    }
    await onReload();
    setImportNote(`Cleared ${totalImages} cast image(s).`);
    setTimeout(() => setImportNote(null), 6000);
  }

  /** Have the AI casting director read the script and add anyone missing.
   *  Never touches beats or existing characters — safe on any project. */
  async function importFromScript() {
    if (importing) return;
    setImporting(true);
    setImportNote(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/characters/import`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setImportNote(data.error ?? "Import failed");
        return;
      }
      await onReload();
      setImportNote(
        data.characters_added || data.locations_added
          ? `Imported ${data.characters_added} character(s) + ${data.locations_added} location(s)${
              data.added?.length ? ` — ${data.added.join(", ")}` : ""
            }`
          : "Everyone in the script is already cast."
      );
    } catch (e) {
      setImportNote(String(e));
    } finally {
      setImporting(false);
      setTimeout(() => setImportNote(null), 6000);
    }
  }

  return (
    <motion.div className="main-inner" {...pageIn}>
      <motion.header
        {...fadeUp}
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 28, padding: "32px 0" }}
      >
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
            03 / Workspace · Casting
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
            Casting
          </h1>
          <p style={{ margin: "12px 0 0", fontWeight: 500, fontSize: 16, lineHeight: 1.5, color: "var(--ink)", maxWidth: "56ch" }}>
            Train a <strong>Soul ID</strong> for every character and key location. Consistency across every frame
            starts here.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
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
              background: castTone.bg,
              color: castTone.fg
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", opacity: 0.6 }} />
            {trained} / {total || "—"} Soul IDs
          </span>
          <HoverButton
            onClick={importFromScript}
            disabled={importing || !project.script_submitted}
            title={
              project.script_submitted
                ? "AI reads the script and adds every character + location it finds (existing cast untouched)"
                : "Submit a script in Screenplay first"
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--ink)",
              background: "var(--surface)",
              border: "none",
              borderRadius: 999,
              boxShadow: "var(--shadow-1)",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
            hoverStyle={{ background: "color-mix(in srgb, var(--ink) 12%, transparent)" }}
          >
            {importing ? (
              <>
                <RefreshCcw size={12} className="fx-rotate-load" /> Reading script…
              </>
            ) : (
              <>
                <Sparkles size={12} /> Import from script
              </>
            )}
          </HoverButton>
          <HoverButton
            onClick={() => setAdding("character")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--ink)",
              background: "var(--surface)",
              border: "none",
              borderRadius: 999,
              boxShadow: "var(--shadow-1)",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
            hoverStyle={{ background: "color-mix(in srgb, var(--ink) 12%, transparent)" }}
          >
            <Plus size={12} /> Add character
          </HoverButton>
          <HoverButton
            disabled={total === 0}
            onClick={() => onSwitchWorkspace("storyboard")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--on-accent)",
              background: "var(--accent)",
              border: "none",
              borderRadius: 999,
              boxShadow: "var(--shadow-1)",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
            hoverStyle={{ background: "var(--accent-hover)" }}
          >
            Continue to Storyboard <ArrowRight size={14} />
          </HoverButton>
        </div>
      </motion.header>

      {importNote && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 18px",
            borderRadius: 14,
            background: "color-mix(in srgb, var(--accent) 10%, transparent)",
            color: "var(--ink)",
            fontSize: 13,
            lineHeight: 1.5
          }}
        >
          {importNote}
        </div>
      )}

      <div className="page-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500, letterSpacing: "0.02em", color: "var(--mute)" }}>
            Characters · {total} cast
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {characters.some((c) => (c.refs ?? []).length > 0) && (
              <HoverButton
                onClick={clearAllLooks}
                title="Delete every generated cast image (characters stay; frames already generated keep their picture)"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 15px",
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: "var(--font-ui)",
                  color: "var(--tomato)",
                  background: "transparent",
                  borderRadius: 999,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
                hoverStyle={{ background: "color-mix(in srgb, var(--tomato) 12%, transparent)" }}
              >
                <X size={12} /> Delete all cast images
              </HoverButton>
            )}
            <BatchGenerate
              label="Cast all"
              verb="portrait"
              items={characters.map((c) => ({ id: c.id, name: c.name, hasLook: (c.refs ?? []).length > 0 }))}
              endpoint={(cid) => `/api/characters/${cid}/portrait`}
              onProgress={(msg) => setImportNote(msg)}
              onDone={async (n) => {
                await onReload();
                setImportNote(n ? `Cast ${n} portrait(s) — they're now reference-locked for the storyboard.` : null);
                setTimeout(() => setImportNote(null), 6000);
              }}
            />
          </div>
        </div>

        {characters.length === 0 ? (
          <div style={{ background: "var(--surface)", borderRadius: 18, boxShadow: "var(--shadow-2)", border: "1.5px dashed var(--surface-2)", padding: 28 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500, letterSpacing: "0.02em", color: "var(--accent)" }}>
              Casting director
            </span>
            <p style={{ margin: "8px 0 0", color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5, maxWidth: "56ch" }}>
              No characters cast yet. Submit your script in Screenplay and the Casting Director will import them
              automatically — or add one manually now.
            </p>
            <HoverButton
              onClick={() => setAdding("character")}
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                fontWeight: 600,
                fontSize: 14,
                color: "var(--on-accent)",
                background: "var(--accent)",
                border: "none",
                borderRadius: 999,
                boxShadow: "var(--shadow-1)",
                cursor: "pointer"
              }}
              hoverStyle={{ background: "var(--accent-hover)" }}
            >
              <Plus size={12} /> Add character
            </HoverButton>
          </div>
        ) : (
          <motion.div
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {characters.map((c) => (
              <motion.div key={c.id} variants={staggerItem}>
                <CharacterCard character={c} projectId={project.id} onChange={onReload} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div style={{ margin: "40px 0 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500, letterSpacing: "0.02em", color: "var(--mute)" }}>
            Locations · {locations.length} identified
          </span>
          <BatchGenerate
            label="Scout all"
            verb="plate"
            items={locations.map((l) => ({ id: l.id, name: l.name, hasLook: (l.refs ?? []).length > 0 }))}
            endpoint={(lid) => `/api/locations/${lid}/plate`}
            onProgress={(msg) => setImportNote(msg)}
            onDone={async (n) => {
              await onReload();
              setImportNote(n ? `Scouted ${n} location plate(s).` : null);
              setTimeout(() => setImportNote(null), 6000);
            }}
          />
        </div>

        {locations.length === 0 ? (
          <div style={{ background: "var(--surface)", borderRadius: 18, boxShadow: "var(--shadow-2)", border: "1.5px dashed var(--surface-2)", padding: 28 }}>
            <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5, maxWidth: "56ch" }}>
              No locations cast yet. Submit your script and the crew will import the scene locations — or add one
              manually.
            </p>
            <HoverButton
              onClick={() => setAdding("location")}
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                fontWeight: 600,
                fontSize: 14,
                color: "var(--on-accent)",
                background: "var(--accent)",
                border: "none",
                borderRadius: 999,
                boxShadow: "var(--shadow-1)",
                cursor: "pointer"
              }}
              hoverStyle={{ background: "var(--accent-hover)" }}
            >
              <Plus size={12} /> Add location
            </HoverButton>
          </div>
        ) : (
          <motion.div
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {locations.map((l) => (
              <motion.div key={l.id} variants={staggerItem}>
                <LocationCard location={l} projectId={project.id} onChange={onReload} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {adding && (
        <AddModal
          kind={adding}
          projectId={project.id}
          onClose={() => setAdding(null)}
          onCreated={async () => {
            setAdding(null);
            await onReload();
          }}
        />
      )}
    </motion.div>
  );
}

function CharacterCard({
  character,
  projectId,
  onChange
}: {
  character: Character;
  projectId: string;
  onChange: () => Promise<void> | void;
}) {
  void projectId;
  const state = character.soul_id_state;
  const pct = Math.round(character.soul_id_progress * 100);
  const realRefs = character.refs ?? [];
  const hasReal = realRefs.length > 0;

  const [sel, setSel] = useState(0);
  const [casting, setCasting] = useState(false);
  const [editing, setEditing] = useState(false);

  // Looks: real reference photos if present, else stub plates derived from the
  // Soul ID state. Casting a look generates a real portrait on the server.
  const looks: Array<{ key: string; url?: string; seed?: number }> = hasReal
    ? realRefs.map((url, i) => ({ key: `r${i}`, url }))
    : (state === "trained" ? [0, 1, 2] : state === "training" ? [0] : []).map((s) => ({
        key: `s${s}`,
        seed: s
      }));
  const active = looks[Math.min(sel, Math.max(0, looks.length - 1))];

  async function castLook() {
    if (casting) return;
    setCasting(true);
    try {
      await fetch(`/api/characters/${character.id}/portrait`, { method: "POST" });
      await onChange();
    } finally {
      setCasting(false);
    }
  }

  const pipLabel =
    state === "trained"
      ? `Trained · ${character.consistency?.toFixed(1) ?? "—"} / 10`
      : state === "training"
      ? `Training · ${pct}%`
      : state === "failed"
      ? "Training failed"
      : "Not started";
  const pipTone = toneColors(
    state === "trained" ? "success" : state === "training" ? "warning" : state === "failed" ? "danger" : "neutral"
  );

  function plate(look: { url?: string; seed?: number } | undefined, fontSize: number) {
    if (look?.url) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={look.url} alt={character.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
    }
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: gradFor(character.name, look?.seed ?? 0)
        }}
      >
        <span style={{ fontFamily: "var(--font-display)", fontSize, color: "#FFFBF1" }}>
          {character.name.trim()[0] ?? "?"}
        </span>
      </div>
    );
  }

  const mainActionStyle: React.CSSProperties = {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 14px",
    fontWeight: 600,
    fontSize: 13,
    color: "var(--ink)",
    background: "var(--bg)",
    border: "none",
    borderRadius: 999,
    boxShadow: "var(--shadow-1)",
    cursor: "pointer"
  };
  const editStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    fontWeight: 600,
    fontSize: 13,
    color: "var(--ink)",
    backdropFilter: "blur(10px)",
    background: "color-mix(in srgb, var(--ink) 5%, transparent)",
    border: 0,
    boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--ink) 22%, transparent)",
    borderRadius: 999,
    cursor: "pointer"
  };
  const dimHover: React.CSSProperties = { background: "color-mix(in srgb, var(--ink) 12%, transparent)" };
  const editHover: React.CSSProperties = { background: "color-mix(in srgb, var(--ink) 14%, transparent)" };

  return (
    <HoverDiv
      style={{ background: "var(--surface)", borderRadius: 18, boxShadow: "var(--shadow-2)", overflow: "hidden", display: "flex", flexDirection: "column" }}
      hoverStyle={{ boxShadow: "var(--shadow-3)" }}
    >
      <div style={{ position: "relative", aspectRatio: "1 / 1", background: "var(--cream-deep)", overflow: "hidden" }}>
        {active ? (
          plate(active, 64)
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: "var(--mute)"
            }}
          >
            <Plus size={18} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em" }}>Add reference photos</span>
          </div>
        )}
        {state === "training" && <div className="cast-shimmer" style={{ background: "none" }} />}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 28, flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 19, letterSpacing: "-0.01em", color: "var(--ink)", lineHeight: 1.2 }}>
          {character.name}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em", color: "var(--mute)" }}>
          {character.role} · {character.scene_count} scenes{character.dialogue ? " · speaking" : ""}
        </div>
        <span
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 999,
            background: pipTone.bg,
            color: pipTone.fg
          }}
        >
          {pipLabel}
        </span>

        {(looks.length > 0 || state !== "empty") && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {looks.map((l, i) => (
              <HoverButton
                key={l.key}
                onClick={() => setSel(i)}
                aria-label={`Look ${i + 1}`}
                style={{
                  width: 40,
                  height: 40,
                  padding: 0,
                  border: i === sel ? "2px solid var(--accent)" : "2px solid transparent",
                  borderRadius: 12,
                  overflow: "hidden",
                  cursor: "pointer",
                  background: l.url ? "var(--cream-deep)" : gradFor(character.name, l.seed ?? 0),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                hoverStyle={i === sel ? undefined : { filter: "brightness(1.12)" }}
              >
                {plate(l, 18)}
              </HoverButton>
            ))}
            {state !== "empty" && (
              <HoverButton
                onClick={castLook}
                disabled={casting}
                aria-label="Cast a new look"
                title="Cast a new look"
                style={{
                  width: 40,
                  height: 40,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--mute)",
                  border: "2px dashed var(--surface-2)",
                  background: "transparent",
                  borderRadius: 12,
                  cursor: "pointer"
                }}
                hoverStyle={{ color: "var(--accent)", borderColor: "var(--accent)" }}
              >
                <Plus size={14} />
              </HoverButton>
            )}
          </div>
        )}

        {state === "trained" && character.consistency != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(character.consistency / 10) * 100}%`,
                  background: "var(--viridian)",
                  borderRadius: "inherit"
                }}
              />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--viridian-deep)" }}>
              {character.consistency.toFixed(1)}
            </span>
          </div>
        )}

        {state === "failed" && character.error && (
          <div
            style={{
              padding: 12,
              background: "rgba(232,74,53,0.06)",
              borderLeft: "2px solid var(--accent)",
              color: "var(--ink-soft)",
              fontSize: 13,
              lineHeight: 1.5
            }}
          >
            {character.error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          {state === "empty" && (
            <HoverButton
              onClick={castLook}
              disabled={casting}
              style={mainActionStyle}
              hoverStyle={dimHover}
              title="Generates one Seedream portrait · ≈14k tokens"
            >
              {casting ? "Casting…" : "Begin casting · ≈14k tok"}
            </HoverButton>
          )}
          {state === "training" && (
            <HoverButton disabled style={mainActionStyle}>
              In training… {pct}%
            </HoverButton>
          )}
          {state === "trained" && (
            <>
              <HoverButton
                onClick={castLook}
                disabled={casting}
                style={mainActionStyle}
                hoverStyle={dimHover}
                title="Generates one Seedream portrait · ≈14k tokens"
              >
                {casting ? "Casting…" : "New look · ≈14k tok"}
              </HoverButton>
              <HoverButton onClick={() => setEditing(true)} style={editStyle} hoverStyle={editHover}>
                Edit
              </HoverButton>
            </>
          )}
          {state !== "trained" && state !== "training" && (
            <HoverButton onClick={() => setEditing(true)} style={editStyle} hoverStyle={editHover}>
              Edit
            </HoverButton>
          )}
          {state === "failed" && (
            <HoverButton
              onClick={async () => {
                await fetch(`/api/characters/${character.id}`, {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ soul_id_state: "empty", error: null })
                });
                await onChange();
              }}
              style={mainActionStyle}
              hoverStyle={dimHover}
            >
              <RefreshCcw size={12} /> Retry
            </HoverButton>
          )}
        </div>
      </div>

      {editing && (
        <CharacterEditModal
          character={character}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await onChange();
          }}
        />
      )}
    </HoverDiv>
  );
}

/* Edit a character's identity: name, role, dialogue, physical brief — the
   fields the portrait prompt and reference lock are built from. */
function CharacterEditModal({
  character,
  onClose,
  onSaved
}: {
  character: Character;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [name, setName] = useState(character.name);
  const [role, setRole] = useState<Character["role"]>(character.role);
  const [dialogue, setDialogue] = useState(character.dialogue);
  const [brief, setBrief] = useState({
    age: character.brief?.age ?? "",
    build: character.brief?.build ?? "",
    features: character.brief?.features ?? "",
    wardrobe: character.brief?.wardrobe ?? "",
    personality: character.brief?.personality ?? ""
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    if (busy || !name.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), role, dialogue, brief })
      });
      await onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    if (!confirm(`Delete ${character.name}?\n\nTheir looks and reference lock go with them. Frames already generated stay as they are.`)) return;
    setBusy(true);
    try {
      await fetch(`/api/characters/${character.id}`, { method: "DELETE" });
      await onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function clearLooks() {
    if (busy) return;
    const n = character.refs?.length ?? 0;
    if (!confirm(`Delete ${character.name}'s ${n} cast image(s)?\n\nThe character stays; cast a new look to re-lock their identity.`)) return;
    setBusy(true);
    try {
      await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refs: [], soul_id_state: "empty" })
      });
      await onSaved();
    } finally {
      setBusy(false);
    }
  }

  const fieldLabel: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.02em",
    color: "var(--mute)"
  };
  const fieldInput: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "var(--bg)",
    color: "var(--ink)",
    border: 0,
    borderRadius: 12,
    fontFamily: "var(--font-ui)",
    fontSize: 14,
    outline: "none",
    boxShadow: "inset 0 0 0 1px var(--cream-deep)"
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,6,10,0.6)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 100
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, calc(100vw - 48px))",
          maxHeight: "min(640px, calc(100vh - 48px))",
          overflowY: "auto",
          background: "var(--surface)",
          backdropFilter: "blur(20px)",
          borderRadius: 24,
          boxShadow: "var(--shadow-3)",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.02em", color: "var(--accent)" }}>
            Edit character
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 999, background: "var(--surface-2)", color: "var(--ink)", cursor: "pointer" }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={fieldLabel}>Name</span>
          <input style={fieldInput} value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabel}>Role</span>
            <select style={{ ...fieldInput, cursor: "pointer" }} value={role} onChange={(e) => setRole(e.target.value as Character["role"])}>
              {(["Lead", "Supporting", "Featured", "Background"] as const).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabel}>Dialogue</span>
            <button
              onClick={() => setDialogue((d) => !d)}
              style={{ ...fieldInput, cursor: "pointer", textAlign: "left", color: dialogue ? "var(--viridian)" : "var(--mute)" }}
            >
              {dialogue ? "Speaking role" : "Non-speaking"}
            </button>
          </div>
        </div>

        {([
          ["age", "Age", "e.g. 20s"],
          ["build", "Build", "e.g. slight, wiry"],
          ["features", "Features", "e.g. bob haircut, freckles"],
          ["wardrobe", "Wardrobe", "e.g. grey tee, denim jacket"],
          ["personality", "Personality", "one line"]
        ] as const).map(([key, label, ph]) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabel}>{label}</span>
            <input
              style={fieldInput}
              placeholder={ph}
              value={brief[key]}
              onChange={(e) => setBrief((b) => ({ ...b, [key]: e.target.value }))}
            />
          </div>
        ))}

        <span style={{ fontSize: 11, color: "var(--mute)", lineHeight: 1.5 }}>
          These fields shape the portrait prompt. After a big change, cast a New look so the reference matches.
        </span>

        <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
          <button
            onClick={save}
            disabled={busy || !name.trim()}
            style={{
              flex: 1,
              minWidth: 150,
              padding: "11px 20px",
              fontWeight: 600,
              fontSize: 14,
              fontFamily: "var(--font-ui)",
              color: "var(--on-accent)",
              background: "var(--accent)",
              borderRadius: 999,
              cursor: "pointer",
              opacity: busy || !name.trim() ? 0.6 : 1
            }}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
          {(character.refs?.length ?? 0) > 0 && (
            <button
              onClick={clearLooks}
              disabled={busy}
              title="Delete this character's generated images (the character stays)"
              style={{
                padding: "11px 18px",
                fontWeight: 600,
                fontSize: 14,
                fontFamily: "var(--font-ui)",
                color: "var(--tomato)",
                background: "transparent",
                boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--tomato) 45%, transparent)",
                borderRadius: 999,
                cursor: "pointer"
              }}
            >
              Clear looks ({character.refs?.length ?? 0})
            </button>
          )}
          <button
            onClick={remove}
            disabled={busy}
            title="Delete this character"
            style={{
              padding: "11px 18px",
              fontWeight: 600,
              fontSize: 14,
              fontFamily: "var(--font-ui)",
              color: "var(--tomato)",
              background: "color-mix(in srgb, var(--tomato) 12%, transparent)",
              borderRadius: 999,
              cursor: "pointer"
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function LocationCard({
  location,
  projectId,
  onChange
}: {
  location: Location;
  projectId: string;
  onChange: () => Promise<void> | void;
}) {
  void projectId;
  const [scouting, setScouting] = useState(false);

  async function scoutPlate() {
    if (scouting) return;
    setScouting(true);
    try {
      await fetch(`/api/locations/${location.id}/plate`, { method: "POST" });
      await onChange();
    } finally {
      setScouting(false);
    }
  }

  const ref = location.refs[0];
  const tone = toneColors(
    location.soul_id_state === "trained"
      ? "success"
      : location.soul_id_state === "training"
      ? "warning"
      : location.soul_id_state === "failed"
      ? "danger"
      : "neutral"
  );
  const stateLabel =
    location.soul_id_state === "trained"
      ? "Trained"
      : location.soul_id_state === "training"
      ? "Training"
      : location.soul_id_state === "failed"
      ? "Training failed"
      : "Not started";

  return (
    <HoverDiv
      style={{ background: "var(--surface)", borderRadius: 18, boxShadow: "var(--shadow-2)", display: "flex", flexDirection: "column", overflow: "hidden" }}
      hoverStyle={{ boxShadow: "var(--shadow-3)" }}
    >
      <div
        className={location.soul_id_state === "training" ? "shimmer" : undefined}
        style={{ position: "relative", aspectRatio: "16 / 9", background: "var(--cream-deep)", overflow: "hidden" }}
      >
        {ref && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ref} alt={location.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.005em", color: "var(--ink)", lineHeight: 1.25 }}>
          {location.name}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em", color: "var(--mute)" }}>
          {location.int_ext} · {location.scene_count} scenes
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
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
              background: tone.bg,
              color: tone.fg
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", opacity: 0.6 }} />
            {stateLabel}
          </span>
          <HoverButton
            onClick={scoutPlate}
            disabled={scouting}
            title="Generate an establishing plate for this location · ≈14k tokens"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 13px",
              fontWeight: 600,
              fontSize: 12,
              fontFamily: "var(--font-ui)",
              color: "var(--ink)",
              background: "var(--surface-2)",
              borderRadius: 999,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
            hoverStyle={{ background: "color-mix(in srgb, var(--ink) 12%, transparent)" }}
          >
            {scouting ? (
              <>
                <RefreshCcw size={11} className="fx-rotate-load" /> Scouting…
              </>
            ) : ref ? (
              "New plate · ≈14k tok"
            ) : (
              "Scout plate · ≈14k tok"
            )}
          </HoverButton>
        </div>
      </div>
    </HoverDiv>
  );
}

/* Batch generation with selection + cost preview: pick which items to roll,
   see the total token price live, then run sequentially with progress. */
function BatchGenerate({
  label,
  verb,
  items,
  endpoint,
  onProgress,
  onDone
}: {
  label: string;
  verb: string;
  items: Array<{ id: string; name: string; hasLook: boolean }>;
  endpoint: (id: string) => string;
  onProgress: (msg: string) => void;
  onDone: (generated: number) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  // Stop signal — halts before the NEXT item (the one in flight completes).
  const stopRef = useRef(false);

  const missing = items.filter((i) => !i.hasLook);
  // Default selection: everything without a look yet.
  useEffect(() => {
    if (!open) return;
    setPicked(new Set(missing.map((i) => i.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (items.length === 0) return null;

  const costK = Math.round((picked.size * 14_400) / 1000);

  async function run() {
    if (running || picked.size === 0) return;
    setOpen(false);
    setRunning(true);
    stopRef.current = false;
    const ids = items.filter((i) => picked.has(i.id));
    let done = 0;
    try {
      for (const item of ids) {
        if (stopRef.current) {
          onProgress(`Stopped — ${done} of ${ids.length} generated.`);
          return;
        }
        onProgress(`Generating ${verb} for ${item.name} — ${done + 1} / ${ids.length}…`);
        const res = await fetch(endpoint(item.id), { method: "POST" });
        if (res.ok) done++;
      }
    } finally {
      setRunning(false);
      stopRef.current = false;
      await onDone(done);
    }
  }

  if (running) {
    return (
      <button
        onClick={() => {
          stopRef.current = true;
          onProgress("Stopping after the current one…");
        }}
        title={`Stop after the ${verb} currently generating (its cost is already committed)`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 15px",
          fontWeight: 600,
          fontSize: 13,
          fontFamily: "var(--font-ui)",
          color: "var(--tomato)",
          background: "color-mix(in srgb, var(--tomato) 12%, transparent)",
          borderRadius: 999,
          cursor: "pointer",
          whiteSpace: "nowrap"
        }}
      >
        <X size={12} /> Stop
      </button>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          title={`Generate ${verb}s in batch — pick who's included and see the cost first`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 15px",
            fontWeight: 600,
            fontSize: 13,
            fontFamily: "var(--font-ui)",
            color: "var(--ink)",
            background: "var(--surface)",
            borderRadius: 999,
            boxShadow: "var(--shadow-1)",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          <Sparkles size={12} /> {label}
          {missing.length > 0 && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--mute)" }}>
              {missing.length} missing
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          style={{
            width: 300,
            background: "var(--surface)",
            backdropFilter: "blur(20px)",
            borderRadius: 18,
            boxShadow: "var(--shadow-3)",
            padding: 14,
            zIndex: 90,
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.02em", color: "var(--mute)" }}>
            {label} · pick who to generate
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 260, overflowY: "auto" }}>
            {items.map((i) => {
              const on = picked.has(i.id);
              return (
                <button
                  key={i.id}
                  onClick={() =>
                    setPicked((prev) => {
                      const next = new Set(prev);
                      if (next.has(i.id)) next.delete(i.id);
                      else next.add(i.id);
                      return next;
                    })
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "transparent",
                    color: "var(--ink)",
                    cursor: "pointer",
                    fontFamily: "var(--font-ui)",
                    fontSize: 13,
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--ink) 8%, transparent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 5,
                      background: on ? "var(--accent)" : "var(--surface-2)",
                      color: "var(--on-accent)",
                      flexShrink: 0
                    }}
                  >
                    {on && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {i.name}
                  </span>
                  {i.hasLook && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--viridian)", flexShrink: 0 }}>
                      has look
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={run}
            disabled={picked.size === 0}
            style={{
              width: "100%",
              padding: "10px 16px",
              fontWeight: 600,
              fontSize: 13,
              fontFamily: "var(--font-ui)",
              color: "var(--on-accent)",
              background: "var(--accent)",
              borderRadius: 999,
              cursor: "pointer",
              opacity: picked.size === 0 ? 0.5 : 1
            }}
          >
            Generate {picked.size} · ≈{costK}k tok
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function AddModal({
  kind,
  projectId,
  onClose,
  onCreated
}: {
  kind: "character" | "location";
  projectId: string;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [intExt, setIntExt] = useState<"INT" | "EXT">("INT");
  const [role, setRole] = useState<Character["role"]>("Supporting");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      if (kind === "character") {
        await fetch(`/api/projects/${projectId}/characters`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: name.trim().toUpperCase(), role })
        });
      } else {
        await fetch(`/api/projects/${projectId}/locations`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: name.trim().toUpperCase(), int_ext: intExt })
        });
      }
      await onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="crumb">CASTING</div>
            <h2>Add {kind}</h2>
          </div>
          <button type="button" className="btn-ghost btn btn-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </header>
        <div className="modal-body">
          <div>
            <label>Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === "character" ? "MARCUS" : "INT. WAREHOUSE"}
              required
            />
          </div>
          {kind === "character" && (
            <div>
              <label>Role</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["Lead", "Supporting", "Featured", "Background"] as Character["role"][]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`btn btn-sm chip-select${role === r ? " is-active" : ""}`}
                    aria-pressed={role === r}
                    onClick={() => setRole(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          {kind === "location" && (
            <div>
              <label>Type</label>
              <div style={{ display: "flex", gap: 6 }}>
                {(["INT", "EXT"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`btn btn-sm chip-select${intExt === t ? " is-active" : ""}`}
                    aria-pressed={intExt === t}
                    onClick={() => setIntExt(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <footer>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim() || busy}>
            {busy ? "Adding…" : "Add"}
          </button>
        </footer>
      </form>
    </div>
  );
}
