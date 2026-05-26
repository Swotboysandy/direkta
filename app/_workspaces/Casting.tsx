"use client";

import { useState } from "react";
import { ArrowRight, Plus, RefreshCcw, X } from "lucide-react";
import type { Character, Location, Project, WorkspaceId } from "../../lib/types";

interface Props {
  project: Project;
  characters: Character[];
  locations: Location[];
  onSwitchWorkspace: (ws: WorkspaceId) => void;
  onReload: () => Promise<void> | void;
}

export function Casting({ project, characters, locations, onSwitchWorkspace, onReload }: Props) {
  const [adding, setAdding] = useState<"character" | "location" | null>(null);

  const trained = characters.filter((c) => c.soul_id_state === "trained").length;
  const total = characters.length;

  return (
    <div className="main-inner casting">
      <header className="page-head">
        <div>
          <div className="crumb">03 / WORKSPACE · CASTING</div>
          <h1>Casting</h1>
          <div className="sub">
            Train a <strong style={{ color: "var(--bone)" }}>Soul ID</strong> for every character and key location.
            Consistency across every frame starts here.
          </div>
        </div>
        <div className="actions">
          <span className="pip-state" data-s={trained >= total && total > 0 ? "done" : "working"}>
            {trained} / {total || "—"} SOUL IDS
          </span>
          <button className="btn" onClick={() => setAdding("character")}>
            <Plus size={12} /> Add character
          </button>
          <button
            className="btn btn-primary"
            disabled={total === 0}
            onClick={() => onSwitchWorkspace("storyboard")}
          >
            Continue to Storyboard <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <div className="page-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div className="eb">CHARACTERS · {total} CAST</div>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--ink-60)",
              textTransform: "uppercase"
            }}
          >
            SOUL ID TRAINING IS STUBBED IN V1
          </div>
        </div>

        {characters.length === 0 ? (
          <div className="card" style={{ borderStyle: "dashed" }}>
            <div className="eb">CASTING DIRECTOR</div>
            <p style={{ color: "var(--ink-70)", marginTop: 8 }}>
              No characters cast yet. Submit your script in Screenplay and the Casting Director will
              import them automatically — or add one manually now.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setAdding("character")}>
              <Plus size={12} /> Add character
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {characters.map((c) => (
              <CharacterCard key={c.id} character={c} projectId={project.id} onChange={onReload} />
            ))}
          </div>
        )}

        <div className="eb" style={{ marginTop: 40, marginBottom: 14 }}>
          LOCATIONS · {locations.length} IDENTIFIED
        </div>

        {locations.length === 0 ? (
          <div className="card" style={{ borderStyle: "dashed" }}>
            <p style={{ color: "var(--ink-70)" }}>
              No locations cast yet. Submit your script and the crew will import the scene
              locations — or add one manually.
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 14 }}
              onClick={() => setAdding("location")}
            >
              <Plus size={12} /> Add location
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {locations.map((l) => (
              <LocationCard key={l.id} location={l} projectId={project.id} onChange={onReload} />
            ))}
          </div>
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
    </div>
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
  const state = character.soul_id_state;
  const ref = character.refs[0];

  const statusPip = (() => {
    if (state === "trained")
      return (
        <span className="pip-state" data-s="done">
          TRAINED · {character.consistency?.toFixed(1) ?? "—"} / 10
        </span>
      );
    if (state === "training")
      return (
        <span className="pip-state" data-s="working">
          TRAINING · {Math.round(character.soul_id_progress * 100)}%
        </span>
      );
    if (state === "failed")
      return (
        <span className="pip-state" data-s="attention">
          TRAINING FAILED
        </span>
      );
    return <span className="pip-state">NOT STARTED</span>;
  })();

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
        <div>
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 26,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--bone)",
              lineHeight: 1
            }}
          >
            {character.name}
          </div>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--ink-60)",
              textTransform: "uppercase",
              marginTop: 6
            }}
          >
            {character.role} · {character.scene_count} SCENES
            {character.dialogue ? " · SPEAKING" : ""}
          </div>
        </div>
        {statusPip}
      </div>

      {ref && state !== "empty" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
            height: 132
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: "relative",
                overflow: "hidden",
                background: "var(--cream-deep)",
                borderRadius: "var(--r-sm)"
              }}
              className={state === "training" && i === 2 ? "shimmer" : ""}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ref}
                alt={character.name}
                className="portrait-img"
                style={{
                  transform: `scale(${1.06 + i * 0.04}) translateX(${(i - 1) * 4}px)`,
                  filter: i === 0 ? "contrast(0.95)" : i === 1 ? "contrast(1.05) saturate(0.85)" : "contrast(1.02)"
                }}
              />
            </div>
          ))}
        </div>
      )}

      {state === "empty" && (
        <div
          style={{
            minHeight: 120,
            border: "1px dashed var(--ink-40)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "var(--ink-60)",
            padding: 16,
            textAlign: "center"
          }}
        >
          <Plus size={18} />
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase"
            }}
          >
            ADD REFERENCE PHOTOS
          </div>
        </div>
      )}

      {state === "failed" && character.error && (
        <div
          style={{
            padding: 14,
            background: "rgba(217, 67, 67, 0.06)",
            borderLeft: "2px solid var(--cut)",
            color: "var(--ink-70)",
            fontSize: 13,
            lineHeight: 1.5
          }}
        >
          {character.error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        {state === "empty" && (
          <button
            className="btn btn-sm"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={async () => {
              await fetch(`/api/characters/${character.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ soul_id_state: "training", soul_id_progress: 0.42 })
              });
              await onChange();
            }}
          >
            Begin casting
          </button>
        )}
        {state === "training" && (
          <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }} disabled>
            In training…
          </button>
        )}
        {state === "trained" && (
          <>
            <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }}>
              Test consistency
            </button>
            <button className="btn btn-sm btn-ghost">Edit</button>
          </>
        )}
        {state === "failed" && (
          <>
            <button
              className="btn btn-sm"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={async () => {
                await fetch(`/api/characters/${character.id}`, {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ soul_id_state: "empty", error: null })
                });
                await onChange();
              }}
            >
              <RefreshCcw size={12} /> Retry
            </button>
          </>
        )}
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
  const ref = location.refs[0];
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0, overflow: "hidden" }}>
      {ref && location.soul_id_state !== "empty" && (
        <div
          style={{
            aspectRatio: "16/9",
            background: "var(--ink-15)",
            borderBottom: "1px solid var(--ink-30)",
            overflow: "hidden",
            position: "relative"
          }}
          className={location.soul_id_state === "training" ? "shimmer" : ""}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ref} alt={location.name} className="portrait-img" />
        </div>
      )}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--f-display)",
            fontSize: 16,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--bone)",
            lineHeight: 1.15
          }}
        >
          {location.name}
        </div>
        <div
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--ink-60)",
            textTransform: "uppercase"
          }}
        >
          {location.int_ext} · {location.scene_count} SCENES
        </div>
        <div style={{ marginTop: "auto" }}>
          <span
            className="pip-state"
            data-s={
              location.soul_id_state === "trained"
                ? "done"
                : location.soul_id_state === "training"
                ? "working"
                : location.soul_id_state === "failed"
                ? "attention"
                : undefined
            }
          >
            {location.soul_id_state.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
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
                    className="btn btn-sm"
                    style={{
                      borderColor: role === r ? "var(--tungsten)" : undefined,
                      color: role === r ? "var(--tungsten)" : undefined
                    }}
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
                    className="btn btn-sm"
                    style={{
                      borderColor: intExt === t ? "var(--tungsten)" : undefined,
                      color: intExt === t ? "var(--tungsten)" : undefined
                    }}
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
