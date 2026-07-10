"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowDown, BookOpen, ListChecks, X } from "./icons";
import { pageIn, staggerContainer, staggerItem } from "./motion";
import type {
  Beat,
  Bible,
  Character,
  Location,
  Project
} from "../../lib/types";

type SectionId =
  | "title"
  | "logline"
  | "synopsis"
  | "tone"
  | "world"
  | "characters"
  | "visual"
  | "scenes"
  | "production"
  | "attachments";

interface SectionMeta {
  id: SectionId;
  n: string;
  label: string;
  hint: string;
}

/* The document's own corner radius — a touch softer than the app-chrome
   default (`--r-md`, 16px), consistent across every card in this reader. */
const RADIUS = 18;

const SECTIONS: SectionMeta[] = [
  { id: "title", n: "01", label: "Title page", hint: "Project meta" },
  { id: "logline", n: "02", label: "Logline", hint: "One sentence" },
  { id: "synopsis", n: "03", label: "Synopsis", hint: "Short + full" },
  { id: "tone", n: "04", label: "Tone & themes", hint: "Register · refs" },
  { id: "world", n: "05", label: "World", hint: "Place · rules · air" },
  { id: "characters", n: "06", label: "Characters", hint: "One spread each" },
  { id: "visual", n: "07", label: "Visual language", hint: "Lens · light · cut" },
  { id: "scenes", n: "08", label: "Scene breakdown", hint: "Every beat" },
  { id: "production", n: "09", label: "Production notes", hint: "Budget · cast" },
  { id: "attachments", n: "10", label: "Attachments", hint: "Linked files" }
];

interface Props {
  project: Project;
  bible: Bible;
  beats: Beat[];
  characters: Character[];
  locations: Location[];
  onClose: () => void;
}

export function MovieBibleModal({ project, bible, beats, characters, locations, onClose }: Props) {
  const [active, setActive] = useState<SectionId>("title");
  const [closeHover, setCloseHover] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 1200,
          width: "calc(100% - var(--sp-6))",
          height: "calc(100vh - var(--sp-6))",
          padding: 0,
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gridTemplateRows: "auto 1fr auto",
          gridTemplateAreas: '"head head" "side body" "side foot"',
          overflow: "hidden"
        }}
      >
        <header
          style={{
            gridArea: "head",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--sp-4)",
            padding: "var(--sp-4) var(--sp-5)",
            borderBottom: "1px solid var(--cream-deep)",
            background: "var(--surface)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <BookOpen size={20} style={{ color: "var(--accent)" }} />
            <div>
              <Meta>Movie Bible · {project.draft_version}</Meta>
              <h2 className="t-h2" style={{ marginTop: 2 }}>{project.title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: 6,
              color: "var(--ink)",
              backdropFilter: "blur(10px)",
              background: `color-mix(in srgb, var(--ink) ${closeHover ? 14 : 5}%, transparent)`,
              border: 0,
              boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--ink) 22%, transparent)",
              borderRadius: 999,
              cursor: "pointer"
            }}
          >
            <X size={14} />
          </button>
        </header>

        <aside
          style={{
            gridArea: "side",
            borderRight: "1px solid var(--cream-deep)",
            background: "var(--bg)",
            padding: "var(--sp-4) var(--sp-3)",
            overflow: "auto"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {SECTIONS.map((s) => {
              const isActive = s.id === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  className="sidebar-item"
                  data-active={isActive}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 0,
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: RADIUS
                  }}
                >
                  <Meta style={navSubStyle(isActive)}>
                    {s.n} / {String(SECTIONS.length).padStart(2, "0")}
                  </Meta>
                  <span style={{ fontWeight: 500, fontSize: 13, marginTop: 2 }}>{s.label}</span>
                  <span style={{ fontSize: 11, ...navSubStyle(isActive) }}>{s.hint}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <main
          style={{
            gridArea: "body",
            overflow: "auto",
            padding: "var(--sp-6)",
            background: "var(--surface)"
          }}
        >
          <motion.div key={active} {...pageIn}>
            {active === "title" && <TitleSection project={project} />}
            {active === "logline" && <LoglineSection project={project} />}
            {active === "synopsis" && <SynopsisSection project={project} />}
            {active === "tone" && <ToneSection bible={bible} />}
            {active === "world" && <WorldSection bible={bible} locations={locations} />}
            {active === "characters" && <CharactersSection characters={characters} />}
            {active === "visual" && <VisualSection bible={bible} />}
            {active === "scenes" && <SceneSection beats={beats} />}
            {active === "production" && <ProductionSection project={project} bible={bible} />}
            {active === "attachments" && <AttachmentsSection project={project} />}
          </motion.div>
        </main>

        <footer
          style={{
            gridArea: "foot",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--sp-3)",
            padding: "var(--sp-3) var(--sp-5)",
            borderTop: "1px solid var(--cream-deep)",
            background: "var(--bg)"
          }}
        >
          <span className="t-mute" style={{ fontSize: "var(--t-body-s)" }}>
            Generated from the script · last updated {new Date(bible.updated_at + "Z").toLocaleString()}
          </span>
          <div style={{ display: "flex", gap: "var(--sp-2)" }}>
            <button className="btn btn-sm btn-ghost" onClick={onClose}>
              Close
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => navigator.clipboard?.writeText(JSON.stringify({ project, bible, beats, characters, locations }, null, 2))}
              title="Copy raw bible JSON"
            >
              Copy JSON
            </button>
            <button className="btn btn-sm btn-primary" disabled title="PDF export comes with Storybook">
              <ArrowDown size={12} /> Export PDF
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ───────────────────────── Shared building blocks ───────────────────────── */

/** The document's small mono meta label — used for every field/section caption. */
function Meta({ children, color, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.02em",
        color: color ?? "var(--mute)",
        ...style
      }}
    >
      {children}
    </span>
  );
}

/** A flat recessed panel — the document's base surface, one step darker than
    the reader background it sits on (no shadow, no hover-lift). */
function Panel({ children, padding = 16, style }: { children: ReactNode; padding?: number | string; style?: CSSProperties }) {
  return (
    <div style={{ background: "var(--bg)", borderRadius: RADIUS, padding, ...style }}>
      {children}
    </div>
  );
}

/** Colour treatment for a nav item's secondary text lines — full mute when
    resting, a dimmed on-ink tone once the pill inverts to active. */
function navSubStyle(active: boolean): CSSProperties {
  return active ? { color: "var(--on-ink)", opacity: 0.7 } : { color: "var(--mute)" };
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <header style={{ marginBottom: 28, paddingBottom: 16, borderBottom: "1px solid var(--cream-deep)" }}>
      <Meta>{eyebrow}</Meta>
      <h2 className="t-h1" style={{ marginTop: 8 }}>{title}</h2>
      <p style={{ marginTop: 8, color: "var(--mute)", fontSize: "var(--t-body)" }}>{sub}</p>
    </header>
  );
}

function MetaGrid({ items, cols = 2 }: { items: Array<{ label: string; value: string }>; cols?: number }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}
    >
      {items.map((item) => (
        <motion.div key={item.label} variants={staggerItem}>
          <Panel>
            <Meta>{item.label}</Meta>
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
              {item.value || <span style={{ color: "var(--mute)" }}>—</span>}
            </div>
          </Panel>
        </motion.div>
      ))}
    </motion.div>
  );
}

function TaglineCard({ tagline }: { tagline: string }) {
  return (
    <Panel padding={28} style={{ marginTop: 16 }}>
      <Meta>Tagline</Meta>
      <p style={{ marginTop: 8, fontWeight: 600, fontSize: 18, color: "var(--ink)" }}>
        {tagline || <span style={{ color: "var(--mute)" }}>No tagline yet.</span>}
      </p>
    </Panel>
  );
}

function Field({ title, body }: { title: string; body: string }) {
  return (
    <Panel>
      <Meta>{title}</Meta>
      <p style={{ marginTop: 8, lineHeight: 1.6, fontSize: 13, color: "var(--ink)" }}>
        {body || <span style={{ color: "var(--mute)" }}>—</span>}
      </p>
    </Panel>
  );
}

function ArcStep({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <Meta color="var(--accent)">{label}</Meta>
      <p style={{ marginTop: 8, lineHeight: 1.6, fontSize: 13, color: "var(--ink)" }}>
        {body || <span style={{ color: "var(--mute)" }}>—</span>}
      </p>
    </div>
  );
}

/* ───────────────────────── Section renderers ───────────────────────── */

function TitleSection({ project }: { project: Project }) {
  return (
    <div>
      <SectionHead
        eyebrow="01 / Title page"
        title="Title page"
        sub="The project's identity card — every downstream document points back here."
      />
      <MetaGrid
        items={[
          { label: "Project title", value: project.title },
          { label: "Format", value: project.format },
          { label: "Genre", value: project.genre },
          { label: "Length estimate", value: project.length_estimate },
          { label: "Director", value: project.director_name },
          { label: "Draft", value: project.draft_version },
          { label: "Aspect ratio", value: project.aspect_ratio },
          { label: "Time period", value: project.time_period }
        ]}
      />
      <TaglineCard tagline={project.tagline} />
    </div>
  );
}

function LoglineSection({ project }: { project: Project }) {
  return (
    <div>
      <SectionHead
        eyebrow="02 / Logline"
        title="Logline"
        sub="One sentence — protagonist + conflict + stakes. Everything else is downstream."
      />
      <Panel padding="64px 48px" style={{ textAlign: "center" }}>
        <p
          style={{
            margin: "0 auto",
            fontWeight: 600,
            fontSize: "clamp(21px, 2.2vw, 27px)",
            lineHeight: 1.25,
            letterSpacing: "-0.015em",
            color: "var(--ink)",
            maxWidth: "32ch"
          }}
        >
          {project.logline || project.premise || "No logline yet."}
        </p>
      </Panel>
      <TaglineCard tagline={project.tagline} />
    </div>
  );
}

function SynopsisSection({ project }: { project: Project }) {
  return (
    <div>
      <SectionHead
        eyebrow="03 / Synopsis"
        title="Synopsis"
        sub="Short for pitch decks. Full for crew + investors. Present tense, no dialogue."
      />
      <Meta>Short — one paragraph</Meta>
      <p style={{ marginTop: 8, marginBottom: 28, fontWeight: 500, fontSize: 16, lineHeight: 1.6, color: "var(--ink)" }}>
        {project.short_synopsis || project.logline || project.premise}
      </p>
      <Meta>Full — act by act</Meta>
      <Panel padding={28} style={{ marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.7, color: "var(--ink)" }}>
        {project.full_synopsis || <span style={{ color: "var(--mute)" }}>Bible Builder will fill this in on the next pass.</span>}
      </Panel>
    </div>
  );
}

function ToneSection({ bible }: { bible: Bible }) {
  return (
    <div>
      <SectionHead
        eyebrow="04 / Tone & themes"
        title="Tone & themes"
        sub="Emotional register, the ideas the film is really about, the films it shares a shelf with."
      />

      <section style={{ marginBottom: 28 }}>
        <Meta>Tone</Meta>
        <Panel style={{ marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.7, color: "var(--ink)" }}>
          {bible.tone_doc || <span style={{ color: "var(--mute)" }}>—</span>}
        </Panel>
      </section>

      {bible.themes.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <Meta>Core themes</Meta>
          <div className="tag-strip" style={{ marginTop: 12 }}>
            {bible.themes.map((t) => (
              <span key={t} className="tag tag-2">{t}</span>
            ))}
          </div>
        </section>
      )}

      {bible.comparable_films.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <Meta>Comparable films</Meta>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 12 }}
          >
            {bible.comparable_films.map((f) => (
              <motion.div key={f.title} variants={staggerItem}>
                <Panel>
                  <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.005em", color: "var(--ink)" }}>{f.title}</div>
                  <p style={{ marginTop: 8, color: "var(--mute)", fontSize: 13, lineHeight: 1.5 }}>{f.note}</p>
                </Panel>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {bible.what_makes_different && (
        <section>
          <Meta>What makes this different</Meta>
          <p style={{ marginTop: 12, fontWeight: 500, fontSize: 16, lineHeight: 1.6, color: "var(--ink)" }}>
            {bible.what_makes_different}
          </p>
        </section>
      )}
    </div>
  );
}

function WorldSection({ bible, locations }: { bible: Bible; locations: Location[] }) {
  return (
    <div>
      <SectionHead
        eyebrow="05 / World"
        title="World"
        sub="Time, place, rules. The texture of the air around the story."
      />

      <section>
        <Meta>Atmosphere</Meta>
        <p style={{ marginTop: 8, marginBottom: 28, lineHeight: 1.7, color: "var(--ink)" }}>{bible.atmosphere || "—"}</p>
      </section>

      <section>
        <Meta>World rules</Meta>
        <p style={{ marginTop: 8, marginBottom: 28, lineHeight: 1.7, color: "var(--ink)" }}>{bible.world_rules || "—"}</p>
      </section>

      {locations.length > 0 && (
        <section>
          <Meta>Locations · {locations.length}</Meta>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}
          >
            {locations.map((loc) => (
              <motion.div key={loc.id} variants={staggerItem}>
                <Panel padding={0} style={{ overflow: "hidden" }}>
                  {loc.refs[0] && (
                    <div style={{ aspectRatio: "16/9", overflow: "hidden", background: "var(--cream-deep)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={loc.refs[0]} alt={loc.name} className="portrait-img" />
                    </div>
                  )}
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.005em", color: "var(--ink)" }}>{loc.name}</div>
                    <Meta style={{ display: "block", marginTop: 4 }}>
                      {loc.int_ext} · {loc.scene_count} scenes
                    </Meta>
                  </div>
                </Panel>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}
    </div>
  );
}

function CharactersSection({ characters }: { characters: Character[] }) {
  const [active, setActive] = useState<string>(characters[0]?.id ?? "");
  const current = useMemo(() => characters.find((c) => c.id === active), [characters, active]);

  if (characters.length === 0) {
    return (
      <div>
        <SectionHead
          eyebrow="06 / Characters"
          title="Characters"
          sub="One spread per character — psychology, arc, voice, wardrobe, relationships."
        />
        <p style={{ color: "var(--mute)" }}>No characters yet. Import from script or add manually in Casting.</p>
      </div>
    );
  }

  return (
    <div>
      <SectionHead
        eyebrow="06 / Characters"
        title="Characters"
        sub="One spread per character — psychology, arc, voice, wardrobe, relationships."
      />

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 28 }}>
        <aside style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {characters.map((c) => {
            const isActive = c.id === active;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                className="sidebar-item"
                data-active={isActive}
                style={{ display: "block", textAlign: "left", padding: "8px 12px", borderRadius: RADIUS }}
              >
                <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                <Meta style={navSubStyle(isActive)}>{c.role}</Meta>
              </button>
            );
          })}
        </aside>

        <article>
          {current && <CharacterSpread character={current} />}
        </article>
      </div>
    </div>
  );
}

function CharacterSpread({ character: c }: { character: Character }) {
  const ref = c.refs[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <Panel padding={0} style={{ overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1.5fr" }}>
        <div style={{ background: "var(--cream-deep)", aspectRatio: "1/1", overflow: "hidden" }}>
          {ref && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ref} alt={c.name} className="portrait-img" />
          )}
        </div>
        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 12 }}>
          <Meta>{c.role}</Meta>
          <h3 style={{ margin: 0, fontSize: "clamp(22px, 2.4vw, 30px)", letterSpacing: "-0.015em", lineHeight: 1.15, color: "var(--ink)", fontWeight: 600 }}>
            {c.name}
          </h3>
          {c.brief && (c.brief.age || c.brief.features || c.brief.build) && (
            <p style={{ margin: 0, color: "var(--mute)", lineHeight: 1.6, fontSize: 14 }}>
              {[c.brief.age, c.brief.build, c.brief.features].filter(Boolean).join(" · ")}
            </p>
          )}
          {c.key_quote && (
            <blockquote
              style={{
                margin: 0,
                padding: "12px 16px",
                borderLeft: "3px solid var(--accent)",
                fontStyle: "italic",
                fontSize: 16,
                color: "var(--ink)",
                lineHeight: 1.4
              }}
            >
              &ldquo;{c.key_quote}&rdquo;
            </blockquote>
          )}
        </div>
      </Panel>

      {c.background && <Field title="Background" body={c.background} />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <Field title="Want" body={c.psychology_want} />
        <Field title="Fear" body={c.psychology_fear} />
        <Field title="Wound" body={c.psychology_wound} />
      </div>

      <Panel>
        <Meta>Arc</Meta>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
          <ArcStep label="Start" body={c.arc_start} />
          <ArcStep label="Break open" body={c.arc_middle} />
          <ArcStep label="End" body={c.arc_end} />
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field title="Voice" body={c.voice} />
        <Field title="Wardrobe direction" body={c.wardrobe_direction} />
      </div>

      {c.relationships.length > 0 && (
        <Panel>
          <Meta>Relationships</Meta>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {c.relationships.map((r) => (
              <div
                key={r.with + r.type}
                style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "baseline" }}
              >
                <span className="tag" style={{ justifySelf: "start" }}>{r.with}</span>
                <span style={{ color: "var(--ink-soft)", fontSize: 14 }}>{r.type}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function VisualSection({ bible }: { bible: Bible }) {
  return (
    <div>
      <SectionHead
        eyebrow="07 / Visual language"
        title="Visual language"
        sub="How this looks. Palette, lens, light, cut, recurring motifs."
      />

      {bible.visual_palette.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <Meta>Palette</Meta>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(bible.visual_palette.length, 6)}, 1fr)`,
              gap: 12,
              marginTop: 12
            }}
          >
            {bible.visual_palette.map((sw) => (
              <motion.div key={sw.hex} variants={staggerItem}>
                <Panel padding={0} style={{ overflow: "hidden" }}>
                  <div style={{ aspectRatio: "1/1", background: sw.hex }} />
                  <div style={{ padding: 12 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--mute)" }}>{sw.hex}</div>
                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: 1.35 }}>{sw.name}</div>
                  </div>
                </Panel>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field title="Cinematography" body={bible.cinematography_notes} />
        <Field title="Lighting philosophy" body={bible.lighting_philosophy} />
      </div>

      <div style={{ marginTop: 12 }}>
        <Field title="Editorial rhythm" body={bible.editorial_rhythm} />
      </div>

      {bible.visual_motifs.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <Meta>Recurring motifs</Meta>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {bible.visual_motifs.map((m) => (
              <div key={m} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>—</span>
                <span style={{ lineHeight: 1.6, color: "var(--ink)", fontSize: 14 }}>{m}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SceneSection({ beats }: { beats: Beat[] }) {
  const cols = "48px 1.4fr 1.4fr 1.4fr 1fr 100px";
  return (
    <div>
      <SectionHead
        eyebrow={`08 / Scene breakdown · ${beats.length} beats`}
        title="Scene breakdown"
        sub="The crew's read-only map of every beat — heading, cast, mood, flags."
      />
      <Panel padding={0} style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: cols, padding: "12px 16px", borderBottom: "1px solid var(--cream-deep)" }}>
          {["#", "Scene", "Title", "Cast", "Mood", "Flag"].map((h) => (
            <Meta key={h}>{h}</Meta>
          ))}
        </div>
        {beats.map((b) => (
          <div
            key={b.id}
            style={{
              display: "grid",
              gridTemplateColumns: cols,
              padding: "12px 16px",
              borderBottom: "1px solid var(--cream-deep)",
              alignItems: "center",
              gap: 8
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>
              {String(b.n).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)" }}>{b.scene_heading || "—"}</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{b.title || "Untitled beat"}</span>
            <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {b.characters.map((name) => (
                <span
                  key={name}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    fontWeight: 500,
                    fontSize: 10,
                    borderRadius: 999,
                    background: "var(--surface)",
                    color: "var(--ink)",
                    boxShadow: "var(--shadow-1)"
                  }}
                >
                  {name}
                </span>
              ))}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--mute)" }}>
              {b.mood.join(" · ") || "—"}
            </span>
            <span>
              {b.flag ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "3px 8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    letterSpacing: "0.02em",
                    borderRadius: 999,
                    background: "rgba(232,74,53,0.16)",
                    color: "var(--tomato-deep)"
                  }}
                >
                  {b.flag.toUpperCase()}
                </span>
              ) : (
                <span style={{ color: "var(--mute)" }}>—</span>
              )}
            </span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function ProductionSection({ project, bible }: { project: Project; bible: Bible }) {
  return (
    <div>
      <SectionHead
        eyebrow="09 / Production notes"
        title="Production notes"
        sub="Budget tier, challenges, VFX, casting direction. Line producer view."
      />
      <MetaGrid
        cols={3}
        items={[
          { label: "Budget tier", value: project.budget_tier.toUpperCase() },
          { label: "Format", value: project.format },
          { label: "Length", value: project.length_estimate }
        ]}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        <Field title="Production challenges" body={bible.production_challenges} />
        <Field title="VFX requirements" body={bible.vfx_requirements} />
        <Field title="Casting direction" body={bible.casting_direction} />
      </div>
    </div>
  );
}

function AttachmentsSection({ project }: { project: Project }) {
  const items = [
    { label: "Full screenplay", note: `${project.script.split(/\s+/).length.toLocaleString()} words`, target: "screenplay" },
    { label: "Beat sheet", note: "From the breakdown panel", target: "screenplay" },
    { label: "Shot list", note: "Generated per beat", target: "storyboard" },
    { label: "Storyboard", note: "Selected frames + variants", target: "storyboard" },
    { label: "Casting breakdown", note: "Soul IDs + briefs", target: "casting" },
    { label: "The Storybook", note: "Coming — pinned for later", target: "storybook" }
  ];
  return (
    <div>
      <SectionHead
        eyebrow="10 / Attachments"
        title="Attachments"
        sub="Everything else the Bible references — linked, not embedded."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => (
          <Panel key={item.label} style={{ display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 12, alignItems: "center" }}>
            <ListChecks size={16} style={{ color: "var(--accent)" }} />
            <div>
              <div style={{ fontWeight: 600, color: "var(--ink)" }}>{item.label}</div>
              <Meta style={{ display: "block", marginTop: 2 }}>{item.note}</Meta>
            </div>
            {item.target === "storybook" ? (
              <span className="pip-state" data-status="draft">PINNED</span>
            ) : (
              <span className="pip-state" data-status="done">LINKED</span>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}
