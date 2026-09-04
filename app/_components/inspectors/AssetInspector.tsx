"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { registerInspector, type InspectorBodyProps } from "../Inspector";
import { Button } from "../ui/button";
import { MediaTile } from "../ui/media-tile";
import { InlineError } from "../ui/inline-error";
import { ClipFrameTools } from "../ClipFrameTools";
import { useSelection } from "../../_state/selection";
import { Heart, Plus } from "../icons";
import type { WorkspaceId } from "../../../lib/types";

/**
 * The inspector body for one asset (brief §34–35, §58).
 *
 * An asset is the only selection whose actions depend on what it is rather
 * than where it sits: the same panel serves a storyboard still and a rendered
 * clip, and each is offered the handful of things that can actually be done
 * with it. Nothing here is a menu of twenty items; an action that cannot work
 * on this asset is absent, not disabled.
 *
 * The inspector is mounted by the shell, outside the Assets workspace, so it
 * cannot read that workspace's props. Assets publishes what it has — the
 * loaded items, the collections, and the handlers for the three actions that
 * need a picker — into a small store here, the way World already does.
 */

/* ------------------------------------------------------------------ types */

export type AssetKind = "image" | "video" | "character" | "location" | "prop";
export type AssetSource = "storyboard_variant" | "stitch_clip" | "sequence" | "beat";

export interface AssetItem {
  id: string;
  kind: AssetKind;
  url: string | null;
  title: string;
  subtitle: string | null;
  created_at: string;
  mentionable: boolean;
  ref_kind: "image" | "video" | null;
  favourite: boolean;
  project_id: string;
  project_title: string;
  source_kind: AssetSource | null;
  source_id: string | null;
  collections: string[];
}

export interface Collection {
  id: string;
  name: string;
  created_at: string;
  count: number;
}

export interface AssetsContext {
  /** The production currently open in the shell — not necessarily the asset's. */
  projectId: string;
  items: AssetItem[];
  collections: Collection[];
  reload: () => void;
  go: (ws: WorkspaceId) => void;
  toggleFavourite: (item: AssetItem) => void;
  /** Dialogs live in the workspace, because that is where they belong on
   *  screen; the inspector only asks for them. */
  pickReference: (item: AssetItem, to: "character" | "location") => void;
  pickCollection: (item: AssetItem) => void;
  pickProduction: (item: AssetItem) => void;
}

/* ------------------------------------------------------------------ store */

let ctx: AssetsContext | null = null;
const listeners = new Set<() => void>();

export function publishAssets(next: AssetsContext | null) {
  ctx = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function useAssets(): AssetsContext | null {
  return useSyncExternalStore(
    subscribe,
    () => ctx,
    () => null
  );
}

/* ------------------------------------------------------------------- body */

/** Everything the animate route wrote about how this was made. */
interface Recipe {
  kind: string;
  vendor_id: string | null;
  created_at: string;
  meta: Record<string, any>;
}

function AssetBody({ selected }: InspectorBodyProps) {
  const assets = useAssets();
  const { select } = useSelection();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const item = assets?.items.find((i) => i.kind === selected.kind && i.id === selected.id) ?? null;
  const itemId = item?.id;

  useEffect(() => {
    setError(null);
    setRecipe(null);
    if (!itemId) return;
    const controller = new AbortController();
    fetch(`/api/assets/${itemId}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => b?.asset && setRecipe(b.asset))
      .catch(() => {
        /* the recipe is extra detail; its absence is not an error state */
      });
    return () => controller.abort();
  }, [itemId]);

  if (!assets || !item) {
    return (
      <p className="asset-ins-gone">
        This asset is no longer on the canvas. Change the filter or reload Assets to bring it back.
      </p>
    );
  }

  const here = item.project_id === assets.projectId;
  const names = assets.collections.filter((c) => item.collections.includes(c.id));

  async function run(id: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(id);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message || "That did not work.");
    } finally {
      setBusy(null);
    }
  }

  /** A storyboard still becomes a shot; that is what animating one means here.
   *  The shot is created, not rendered — nothing is spent until the Dock's
   *  Generate is pressed with the estimate beside it. */
  const animate = () =>
    run("animate", async () => {
      const res = await fetch("/api/stitch/nodes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variant_id: item!.source_id })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "The shot could not be created.");
      assets!.go("stitch");
      select({ kind: "shot", id: body.node_id, label: item!.title, projectId: item!.project_id });
    });

  const addToCut = () =>
    run("cut", async () => {
      const res = await fetch(`/api/projects/${assets!.projectId}/assets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: item!.url, kind: "video", title: item!.title, as: "shot" })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "The clip could not be added to the cut.");
      assets!.reload();
      assets!.go("stitch");
      select({ kind: "shot", id: body.node_id, label: item!.title, projectId: assets!.projectId });
    });

  const openInCut = () => {
    assets.go("stitch");
    select({ kind: "shot", id: item.source_id!, label: item.title, projectId: item.project_id });
  };

  /** The Dock takes references by @-mention and already reads the selection,
   *  so this puts the cursor where the reference is attached rather than
   *  pretending to attach it somewhere the generator would never read. */
  const referenceInDock = () => {
    document.querySelector<HTMLTextAreaElement>(".dock textarea")?.focus();
  };

  return (
    <div className="asset-ins">
      <div className="asset-ins-media" data-kind={item.kind}>
        {item.url ? (
          <MediaTile url={item.url} kind={item.kind === "video" ? "video" : "image"} alt={item.title} className="asset-ins-img" />
        ) : (
          <span className="asset-ins-blank">No media</span>
        )}
      </div>

      <p className="asset-ins-title">{item.title}</p>
      <p className="asset-ins-line">
        <span>{item.kind === "video" ? "Clip" : "Frame"}</span>
        <span className="asset-ins-sep">·</span>
        <span>{item.project_title || "This production"}</span>
        <span className="asset-ins-sep">·</span>
        <span className="font-mono">{stamp(item.created_at)}</span>
      </p>

      <div className="asset-ins-acts">
        {item.kind === "image" ? (
          <>
            <Button size="sm" onClick={() => assets.pickReference(item, "character")}>
              Use as character reference
            </Button>
            <Button size="sm" onClick={() => assets.pickReference(item, "location")}>
              Use as location reference
            </Button>
            {item.source_kind === "storyboard_variant" && here && (
              <Button size="sm" intent="primary" onClick={animate} disabled={busy !== null}>
                {busy === "animate" ? "Adding…" : "Animate"}
              </Button>
            )}
            <Button size="sm" onClick={() => assets.pickProduction(item)}>
              Add to a production
            </Button>
          </>
        ) : (
          <>
            {item.source_kind === "stitch_clip" && here ? (
              <Button size="sm" intent="primary" onClick={openInCut}>
                Open in the cut
              </Button>
            ) : (
              <Button size="sm" intent="primary" onClick={addToCut} disabled={busy !== null}>
                {busy === "cut" ? "Adding…" : "Add to the cut"}
              </Button>
            )}
            <Button size="sm" onClick={referenceInDock}>
              Use as reference
            </Button>
            <Button size="sm" onClick={() => assets.pickProduction(item)}>
              Add to a production
            </Button>
          </>
        )}
        <Button size="sm" intent="ghost" onClick={() => assets.toggleFavourite(item)}>
          <Heart size={13} /> {item.favourite ? "Favourited" : "Favourite"}
        </Button>
      </div>

      {error && <InlineError message={error} className="asset-ins-error" />}

      <div className="asset-ins-block">
        <p className="asset-ins-label">Collections</p>
        <div className="asset-ins-sets">
          {names.map((c) => (
            <span key={c.id} className="asset-chip">
              {c.name}
            </span>
          ))}
          <button type="button" className="asset-ins-add" onClick={() => assets.pickCollection(item)}>
            <Plus size={11} /> {names.length ? "Change" : "Add to a collection"}
          </button>
        </div>
      </div>

      {/* Extracting a still is a local ffmpeg export — free, and only possible
          where the clip is a shot with a file on this machine. */}
      {item.kind === "video" && item.source_kind === "stitch_clip" && item.url && here && (
        <div className="asset-ins-block">
          <p className="asset-ins-label">Frame</p>
          <ClipFrameTools nodeId={item.source_id!} clipUrl={item.url} />
        </div>
      )}

      {recipe && <RecipeBlock recipe={recipe} />}
    </div>
  );
}

/** What made this, in the words the generator used. Mono, because these are
 *  model names, settings and numbers (brief §44). */
function RecipeBlock({ recipe }: { recipe: Recipe }) {
  const meta = recipe.meta ?? {};
  const rows: Array<[string, string]> = [];
  const provider = meta.provider ?? recipe.vendor_id;
  if (provider) rows.push(["Model", String(provider)]);
  const settings = meta.settings && typeof meta.settings === "object" ? meta.settings : null;
  if (settings) {
    for (const [k, v] of Object.entries(settings).slice(0, 8)) {
      if (v === null || v === undefined || typeof v === "object") continue;
      rows.push([k.replace(/_/g, " "), String(v)]);
    }
  }
  const actual = meta.actual && typeof meta.actual === "object" ? meta.actual : null;
  if (actual?.seconds) rows.push(["Took", `${Number(actual.seconds).toFixed(0)}s`]);
  if (actual?.costUsd) rows.push(["Cost", `$${Number(actual.costUsd).toFixed(2)}`]);
  if (meta.continuity) rows.push(["Continuity", String(meta.continuity)]);

  if (rows.length === 0) return null;

  return (
    <details className="asset-ins-recipe">
      <summary>Recipe</summary>
      <dl className="asset-recipe-list">
        {rows.map(([k, v]) => (
          <div key={k} className="asset-recipe-row">
            <dt>{k}</dt>
            <dd className="font-mono">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function stamp(iso: string): string {
  const t = new Date(iso.includes("Z") ? iso : iso + "Z").getTime();
  return Number.isFinite(t) ? new Date(t).toLocaleDateString() : "—";
}

registerInspector("image", AssetBody);
registerInspector("video", AssetBody);
