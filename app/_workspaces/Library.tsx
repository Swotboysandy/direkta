"use client";

import { useEffect, useState } from "react";
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

export function Library({ project }: Props) {
  const [data, setData] = useState<Library | null>(null);
  const [tab, setTab] = useState<Tab>("generations");

  useEffect(() => {
    fetch(`/api/projects/${project.id}/library`)
      .then((r) => r.json())
      .then(setData);
  }, [project.id]);

  return (
    <div className="main-inner">
      <header className="page-head">
        <div>
          <div className="crumb">06 / WORKSPACE · LIBRARY</div>
          <h1>Library</h1>
          <div className="sub">
            Every generated asset on this project. Browse, restore variants, or hand a frame back to
            the Cinematographer.
          </div>
        </div>
        <div className="actions">
          <span className="pip-state">
            {data ? `${data.generations.length + data.sequences.length} ITEMS` : "—"}
          </span>
        </div>
      </header>

      <div className="library-tabs">
        <button data-active={tab === "generations"} onClick={() => setTab("generations")}>
          Frames {data ? `· ${data.generations.length}` : ""}
        </button>
        <button data-active={tab === "sequences"} onClick={() => setTab("sequences")}>
          Sequences {data ? `· ${data.sequences.length}` : ""}
        </button>
        <button data-active={tab === "soulids"} onClick={() => setTab("soulids")}>
          Soul IDs {data ? `· ${data.characters.length}` : ""}
        </button>
        <button data-active={tab === "locations"} onClick={() => setTab("locations")}>
          Locations {data ? `· ${data.locations.length}` : ""}
        </button>
      </div>

      {!data && <p style={{ color: "var(--ink-70)" }}>Loading…</p>}

      {data && tab === "generations" && (
        <div className="library-grid">
          {data.generations.map((g) => (
            <div key={g.id} className="library-card">
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
                <div className="meta">
                  <span>{new Date(g.created_at + "Z").toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && tab === "sequences" && (
        <div className="library-grid">
          {data.sequences.map((s) => (
            <div key={s.id} className="library-card">
              <div className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt={s.title} />
              </div>
              <div className="body">
                <div className="title">{s.title}</div>
                <div className="meta">
                  <span>{new Date(s.created_at + "Z").toLocaleString()}</span>
                  <span>MP4</span>
                </div>
              </div>
            </div>
          ))}
          {data.sequences.length === 0 && (
            <p style={{ color: "var(--ink-70)" }}>No sequences yet. Build an animatic in Stitch.</p>
          )}
        </div>
      )}

      {data && tab === "soulids" && (
        <div className="library-grid">
          {data.characters.map((c) => (
            <div key={c.id} className="library-card">
              <div className="thumb">
                {c.refs[0] && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={c.refs[0]} alt={c.name} style={{ objectPosition: "top" }} />
                )}
              </div>
              <div className="body">
                <div className="title">{c.name}</div>
                <div className="meta">
                  <span>{c.role}</span>
                  <span>{c.state.toUpperCase()}</span>
                  {c.consistency != null && <span>{c.consistency.toFixed(1)}/10</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && tab === "locations" && (
        <div className="library-grid">
          {data.locations.map((l) => (
            <div key={l.id} className="library-card">
              <div className="thumb">
                {l.refs[0] && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={l.refs[0]} alt={l.name} />
                )}
              </div>
              <div className="body">
                <div className="title">{l.name}</div>
                <div className="meta">
                  <span>{l.int_ext}</span>
                  <span>{l.state.toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
