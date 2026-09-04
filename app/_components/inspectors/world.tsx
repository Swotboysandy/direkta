"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { registerInspector, type InspectorBodyProps } from "../Inspector";
import { Button } from "../ui/button";
import { Status } from "../ui/status";
import { MediaTile } from "../ui/media-tile";
import { InlineError } from "../ui/inline-error";
import { useConfirm } from "../ui/alert-dialog";
import { useAsync } from "../../_hooks/useAsync";
import { IMAGE_TOKENS, tokensLabel } from "../../_lib/costs";
import { RefreshCcw } from "../icons";
import type { Character, Location, Prop, SoulIdState } from "../../../lib/types";

/**
 * World's inspector bodies (brief §23–26, §58).
 *
 * The inspector is mounted by the shell, outside the World workspace, so it
 * cannot read World's props. World publishes what it has — the project's
 * characters, locations and props plus its reload — into a small store here,
 * and the bodies read from that. No second fetch of the bundle, and a change
 * saved from the inspector reloads the same bundle the tiles draw from.
 */

/* ------------------------------------------------------------------ store */

export interface WorldData {
  projectId: string;
  characters: Character[];
  locations: Location[];
  props: Prop[];
  reload: () => Promise<void> | void;
}

let world: WorldData | null = null;
const listeners = new Set<() => void>();

export function publishWorld(next: WorldData) {
  world = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function useWorld(): WorldData | null {
  return useSyncExternalStore(
    subscribe,
    () => world,
    () => null
  );
}

/* --------------------------------------------------------- shared pieces */

/** One Soul ID / World ID / Object ID state, in the product's status words. */
export function SoulStatus({
  state,
  progress,
  consistency,
  busy
}: {
  state: SoulIdState;
  progress?: number;
  consistency?: number | null;
  busy?: boolean;
}) {
  if (busy) return <Status domain="generation" value="Processing" />;
  if (state === "training") return <Status domain="generation" value="Processing" detail={`${Math.round((progress ?? 0) * 100)}%`} />;
  if (state === "trained")
    return <Status domain="creative" value="Locked" detail={consistency != null ? `${consistency.toFixed(1)} / 10` : undefined} />;
  if (state === "failed") return <Status domain="generation" value="Failed" />;
  return <Status domain="creative" value="Draft" />;
}

/** Attach a look or plate made outside Fylmer instead of generating one. */
export function UploadLook({
  endpoint,
  label,
  onUploaded,
  size = "sm"
}: {
  endpoint: string;
  label: string;
  onUploaded: () => Promise<void> | void;
  size?: "sm" | "md";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="world-upload">
      <label className="world-upload-label" data-size={size} data-busy={busy || undefined}>
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            setError(null);
            const form = new FormData();
            form.append("file", file);
            try {
              const res = await fetch(endpoint, { method: "POST", body: form });
              const data = await res.json().catch(() => null);
              if (!res.ok) setError(data?.error || "Upload failed.");
              else await onUploaded();
            } finally {
              setBusy(false);
            }
          }}
        />
        {busy ? "Uploading…" : label}
      </label>
      {error && <InlineError message={error} />}
    </div>
  );
}

interface StitchNode {
  id: string;
  beat: { n: number; title: string; characters: string[]; location_id: string | null } | null;
}

/** The shots on the board that already carry this identity — the number the
 *  destructive confirmations quote. */
function useDownstream(projectId: string, match: (n: StitchNode) => boolean) {
  const stitch = useAsync<StitchNode[]>(`/api/projects/${projectId}/stitch`, (b) => b.nodes ?? []);
  const nodes = stitch.data ?? [];
  return { count: nodes.filter(match).length, known: stitch.status !== "loading" && stitch.status !== "error" };
}

function shots(n: number) {
  return `${n} existing shot${n === 1 ? "" : "s"}`;
}

function Missing({ what, close }: { what: string; close: () => void }) {
  return (
    <div className="insp-missing">
      <p>This {what} is no longer in the project.</p>
      <Button size="sm" onClick={close}>
        Close
      </Button>
    </div>
  );
}

function RefBoard({ refs, alt }: { refs: string[]; alt: string }) {
  if (refs.length === 0) return null;
  return (
    <section className="insp-section">
      <h3 className="insp-h">Reference board</h3>
      <div className="insp-board">
        {refs.map((url, i) => (
          <MediaTile key={url + i} url={url} kind="image" alt={`${alt} reference ${i + 2}`} className="insp-board-img" />
        ))}
      </div>
    </section>
  );
}

function Hero({ url, alt, blank, shape }: { url?: string; alt: string; blank: string; shape: "portrait" | "wide" }) {
  return (
    <div className="insp-hero" data-shape={shape}>
      {url ? <MediaTile url={url} kind="image" alt={alt} className="insp-hero-img" /> : <span className="insp-hero-blank">{blank}</span>}
    </div>
  );
}

/* ------------------------------------------------------------ character */

const ROLES: Character["role"][] = ["Lead", "Supporting", "Featured", "Background"];

const BRIEF_FIELDS = [
  ["age", "Age", "e.g. 20s"],
  ["build", "Build", "e.g. slight, wiry"],
  ["features", "Features", "e.g. bob haircut, freckles"],
  ["wardrobe", "Wardrobe", "e.g. grey tee, denim jacket"],
  ["personality", "Personality", "one line"]
] as const;

function CharacterInspector({ selected, close }: InspectorBodyProps) {
  const w = useWorld();
  const c = w?.characters.find((x) => x.id === selected.id);
  if (!w || !c) return <Missing what="character" close={close} />;
  return <CharacterBody key={c.id} character={c} projectId={w.projectId} reload={w.reload} close={close} />;
}

function CharacterBody({
  character: c,
  projectId,
  reload,
  close
}: {
  character: Character;
  projectId: string;
  reload: () => Promise<void> | void;
  close: () => void;
}) {
  const confirm = useConfirm();
  const abstract = c.brief?.physical_form === "abstract";
  const refs = c.refs ?? [];
  const down = useDownstream(projectId, (n) => (n.beat?.characters ?? []).some((name) => name.toUpperCase() === c.name.toUpperCase()));

  // Identity draft — the fields the portrait prompt is built from. Each one
  // saves when it loses focus, with the same body the old modal sent.
  const [name, setName] = useState(c.name);
  const [role, setRole] = useState<Character["role"]>(c.role);
  const [dialogue, setDialogue] = useState(c.dialogue);
  const [brief, setBrief] = useState({
    age: c.brief?.age ?? "",
    build: c.brief?.build ?? "",
    features: c.brief?.features ?? "",
    wardrobe: c.brief?.wardrobe ?? "",
    personality: c.brief?.personality ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [casting, setCasting] = useState(false);
  const [castError, setCastError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/characters/${c.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Save failed.");
  }

  async function saveIdentity(next?: { role?: Character["role"]; dialogue?: boolean }) {
    const n = name.trim();
    if (!n) {
      setName(c.name);
      return;
    }
    const body = { name: n, role: next?.role ?? role, dialogue: next?.dialogue ?? dialogue, brief: { ...c.brief, ...brief } };
    setSaving(true);
    setSaveError(null);
    try {
      await patch(body);
      await reload();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function castLook() {
    if (casting) return;
    setCasting(true);
    setCastError(null);
    try {
      const res = await fetch(`/api/characters/${c.id}/portrait`, { method: "POST" });
      if (!res.ok) setCastError((await res.json().catch(() => null))?.error || "Casting failed.");
      await reload();
    } finally {
      setCasting(false);
    }
  }

  async function retry() {
    await patch({ soul_id_state: "empty", error: null });
    await reload();
  }

  const impact = down.known ? `may make ${shots(down.count)} visually inconsistent` : "may make existing shots visually inconsistent";

  async function clearLooks() {
    if (busy) return;
    if (
      !(await confirm({
        title: `Replace ${c.name}'s Soul ID?`,
        description: `Replacing ${c.name}'s Soul ID ${impact}. ${refs.length} look${refs.length === 1 ? "" : "s"} will be removed; the character stays, and frames already generated keep their picture. Cast a new look to lock the identity again.`,
        confirmLabel: "Clear looks",
        destructive: true
      }))
    )
      return;
    setBusy(true);
    try {
      await patch({ refs: [], soul_id_state: "empty" });
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    if (
      !(await confirm({
        title: `Delete ${c.name}?`,
        description: `Their looks and reference lock go with them, and removing ${c.name}'s Soul ID ${impact}. Frames already generated stay as they are.`,
        confirmLabel: "Delete character",
        destructive: true
      }))
    )
      return;
    setBusy(true);
    try {
      await fetch(`/api/characters/${c.id}`, { method: "DELETE" });
      close();
      await reload();
    } finally {
      setBusy(false);
    }
  }

  const working = casting || c.soul_id_state === "training";

  return (
    <div className="insp">
      {abstract ? (
        <p className="insp-note">Voice-only presence — no portrait, and no Soul ID to train.</p>
      ) : (
        <Hero url={refs[0]} alt={c.name} blank={c.name.trim()[0] ?? "?"} shape="portrait" />
      )}

      {!abstract && (
        <section className="insp-section">
          <div className="insp-idrow">
            <span className="insp-idlabel">Soul ID</span>
            <SoulStatus state={c.soul_id_state} progress={c.soul_id_progress} consistency={c.consistency} busy={casting} />
          </div>
          <div className="insp-actions">
            {c.soul_id_state === "failed" ? (
              <Button size="sm" onClick={retry} disabled={busy}>
                <RefreshCcw size={12} /> Retry
              </Button>
            ) : (
              <Button
                size="sm"
                intent={refs.length === 0 ? "primary" : "secondary"}
                onClick={castLook}
                disabled={working}
                title={`Generates one Seedream portrait · ${tokensLabel(IMAGE_TOKENS)}`}
              >
                {casting ? "Casting…" : c.soul_id_state === "training" ? "In training…" : refs.length === 0 ? "Cast a look" : "New look"}
                {!working && <span className="insp-cost">{tokensLabel(IMAGE_TOKENS)}</span>}
              </Button>
            )}
            <UploadLook endpoint={`/api/characters/${c.id}/upload-portrait`} label={refs.length ? "Upload a new look" : "Upload a look"} onUploaded={reload} />
          </div>
          {c.soul_id_state === "failed" && c.error && <InlineError message="The last cast failed." detail={c.error} onRetry={retry} />}
          {castError && <InlineError message={castError} onRetry={castLook} />}
        </section>
      )}

      <RefBoard refs={refs.slice(1)} alt={c.name} />

      <section className="insp-section">
        <div className="insp-idrow">
          <h3 className="insp-h">Identity</h3>
          <span className="insp-saving" aria-live="polite">
            {saving ? "Saving…" : ""}
          </span>
        </div>
        <label className="insp-field">
          <span>Name</span>
          <input className="world-input" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() !== c.name && saveIdentity()} />
        </label>
        <div className="insp-two">
          <label className="insp-field">
            <span>Role</span>
            <select
              className="world-input"
              value={role}
              onChange={(e) => {
                const r = e.target.value as Character["role"];
                setRole(r);
                void saveIdentity({ role: r });
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="insp-field">
            <span>Dialogue</span>
            <button
              type="button"
              className="world-input insp-toggle"
              aria-pressed={dialogue}
              onClick={() => {
                const d = !dialogue;
                setDialogue(d);
                void saveIdentity({ dialogue: d });
              }}
            >
              {dialogue ? "Speaking role" : "Non-speaking"}
            </button>
          </label>
        </div>
        {BRIEF_FIELDS.map(([key, label, ph]) => (
          <label key={key} className="insp-field">
            <span>{label}</span>
            <input
              className="world-input"
              placeholder={ph}
              value={brief[key]}
              onChange={(e) => setBrief((b) => ({ ...b, [key]: e.target.value }))}
              onBlur={() => brief[key] !== (c.brief?.[key] ?? "") && saveIdentity()}
            />
          </label>
        ))}
        {saveError && <InlineError message={saveError} onRetry={() => saveIdentity()} />}
        <p className="insp-note">These fields shape the portrait prompt. After a big change, cast a new look so the reference matches.</p>
      </section>

      <section className="insp-section">
        <h3 className="insp-h">Continuity</h3>
        <dl className="insp-facts">
          <div>
            <dt>Scenes</dt>
            <dd>{c.scene_count}</dd>
          </div>
          <div>
            <dt>Shots on the board</dt>
            <dd>{down.known ? down.count : "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="insp-section insp-danger">
        {refs.length > 0 && (
          <Button size="sm" intent="ghost" onClick={clearLooks} disabled={busy}>
            Clear looks ({refs.length})
          </Button>
        )}
        <Button size="sm" intent="ghost" className="insp-delete" onClick={remove} disabled={busy}>
          Delete character
        </Button>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------- location */

function LocationInspector({ selected, close }: InspectorBodyProps) {
  const w = useWorld();
  const l = w?.locations.find((x) => x.id === selected.id);
  if (!w || !l) return <Missing what="location" close={close} />;
  return <LocationBody key={l.id} location={l} projectId={w.projectId} reload={w.reload} />;
}

function LocationBody({ location: l, projectId, reload }: { location: Location; projectId: string; reload: () => Promise<void> | void }) {
  const [scouting, setScouting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const down = useDownstream(projectId, (n) => n.beat?.location_id === l.id);
  const refs = l.refs ?? [];

  async function scout() {
    if (scouting) return;
    setScouting(true);
    setError(null);
    try {
      const res = await fetch(`/api/locations/${l.id}/plate`, { method: "POST" });
      if (!res.ok) setError((await res.json().catch(() => null))?.error || "Scout failed.");
      await reload();
    } finally {
      setScouting(false);
    }
  }

  return (
    <div className="insp">
      <Hero url={refs[0]} alt={l.name} blank={l.int_ext} shape="wide" />
      <section className="insp-section">
        <div className="insp-idrow">
          <span className="insp-idlabel">World ID</span>
          <SoulStatus state={l.soul_id_state} progress={l.soul_id_progress} busy={scouting} />
        </div>
        <div className="insp-actions">
          <Button
            size="sm"
            intent={refs.length === 0 ? "primary" : "secondary"}
            onClick={scout}
            disabled={scouting}
            title={`Generates an establishing plate · ${tokensLabel(IMAGE_TOKENS)}`}
          >
            {scouting ? "Scouting…" : refs.length === 0 ? "Scout a plate" : "New plate"}
            {!scouting && <span className="insp-cost">{tokensLabel(IMAGE_TOKENS)}</span>}
          </Button>
          <UploadLook endpoint={`/api/locations/${l.id}/upload-plate`} label={refs.length ? "Upload a new plate" : "Upload a plate"} onUploaded={reload} />
        </div>
        {error && <InlineError message={error} onRetry={scout} />}
      </section>

      <RefBoard refs={refs.slice(1)} alt={l.name} />

      <section className="insp-section">
        <h3 className="insp-h">Identity</h3>
        <dl className="insp-facts">
          <div>
            <dt>Type</dt>
            <dd>{l.int_ext}</dd>
          </div>
          <div>
            <dt>Time of day</dt>
            <dd>{l.time_of_day || "—"}</dd>
          </div>
          <div>
            <dt>Scenes</dt>
            <dd>{l.scene_count}</dd>
          </div>
          <div>
            <dt>Shots on the board</dt>
            <dd>{down.known ? down.count : "—"}</dd>
          </div>
        </dl>
        <p className="insp-note">Name and type come from the script. Re-import from the script to update them.</p>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- prop */

function PropInspector({ selected, close }: InspectorBodyProps) {
  const w = useWorld();
  const p = w?.props.find((x) => x.id === selected.id);
  if (!w || !p) return <Missing what="prop" close={close} />;
  return <PropBody key={p.id} prop={p} reload={w.reload} />;
}

function PropBody({ prop: p, reload }: { prop: Prop; reload: () => Promise<void> | void }) {
  const [scouting, setScouting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = p.refs ?? [];

  async function scout() {
    if (scouting) return;
    setScouting(true);
    setError(null);
    try {
      const res = await fetch(`/api/props/${p.id}/plate`, { method: "POST" });
      if (!res.ok) setError((await res.json().catch(() => null))?.error || "Scout failed.");
      await reload();
    } finally {
      setScouting(false);
    }
  }

  return (
    <div className="insp">
      <Hero url={refs[0]} alt={p.name} blank={p.name.trim()[0] ?? "?"} shape="wide" />
      <section className="insp-section">
        <div className="insp-idrow">
          <span className="insp-idlabel">Object ID</span>
          <SoulStatus state={p.soul_id_state} progress={p.soul_id_progress} busy={scouting} />
        </div>
        <div className="insp-actions">
          <Button
            size="sm"
            intent={refs.length === 0 ? "primary" : "secondary"}
            onClick={scout}
            disabled={scouting}
            title={`Generates a reference plate · ${tokensLabel(IMAGE_TOKENS)}`}
          >
            {scouting ? "Scouting…" : refs.length === 0 ? "Scout a plate" : "New plate"}
            {!scouting && <span className="insp-cost">{tokensLabel(IMAGE_TOKENS)}</span>}
          </Button>
          <UploadLook endpoint={`/api/props/${p.id}/upload-plate`} label={refs.length ? "Upload a new plate" : "Upload a plate"} onUploaded={reload} />
        </div>
        {error && <InlineError message={error} onRetry={scout} />}
      </section>

      <RefBoard refs={refs.slice(1)} alt={p.name} />

      <section className="insp-section">
        <h3 className="insp-h">Identity</h3>
        <dl className="insp-facts">
          <div>
            <dt>Description</dt>
            <dd>{p.description || "—"}</dd>
          </div>
          <div>
            <dt>Scenes</dt>
            <dd>{p.scene_count}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

/* --------------------------------------------------------- registration */

let registered = false;

/** Called once from the World workspace module. */
export function registerWorldInspectors() {
  if (registered) return;
  registered = true;
  registerInspector("character", CharacterInspector);
  registerInspector("location", LocationInspector);
  registerInspector("prop", PropInspector);
}

/** Keeps the store in step with what World renders. */
export function usePublishWorld(data: WorldData) {
  const { projectId, characters, locations, props, reload } = data;
  useEffect(() => {
    publishWorld({ projectId, characters, locations, props, reload });
  }, [projectId, characters, locations, props, reload]);
}
