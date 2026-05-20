"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Film, Plus, Settings, Trash2, Wand2 } from "lucide-react";
import type { Asset, CanvasNode, NodeKind, Project } from "../../lib/types";

const NODE_KINDS: { value: NodeKind; label: string }[] = [
  { value: "script", label: "Script" },
  { value: "character", label: "Character" },
  { value: "scene", label: "Scene" },
  { value: "storyboard", label: "Storyboard" },
  { value: "shot", label: "Shot" },
  { value: "music", label: "Music" },
  { value: "render", label: "Render" },
  { value: "note", label: "Note" }
];

const VISUAL_KINDS = new Set<NodeKind>(["character", "scene", "storyboard", "shot"]);
const VIDEO_KINDS = new Set<NodeKind>(["shot", "storyboard"]);

interface Props {
  project: Project | null;
  selected: CanvasNode | null;
  imageVendorReady: boolean;
  videoVendorReady: boolean;
  onProjectPatch: (patch: { title?: string; premise?: string }) => Promise<void>;
  onNodePatch: (id: string, patch: { title?: string; body?: string }) => Promise<void>;
  onNodeDelete: (id: string) => Promise<void>;
  onNodeAdd: (kind: NodeKind) => Promise<void>;
  onGenerateImage: (nodeId: string) => Promise<void>;
  onGenerateVideo: (nodeId: string) => Promise<void>;
}

export function Inspector({
  project,
  selected,
  imageVendorReady,
  videoVendorReady,
  onProjectPatch,
  onNodePatch,
  onNodeDelete,
  onNodeAdd,
  onGenerateImage,
  onGenerateVideo
}: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [busy, setBusy] = useState<null | "image" | "video">(null);
  const [error, setError] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    if (!selected) {
      setAssets([]);
      return;
    }
    const response = await fetch(`/api/nodes/${selected.id}/assets`);
    if (!response.ok) return;
    const data = await response.json();
    setAssets(data.assets);
  }, [selected]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  if (selected) {
    return (
      <NodePanel
        node={selected}
        project={project}
        assets={assets}
        busy={busy}
        error={error}
        canImage={imageVendorReady && VISUAL_KINDS.has(selected.kind)}
        canVideo={videoVendorReady && VIDEO_KINDS.has(selected.kind)}
        onNodePatch={onNodePatch}
        onNodeDelete={onNodeDelete}
        onGenerateImage={async (id) => {
          setBusy("image");
          setError(null);
          try {
            await onGenerateImage(id);
            await loadAssets();
          } catch (err: any) {
            setError(err.message ?? String(err));
          } finally {
            setBusy(null);
          }
        }}
        onGenerateVideo={async (id) => {
          setBusy("video");
          setError(null);
          try {
            await onGenerateVideo(id);
            await loadAssets();
          } catch (err: any) {
            setError(err.message ?? String(err));
          } finally {
            setBusy(null);
          }
        }}
      />
    );
  }

  return (
    <ProjectPanel
      project={project}
      onProjectPatch={onProjectPatch}
      onNodeAdd={onNodeAdd}
    />
  );
}

function ProjectPanel({
  project,
  onProjectPatch,
  onNodeAdd
}: {
  project: Project | null;
  onProjectPatch: (patch: { title?: string; premise?: string }) => Promise<void>;
  onNodeAdd: (kind: NodeKind) => Promise<void>;
}) {
  return (
    <aside className="inspector">
      <div className="inspector-empty">
        <header className="inspector-section-head">
          <Settings size={16} />
          <strong>Project</strong>
        </header>
        {project ? (
          <>
            <DebouncedInput
              key={`title-${project.id}`}
              label="Title"
              value={project.title}
              onCommit={(value) => onProjectPatch({ title: value })}
            />
            <DebouncedTextarea
              key={`premise-${project.id}`}
              label="Premise"
              value={project.premise}
              rows={4}
              onCommit={(value) => onProjectPatch({ premise: value })}
            />
            <p className="muted-tiny">Format: {project.aspect_ratio}</p>
          </>
        ) : (
          <p>Loading…</p>
        )}

        <header className="inspector-section-head" style={{ marginTop: 22 }}>
          <Plus size={16} />
          <strong>Add node</strong>
        </header>
        <div className="add-node-grid">
          {NODE_KINDS.map((kind) => (
            <button key={kind.value} onClick={() => onNodeAdd(kind.value)}>
              {kind.label}
            </button>
          ))}
        </div>

        <p className="muted-tiny">
          Tip: drag from the dot at a node&rsquo;s bottom to another node&rsquo;s top to connect them. Click a connection
          line to delete it. Del removes the selected node.
        </p>
      </div>
    </aside>
  );
}

function NodePanel({
  node,
  project,
  assets,
  busy,
  error,
  canImage,
  canVideo,
  onNodePatch,
  onNodeDelete,
  onGenerateImage,
  onGenerateVideo
}: {
  node: CanvasNode;
  project: Project | null;
  assets: Asset[];
  busy: null | "image" | "video";
  error: string | null;
  canImage: boolean;
  canVideo: boolean;
  onNodePatch: (id: string, patch: { title?: string; body?: string }) => Promise<void>;
  onNodeDelete: (id: string) => Promise<void>;
  onGenerateImage: (id: string) => Promise<void>;
  onGenerateVideo: (id: string) => Promise<void>;
}) {
  const latestImage = assets.find((asset) => asset.kind === "image");
  const latestVideo = assets.find((asset) => asset.kind === "video");
  const heroImage = latestImage?.url ?? (typeof node.meta?.image === "string" ? (node.meta.image as string) : null);

  return (
    <aside className="inspector">
      <header className="inspector-header">
        <span className="node-kind">{node.kind}</span>
      </header>

      <DebouncedInput
        key={`title-${node.id}`}
        label="Title"
        value={node.title}
        onCommit={(value) => onNodePatch(node.id, { title: value })}
        big
      />

      {latestVideo ? (
        <div className={clsx("inspector-image", `aspect-${project?.aspect_ratio.replace(":", "-")}`)}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={latestVideo.url} controls preload="metadata" />
        </div>
      ) : heroImage ? (
        <div className={clsx("inspector-image", `aspect-${project?.aspect_ratio.replace(":", "-")}`)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt={node.title} />
        </div>
      ) : null}

      <DebouncedTextarea
        key={`body-${node.id}`}
        label="Body"
        value={node.body}
        rows={10}
        onCommit={(value) => onNodePatch(node.id, { body: value })}
      />

      <div className="inspector-actions">
        {canImage && (
          <button
            className="primary"
            disabled={busy !== null}
            onClick={() => onGenerateImage(node.id)}
          >
            <Wand2 size={14} />
            {busy === "image" ? "Generating…" : heroImage ? "Regenerate image" : "Generate image"}
          </button>
        )}
        {canVideo && (
          <button
            className="primary"
            disabled={busy !== null}
            onClick={() => onGenerateVideo(node.id)}
          >
            <Film size={14} />
            {busy === "video" ? "Rendering…" : latestVideo ? "Regenerate video" : "Generate video"}
          </button>
        )}
        {!canImage && VISUAL_KINDS_KEYS.includes(node.kind) && (
          <p className="muted-tiny">Enable an image vendor in Settings to generate frames for this node.</p>
        )}
        {!canVideo && VIDEO_KINDS_KEYS.includes(node.kind) && (
          <p className="muted-tiny">Enable a video vendor with an API key to generate motion for this node.</p>
        )}
        <button
          onClick={async () => {
            if (!confirm(`Delete "${node.title}"?`)) return;
            await onNodeDelete(node.id);
          }}
        >
          <Trash2 size={14} /> Delete node
        </button>
      </div>

      {error && <div className="inspector-error">{error}</div>}

      {assets.length > 1 && (
        <>
          <header className="inspector-section-head" style={{ marginTop: 22 }}>
            <strong>History</strong>
            <span>{assets.length}</span>
          </header>
          <div className="asset-history">
            {assets.map((asset) => (
              <div key={asset.id} className="asset-card">
                {asset.kind === "video" ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={asset.url} muted preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.url} alt="variant" />
                )}
                <footer>
                  <small>{new Date(asset.created_at + "Z").toLocaleString()}</small>
                  <button
                    title="Delete variant"
                    onClick={async () => {
                      if (!confirm("Delete this variant?")) return;
                      await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
                      window.dispatchEvent(new CustomEvent("zinema:reload"));
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </footer>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}

const VISUAL_KINDS_KEYS: NodeKind[] = ["character", "scene", "storyboard", "shot"];
const VIDEO_KINDS_KEYS: NodeKind[] = ["shot", "storyboard"];

function DebouncedInput({
  label,
  value,
  onCommit,
  big = false
}: {
  label: string;
  value: string;
  onCommit: (value: string) => Promise<void> | void;
  big?: boolean;
}) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setLocal(value), [value]);

  return (
    <label className={clsx("debounced-field", big && "big")}>
      <span>{label}</span>
      <input
        value={local}
        onChange={(event) => {
          const next = event.target.value;
          setLocal(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => onCommit(next), 380);
        }}
        onBlur={() => {
          if (timer.current) clearTimeout(timer.current);
          if (local !== value) onCommit(local);
        }}
      />
    </label>
  );
}

function DebouncedTextarea({
  label,
  value,
  rows,
  onCommit
}: {
  label: string;
  value: string;
  rows: number;
  onCommit: (value: string) => Promise<void> | void;
}) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setLocal(value), [value]);

  return (
    <label className="debounced-field">
      <span>{label}</span>
      <textarea
        rows={rows}
        value={local}
        onChange={(event) => {
          const next = event.target.value;
          setLocal(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => onCommit(next), 480);
        }}
        onBlur={() => {
          if (timer.current) clearTimeout(timer.current);
          if (local !== value) onCommit(local);
        }}
      />
    </label>
  );
}
