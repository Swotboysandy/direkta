"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { pageIn, staggerContainer, staggerItem } from "../_components/motion";
import type { Project, WorkspaceId } from "../../lib/types";

interface Generation {
  id: string;
  url: string;
  prompt: string;
  created_at: string;
  beat_n: number | null;
  variant_n: number | null;
  beat_title: string | null;
}

interface Sequence {
  id: string;
  url: string;
  title: string;
  created_at: string;
}

interface SoulId {
  id: string;
  name: string;
  role: string;
  state: string;
  consistency: number | null;
  refs: string[];
}

interface LocationLib {
  id: string;
  name: string;
  int_ext: string;
  state: string;
  refs: string[];
}

interface Library {
  generations: Generation[];
  sequences: Sequence[];
  characters: SoulId[];
  locations: LocationLib[];
}

type Tab = "generations" | "sequences" | "soulids" | "locations";

interface Props {
  project: Project;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

// The mockup's mono captions (eyebrow, tab pills, card meta) trade the app's
// older wide-tracked ALL CAPS for a tighter, mixed-case voice — one override
// reused everywhere that voice shows up.
const TIGHT_MONO: CSSProperties = { letterSpacing: "0.02em", textTransform: "none" };
const TAB_BTN_STYLE: CSSProperties = { ...TIGHT_MONO, border: "none" };
const CARD_RADIUS: CSSProperties = { borderRadius: 18 };

export function Library({ project }: Props) {
  const [data, setData] = useState<Library | null>(null);
  const [tab, setTab] = useState<Tab>("generations");

  useEffect(() => {
    fetch(`/api/projects/${project.id}/library`)
      .then((r) => r.json())
      .then(setData)
      // Don't strand the UI on "Loading…" — fall back to empty so the empty
      // states render instead.
      .catch(() => setData({ generations: [], sequences: [], characters: [], locations: [] }));
  }, [project.id]);

  return (
    <motion.div className="main-inner" {...pageIn}>
      <header className="page-head">
        <div>
          <span className="crumb" style={TIGHT_MONO}>06 / Workspace · Library</span>
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
            Library
          </h1>
          <p className="lead" style={{ margin: "12px 0 0" }}>
            Every generated asset on this project. Browse, restore variants, or hand a frame back to
            the Cinematographer.
          </p>
        </div>
        <div className="page-head-actions">
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
            {data ? `${data.generations.length + data.sequences.length} items` : "—"}
          </span>
        </div>
      </header>

      <div className="library-tabs">
        <button data-active={tab === "generations"} onClick={() => setTab("generations")} style={TAB_BTN_STYLE}>
          Frames {data ? `· ${data.generations.length}` : ""}
        </button>
        <button data-active={tab === "sequences"} onClick={() => setTab("sequences")} style={TAB_BTN_STYLE}>
          Sequences {data ? `· ${data.sequences.length}` : ""}
        </button>
        <button data-active={tab === "soulids"} onClick={() => setTab("soulids")} style={TAB_BTN_STYLE}>
          Soul IDs {data ? `· ${data.characters.length}` : ""}
        </button>
        <button data-active={tab === "locations"} onClick={() => setTab("locations")} style={TAB_BTN_STYLE}>
          Locations {data ? `· ${data.locations.length}` : ""}
        </button>
      </div>

      {!data && <p className="t-mute">Loading…</p>}

      {data && tab === "generations" && (
        <motion.div className="library-grid" variants={staggerContainer} initial="hidden" animate="show">
          {data.generations.map((g) => (
            <motion.div key={g.id} className="library-card" style={CARD_RADIUS} variants={staggerItem}>
              <div className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt={g.beat_title ?? g.prompt} />
              </div>
              <div className="body">
                <div className="title">
                  {g.beat_n ? `Beat ${String(g.beat_n).padStart(2, "0")}` : "Frame"}
                  {g.variant_n ? ` · V${String(g.variant_n).padStart(2, "0")}` : ""}
                  {g.beat_title ? ` — ${g.beat_title}` : ""}
                </div>
                <div className="meta" style={TIGHT_MONO}>
                  <span>{new Date(g.created_at + "Z").toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {data && tab === "sequences" && (
        <motion.div className="library-grid" variants={staggerContainer} initial="hidden" animate="show">
          {data.sequences.map((s) => (
            <motion.div key={s.id} className="library-card" style={CARD_RADIUS} variants={staggerItem}>
              <div className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt={s.title} />
              </div>
              <div className="body">
                <div className="title">{s.title}</div>
                <div className="meta" style={TIGHT_MONO}>
                  <span>{new Date(s.created_at + "Z").toLocaleString()}</span>
                  <span>MP4</span>
                </div>
              </div>
            </motion.div>
          ))}
          {data.sequences.length === 0 && (
            <p className="t-mute">No sequences yet. Build an animatic in Stitch.</p>
          )}
        </motion.div>
      )}

      {data && tab === "soulids" && (
        <motion.div className="library-grid" variants={staggerContainer} initial="hidden" animate="show">
          {data.characters.map((c) => (
            <motion.div key={c.id} className="library-card" style={CARD_RADIUS} variants={staggerItem}>
              <div className="thumb">
                {c.refs[0] && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={c.refs[0]} alt={c.name} style={{ objectPosition: "top" }} />
                )}
              </div>
              <div className="body">
                <div className="title">{c.name}</div>
                <div className="meta" style={TIGHT_MONO}>
                  <span>{c.role}</span>
                  <span>{c.state.toUpperCase()}</span>
                  {c.consistency != null && <span>{c.consistency.toFixed(1)}/10</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {data && tab === "locations" && (
        <motion.div className="library-grid" variants={staggerContainer} initial="hidden" animate="show">
          {data.locations.map((l) => (
            <motion.div key={l.id} className="library-card" style={CARD_RADIUS} variants={staggerItem}>
              <div className="thumb">
                {l.refs[0] && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={l.refs[0]} alt={l.name} />
                )}
              </div>
              <div className="body">
                <div className="title">{l.name}</div>
                <div className="meta" style={TIGHT_MONO}>
                  <span>{l.int_ext}</span>
                  <span>{l.state.toUpperCase()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
