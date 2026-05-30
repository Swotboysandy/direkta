"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  BookOpen,
  Camera,
  ClipboardCheck,
  Film,
  FileText,
  Globe,
  Link as LinkIcon,
  ListChecks,
  Palette,
  Users,
  Wand2,
  X,
  type LucideIcon
} from "lucide-react";
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
  icon: LucideIcon;
  hint: string;
}

const SECTIONS: SectionMeta[] = [
  { id: "title", n: "01", label: "Title Page", icon: BookOpen, hint: "Project meta" },
  { id: "logline", n: "02", label: "Logline", icon: Wand2, hint: "One sentence" },
  { id: "synopsis", n: "03", label: "Synopsis", icon: FileText, hint: "Short + full" },
  { id: "tone", n: "04", label: "Tone & Themes", icon: Palette, hint: "Register · refs" },
  { id: "world", n: "05", label: "World", icon: Globe, hint: "Place · rules · air" },
  { id: "characters", n: "06", label: "Characters", icon: Users, hint: "One spread each" },
  { id: "visual", n: "07", label: "Visual Language", icon: Camera, hint: "Lens · light · cut" },
  { id: "scenes", n: "08", label: "Scene Breakdown", icon: Film, hint: "Every beat" },
  { id: "production", n: "09", label: "Production Notes", icon: ClipboardCheck, hint: "Budget · cast" },
  { id: "attachments", n: "10", label: "Attachments", icon: LinkIcon, hint: "Linked files" }
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
              <span className="t-eyebrow">MOVIE BIBLE · {project.draft_version}</span>
              <h2 className="t-h2" style={{ marginTop: 2 }}>{project.title}</h2>
            </div>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Close">
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
              const Icn = s.icon;
              const isActive = s.id === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  className="sidebar-item"
                  data-active={isActive}
                  style={{
                    gridTemplateColumns: "22px 1fr",
                    textAlign: "left",
                    padding: "10px 12px"
                  }}
                >
                  <span className="si-icon">
                    <Icn size={16} />
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--t-eyebrow)",
                        letterSpacing: "var(--tracking-eyebrow)",
                        textTransform: "uppercase",
                        color: isActive ? "rgba(245,237,220,0.7)" : "var(--mute)"
                      }}
                    >
                      {s.n} / 10
                    </span>
                    <span style={{ fontWeight: 500, fontSize: "var(--t-body-s)" }}>{s.label}</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: isActive ? "rgba(245,237,220,0.7)" : "var(--mute)"
                      }}
                    >
                      {s.hint}
                    </span>
                  </div>
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
          {active === "title" && <TitleSection project={project} bible={bible} />}
          {active === "logline" && <LoglineSection project={project} />}
          {active === "synopsis" && <SynopsisSection project={project} />}
          {active === "tone" && <ToneSection bible={bible} />}
          {active === "world" && <WorldSection project={project} bible={bible} locations={locations} />}
          {active === "characters" && <CharactersSection characters={characters} />}
          {active === "visual" && <VisualSection bible={bible} project={project} />}
          {active === "scenes" && <SceneSection beats={beats} locations={locations} />}
          {active === "production" && <ProductionSection project={project} bible={bible} />}
          {active === "attachments" && <AttachmentsSection project={project} />}
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

/* ───────────────────────── Section renderers ───────────────────────── */

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <header style={{ marginBottom: "var(--sp-5)", paddingBottom: "var(--sp-4)", borderBottom: "1px solid var(--cream-deep)" }}>
      <span className="t-eyebrow">{eyebrow}</span>
      <h2 className="t-h1" style={{ marginTop: "var(--sp-2)" }}>{title}</h2>
      {sub && <p className="lead" style={{ marginTop: "var(--sp-2)", color: "var(--mute)" }}>{sub}</p>}
    </header>
  );
}

function MetaGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--sp-3)" }}>
      {items.map((item) => (
        <div key={item.label} className="card" style={{ padding: "var(--sp-4)" }}>
          <span className="t-eyebrow">{item.label}</span>
          <div style={{ marginTop: "var(--sp-2)", fontSize: "var(--t-body-l)", fontWeight: 600 }}>
            {item.value || <span style={{ color: "var(--mute)" }}>—</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function TitleSection({ project, bible }: { project: Project; bible: Bible }) {
  return (
    <div>
      <SectionHead
        eyebrow="01 / TITLE PAGE"
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
      <div className="card" style={{ marginTop: "var(--sp-4)" }}>
        <span className="t-eyebrow">TAGLINE</span>
        <p className="t-h3" style={{ marginTop: "var(--sp-2)", color: "var(--ink)" }}>
          {project.tagline || <span style={{ color: "var(--mute)" }}>No tagline yet.</span>}
        </p>
      </div>
      <div className="card" style={{ marginTop: "var(--sp-3)" }}>
        <span className="t-eyebrow">LOGLINE</span>
        <p style={{ marginTop: "var(--sp-2)" }}>{project.logline || project.premise}</p>
      </div>
      <div className="card" style={{ marginTop: "var(--sp-3)", background: "var(--bg)" }}>
        <span className="t-eyebrow">BIBLE STATUS</span>
        <p style={{ marginTop: "var(--sp-2)" }}>
          {bible.built ? `Built · ${bible.word_count.toLocaleString()} words` : "Queued for Bible Builder"}
        </p>
      </div>
    </div>
  );
}

function LoglineSection({ project }: { project: Project }) {
  return (
    <div>
      <SectionHead
        eyebrow="02 / LOGLINE"
        title="Logline"
        sub="One sentence — protagonist + conflict + stakes. Everything else is downstream."
      />
      <div
        className="card"
        style={{
          padding: "var(--sp-7)",
          textAlign: "center",
          background: "var(--bg)"
        }}
      >
        <p
          className="t-display-m"
          style={{ color: "var(--ink)", maxWidth: "32ch", margin: "0 auto", lineHeight: 1.1 }}
        >
          {project.logline || project.premise || "No logline yet."}
        </p>
      </div>
      {project.tagline && (
        <div className="card" style={{ marginTop: "var(--sp-4)" }}>
          <span className="t-eyebrow">TAGLINE</span>
          <p className="t-h3" style={{ marginTop: "var(--sp-2)" }}>{project.tagline}</p>
        </div>
      )}
    </div>
  );
}

function SynopsisSection({ project }: { project: Project }) {
  return (
    <div>
      <SectionHead
        eyebrow="03 / SYNOPSIS"
        title="Synopsis"
        sub="Short for pitch decks. Full for crew + investors. Present tense, no dialogue."
      />
      <section style={{ marginBottom: "var(--sp-5)" }}>
        <span className="t-eyebrow">SHORT — ONE PARAGRAPH</span>
        <p className="lead" style={{ marginTop: "var(--sp-2)" }}>
          {project.short_synopsis || project.logline || project.premise}
        </p>
      </section>
      <section>
        <span className="t-eyebrow">FULL — ACT BY ACT</span>
        <div
          style={{
            marginTop: "var(--sp-2)",
            padding: "var(--sp-5)",
            background: "var(--bg)",
            borderRadius: "var(--radius)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.7
          }}
        >
          {project.full_synopsis || <span style={{ color: "var(--mute)" }}>Bible Builder will fill this in on the next pass.</span>}
        </div>
      </section>
    </div>
  );
}

function ToneSection({ bible }: { bible: Bible }) {
  return (
    <div>
      <SectionHead
        eyebrow="04 / TONE & THEMES"
        title="Tone &amp; themes"
        sub="Emotional register, the ideas the film is really about, the films it shares a shelf with."
      />

      <section style={{ marginBottom: "var(--sp-5)" }}>
        <span className="t-eyebrow">TONE</span>
        <div
          style={{
            marginTop: "var(--sp-2)",
            padding: "var(--sp-4)",
            background: "var(--bg)",
            borderRadius: "var(--radius)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.7
          }}
        >
          {bible.tone_doc || <span style={{ color: "var(--mute)" }}>—</span>}
        </div>
      </section>

      {bible.themes.length > 0 && (
        <section style={{ marginBottom: "var(--sp-5)" }}>
          <span className="t-eyebrow">CORE THEMES</span>
          <div className="tag-strip" style={{ marginTop: "var(--sp-3)" }}>
            {bible.themes.map((t) => (
              <span key={t} className="tag tag-2">{t}</span>
            ))}
          </div>
        </section>
      )}

      {bible.comparable_films.length > 0 && (
        <section style={{ marginBottom: "var(--sp-5)" }}>
          <span className="t-eyebrow">COMPARABLE FILMS</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--sp-3)", marginTop: "var(--sp-3)" }}>
            {bible.comparable_films.map((f) => (
              <div key={f.title} className="card" style={{ padding: "var(--sp-4)" }}>
                <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "var(--t-h4)", letterSpacing: "-0.005em", color: "var(--ink)" }}>{f.title}</div>
                <p className="t-mute" style={{ marginTop: "var(--sp-2)", fontSize: "var(--t-body-s)" }}>
                  {f.note}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {bible.what_makes_different && (
        <section>
          <span className="t-eyebrow">WHAT MAKES THIS DIFFERENT</span>
          <p className="lead" style={{ marginTop: "var(--sp-3)" }}>{bible.what_makes_different}</p>
        </section>
      )}
    </div>
  );
}

function WorldSection({
  project,
  bible,
  locations
}: {
  project: Project;
  bible: Bible;
  locations: Location[];
}) {
  return (
    <div>
      <SectionHead
        eyebrow="05 / WORLD"
        title="World"
        sub="Time, place, rules. The texture of the air around the story."
      />
      <MetaGrid
        items={[
          { label: "Time period", value: project.time_period },
          { label: "Aspect ratio", value: project.aspect_ratio }
        ]}
      />

      <section style={{ marginTop: "var(--sp-5)" }}>
        <span className="t-eyebrow">ATMOSPHERE</span>
        <p style={{ marginTop: "var(--sp-2)", lineHeight: 1.7 }}>{bible.atmosphere || "—"}</p>
      </section>

      <section style={{ marginTop: "var(--sp-5)" }}>
        <span className="t-eyebrow">WORLD RULES</span>
        <p style={{ marginTop: "var(--sp-2)", lineHeight: 1.7 }}>{bible.world_rules || "—"}</p>
      </section>

      {locations.length > 0 && (
        <section style={{ marginTop: "var(--sp-5)" }}>
          <span className="t-eyebrow">LOCATIONS · {locations.length}</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-3)", marginTop: "var(--sp-3)" }}>
            {locations.map((loc) => (
              <div key={loc.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                {loc.refs[0] && (
                  <div style={{ aspectRatio: "16/9", overflow: "hidden", background: "var(--cream-deep)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={loc.refs[0]} alt={loc.name} className="portrait-img" />
                  </div>
                )}
                <div style={{ padding: "var(--sp-3)" }}>
                  <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "var(--t-h4)", letterSpacing: "-0.005em", color: "var(--ink)" }}>
                    {loc.name}
                  </div>
                  <span className="t-eyebrow" style={{ display: "block", marginTop: "var(--sp-1)" }}>
                    {loc.int_ext} · {loc.scene_count} SCENES
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: "var(--sp-5)" }}>
        <span className="t-eyebrow">WORLD NOTES (LEGACY)</span>
        <div
          style={{
            marginTop: "var(--sp-2)",
            padding: "var(--sp-4)",
            background: "var(--bg)",
            borderRadius: "var(--radius)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.7
          }}
        >
          {bible.world_doc || "—"}
        </div>
      </section>
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
          eyebrow="06 / CHARACTERS"
          title="Characters"
          sub="One spread per major character. Casting Director surfaces these."
        />
        <p className="t-mute">No characters yet. Import from script or add manually in Casting.</p>
      </div>
    );
  }

  return (
    <div>
      <SectionHead
        eyebrow="06 / CHARACTERS"
        title="Characters"
        sub="One spread per character — psychology, arc, voice, wardrobe, relationships."
      />

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "var(--sp-5)" }}>
        <aside style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {characters.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              className="sidebar-item"
              data-active={c.id === active}
              style={{ gridTemplateColumns: "1fr", padding: "8px 12px" }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: "var(--t-body-s)" }}>{c.name}</div>
                <span
                  className="t-eyebrow"
                  style={{
                    color: c.id === active ? "rgba(245,237,220,0.7)" : "var(--mute)"
                  }}
                >
                  {c.role}
                </span>
              </div>
            </button>
          ))}
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
      <div className="card" style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1.5fr" }}>
        <div style={{ background: "var(--cream-deep)", aspectRatio: "3/4", overflow: "hidden" }}>
          {ref && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={ref} alt={c.name} className="portrait-img" />
          )}
        </div>
        <div style={{ padding: "var(--sp-5)", display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          <span className="t-eyebrow">{c.role.toUpperCase()} · {c.scene_count} SCENES</span>
          <h3 className="t-display-m" style={{ lineHeight: 1, color: "var(--ink)" }}>{c.name}</h3>
          {c.brief && (c.brief.age || c.brief.features || c.brief.build) && (
            <p style={{ color: "var(--mute)", lineHeight: 1.6 }}>
              {[c.brief.age, c.brief.build, c.brief.features].filter(Boolean).join(" · ")}
            </p>
          )}
          {c.key_quote && (
            <blockquote
              style={{
                margin: 0,
                padding: "var(--sp-3) var(--sp-4)",
                borderLeft: "3px solid var(--accent)",
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: "var(--t-body-l)",
                color: "var(--ink)",
                lineHeight: 1.4
              }}
            >
              &ldquo;{c.key_quote}&rdquo;
            </blockquote>
          )}
        </div>
      </div>

      {c.background && (
        <Field title="Background" body={c.background} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-3)" }}>
        <Field title="Want" body={c.psychology_want} />
        <Field title="Fear" body={c.psychology_fear} />
        <Field title="Wound" body={c.psychology_wound} />
      </div>

      <div className="card">
        <span className="t-eyebrow">ARC</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-3)", marginTop: "var(--sp-3)" }}>
          <ArcStep label="Start" body={c.arc_start} />
          <ArcStep label="Break open" body={c.arc_middle} />
          <ArcStep label="End" body={c.arc_end} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
        <Field title="Voice" body={c.voice} />
        <Field title="Wardrobe direction" body={c.wardrobe_direction} />
      </div>

      {c.relationships.length > 0 && (
        <div className="card">
          <span className="t-eyebrow">RELATIONSHIPS</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", marginTop: "var(--sp-3)" }}>
            {c.relationships.map((r) => (
              <div
                key={r.with + r.type}
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr",
                  gap: "var(--sp-3)",
                  alignItems: "baseline"
                }}
              >
                <span className="tag" style={{ justifySelf: "start" }}>{r.with}</span>
                <span style={{ color: "var(--ink-soft)" }}>{r.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <span className="t-eyebrow">{title}</span>
      <p style={{ marginTop: "var(--sp-2)", lineHeight: 1.6 }}>
        {body || <span style={{ color: "var(--mute)" }}>—</span>}
      </p>
    </div>
  );
}

function ArcStep({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <span className="t-eyebrow" style={{ color: "var(--accent)" }}>{label}</span>
      <p style={{ marginTop: "var(--sp-2)", lineHeight: 1.6 }}>
        {body || <span style={{ color: "var(--mute)" }}>—</span>}
      </p>
    </div>
  );
}

function VisualSection({ bible, project }: { bible: Bible; project: Project }) {
  return (
    <div>
      <SectionHead
        eyebrow="07 / VISUAL LANGUAGE"
        title="Visual language"
        sub="How this looks. Palette, lens, light, cut, recurring motifs."
      />

      {bible.visual_palette.length > 0 && (
        <section style={{ marginBottom: "var(--sp-5)" }}>
          <span className="t-eyebrow">PALETTE</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(bible.visual_palette.length, 6)}, 1fr)`,
              gap: "var(--sp-3)",
              marginTop: "var(--sp-3)"
            }}
          >
            {bible.visual_palette.map((sw) => (
              <div key={sw.hex} className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ aspectRatio: "1/1", background: sw.hex }} />
                <div style={{ padding: "var(--sp-3)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--mute)" }}>{sw.hex}</div>
                  <div style={{ marginTop: 4, fontSize: "var(--t-body-s)", fontWeight: 500 }}>{sw.name}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
        <Field title="Cinematography" body={bible.cinematography_notes} />
        <Field title="Lighting philosophy" body={bible.lighting_philosophy} />
      </div>

      <div style={{ marginTop: "var(--sp-3)" }}>
        <Field title="Editorial rhythm" body={bible.editorial_rhythm} />
      </div>

      {bible.visual_motifs.length > 0 && (
        <section style={{ marginTop: "var(--sp-5)" }}>
          <span className="t-eyebrow">RECURRING MOTIFS</span>
          <ul style={{ marginTop: "var(--sp-3)", display: "flex", flexDirection: "column", gap: "var(--sp-2)", paddingLeft: "var(--sp-4)" }}>
            {bible.visual_motifs.map((m) => (
              <li key={m} style={{ lineHeight: 1.6 }}>{m}</li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ marginTop: "var(--sp-5)" }}>
        <span className="t-eyebrow">FORMAT</span>
        <div className="card" style={{ marginTop: "var(--sp-3)" }}>
          Aspect ratio: <span style={{ fontWeight: 600 }}>{project.aspect_ratio}</span>
        </div>
      </section>
    </div>
  );
}

function SceneSection({ beats, locations }: { beats: Beat[]; locations: Location[] }) {
  const locMap = Object.fromEntries(locations.map((l) => [l.id, l]));
  return (
    <div>
      <SectionHead
        eyebrow={`08 / SCENE BREAKDOWN · ${beats.length} BEATS`}
        title="Scene breakdown"
        sub="The crew's read-only map of every beat — heading, cast, mood, props, flags."
      />
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--t-body-s)" }}>
          <thead>
            <tr style={{ background: "var(--bg)" }}>
              {["#", "SCENE", "TITLE", "CAST", "LOCATION", "MOOD", "FLAG"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "var(--sp-3)",
                    textAlign: "left",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--t-eyebrow)",
                    letterSpacing: "var(--tracking-eyebrow)",
                    textTransform: "uppercase",
                    color: "var(--mute)",
                    borderBottom: "1px solid var(--cream-deep)"
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {beats.map((b) => (
              <tr key={b.id} style={{ borderBottom: "1px solid var(--cream-deep)" }}>
                <td style={{ padding: "var(--sp-3)", fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 500 }}>
                  {String(b.n).padStart(2, "0")}
                </td>
                <td style={{ padding: "var(--sp-3)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)" }}>
                  {b.scene_heading}
                </td>
                <td style={{ padding: "var(--sp-3)", fontWeight: 600 }}>{b.title}</td>
                <td style={{ padding: "var(--sp-3)" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {b.characters.map((c) => (
                      <span key={c} className="tag" style={{ fontSize: 10, padding: "2px 8px" }}>{c}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "var(--sp-3)", color: "var(--mute)" }}>
                  {b.location_id ? locMap[b.location_id]?.name ?? b.location_id : "—"}
                </td>
                <td style={{ padding: "var(--sp-3)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--mute)" }}>
                  {b.mood.join(" · ")}
                </td>
                <td style={{ padding: "var(--sp-3)" }}>
                  {b.flag ? (
                    <span className="pip-state" data-status="error">{b.flag.toUpperCase()}</span>
                  ) : (
                    <span style={{ color: "var(--mute)" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductionSection({ project, bible }: { project: Project; bible: Bible }) {
  return (
    <div>
      <SectionHead
        eyebrow="09 / PRODUCTION NOTES"
        title="Production notes"
        sub="Budget tier, challenges, VFX, casting direction. Line producer view."
      />
      <MetaGrid
        items={[
          { label: "Budget tier", value: project.budget_tier.toUpperCase() },
          { label: "Format", value: project.format },
          { label: "Length", value: project.length_estimate }
        ]}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)", marginTop: "var(--sp-5)" }}>
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
        eyebrow="10 / ATTACHMENTS"
        title="Attachments"
        sub="Everything else the Bible references — linked, not embedded."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
        {items.map((item) => (
          <div
            key={item.label}
            className="card"
            style={{
              padding: "var(--sp-4)",
              display: "grid",
              gridTemplateColumns: "32px 1fr auto",
              gap: "var(--sp-3)",
              alignItems: "center"
            }}
          >
            <ListChecks size={16} style={{ color: "var(--accent)" }} />
            <div>
              <div style={{ fontWeight: 600 }}>{item.label}</div>
              <span className="t-eyebrow" style={{ display: "block", marginTop: 2 }}>{item.note}</span>
            </div>
            {item.target === "storybook" ? (
              <span className="pip-state" data-status="draft">PINNED</span>
            ) : (
              <span className="pip-state" data-status="done">LINKED</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
