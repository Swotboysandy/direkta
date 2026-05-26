"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clapperboard, Folder, ImageIcon, KeyRound, ListChecks, Network, Plus, Settings, Workflow } from "lucide-react";
import { Canvas } from "./_components/Canvas";
import { AgentDock } from "./_components/AgentDock";
import { Inspector } from "./_components/Inspector";
import { ProjectPicker } from "./_components/ProjectPicker";
import type { AspectRatio, CanvasEdge, CanvasNode, NodeKind, Project } from "../lib/types";

const ASPECTS: { value: AspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9 landscape" },
  { value: "9:16", label: "9:16 portrait" },
  { value: "1:1", label: "1:1 square" },
  { value: "4:5", label: "4:5 social" },
  { value: "21:9", label: "21:9 ultrawide" }
];

const SIDEBAR_ACTIONS: {
  label: string;
  hint: string;
  icon: typeof Folder;
  kind?: NodeKind;
  href?: string;
}[] = [
  { label: "Projects", hint: "Switch or create", icon: Folder },
  { label: "Script Lab", hint: "Add story beat", icon: ListChecks, kind: "script" },
  { label: "Assets", hint: "Add scene node", icon: ImageIcon, kind: "scene" },
  { label: "Node Board", hint: "Canvas view", icon: Network },
  { label: "Timeline", hint: "Add render node", icon: Clapperboard, kind: "render" },
  { label: "Model Keys", hint: "API routing", icon: KeyRound, href: "/settings" }
];

const LAST_PROJECT_KEY = "direkta:last-project";

export default function Home() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [vendorReady, setVendorReady] = useState<boolean | null>(null);
  const [imageVendorReady, setImageVendorReady] = useState(false);
  const [videoVendorReady, setVideoVendorReady] = useState(false);

  const pendingMoves = useRef<Map<string, { x: number; y: number }>>(new Map());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve initial project id from URL or localStorage or first available.
  useEffect(() => {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("p");
    const fromStorage = typeof localStorage !== "undefined" ? localStorage.getItem(LAST_PROJECT_KEY) : null;
    const target = fromUrl ?? fromStorage;

    (async () => {
      if (target) {
        const response = await fetch(`/api/projects/${target}`);
        if (response.ok) {
          setProjectId(target);
          return;
        }
      }
      const list = await fetch("/api/projects").then((r) => r.json());
      const first = (list.projects as Project[])[0];
      if (first) setProjectId(first.id);
    })();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("p", projectId);
    window.history.replaceState(null, "", url.toString());
    localStorage.setItem(LAST_PROJECT_KEY, projectId);
  }, [projectId]);

  const reload = useCallback(async () => {
    if (!projectId) return;
    const response = await fetch(`/api/projects/${projectId}`);
    if (!response.ok) return;
    const data = await response.json();
    setProject(data.project);
    setNodes(data.nodes);
    setEdges(data.edges);
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    fetch("/api/vendors")
      .then((response) => response.json())
      .then((data: { vendors: { enabled: boolean; api_key: string; kind: string }[] }) => {
        const has = (kind: string) =>
          data.vendors.some((vendor) => vendor.kind === kind && vendor.enabled && vendor.api_key);
        setVendorReady(has("text"));
        setImageVendorReady(has("image"));
        setVideoVendorReady(has("video"));
      })
      .catch(() => setVendorReady(false));
  }, []);

  useEffect(() => {
    const onReload = () => reload();
    window.addEventListener("zinema:reload", onReload);
    return () => window.removeEventListener("zinema:reload", onReload);
  }, [reload]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      if (event.key === "Escape") {
        setSelectedId(null);
      } else if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const flushMoves = useCallback(() => {
    const moves = Array.from(pendingMoves.current.entries());
    pendingMoves.current.clear();
    moves.forEach(([id, position]) => {
      fetch(`/api/nodes/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(position)
      }).catch(() => {});
    });
  }, []);

  const handleMove = useCallback(
    (id: string, x: number, y: number) => {
      setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, x, y } : node)));
      pendingMoves.current.set(id, { x, y });
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(flushMoves, 280);
    },
    [flushMoves]
  );

  async function setAspect(aspect_ratio: AspectRatio) {
    if (!projectId) return;
    setProject((prev) => (prev ? { ...prev, aspect_ratio } : prev));
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ aspect_ratio })
    });
  }

  async function patchProject(patch: { title?: string; premise?: string }) {
    if (!projectId) return;
    setProject((prev) => (prev ? { ...prev, ...patch } : prev));
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    });
  }

  async function patchNode(id: string, patch: { title?: string; body?: string }) {
    setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, ...patch } : node)));
    await fetch(`/api/nodes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    });
  }

  async function deleteNode(id: string) {
    await fetch(`/api/nodes/${id}`, { method: "DELETE" });
    setSelectedId((current) => (current === id ? null : current));
    reload();
  }

  async function deleteSelected() {
    if (!selectedId) return;
    const target = nodes.find((node) => node.id === selectedId);
    if (!target) return;
    if (!confirm(`Delete "${target.title}"?`)) return;
    await deleteNode(selectedId);
  }

  async function addNode(kind: NodeKind) {
    if (!projectId) return;
    const offsetX = 80 + (nodes.length % 4) * 280;
    const offsetY = 80 + Math.floor(nodes.length / 4) * 200;
    const response = await fetch("/api/nodes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        kind,
        title: defaultTitleFor(kind),
        body: "",
        x: offsetX,
        y: offsetY
      })
    });
    const data = await response.json();
    if (data.node) {
      setSelectedId(data.node.id);
      reload();
    }
  }

  async function connect(sourceId: string, targetId: string) {
    const response = await fetch("/api/edges", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: sourceId, target: targetId })
    });
    if (response.ok) reload();
  }

  async function deleteEdge(id: string) {
    await fetch(`/api/edges/${id}`, { method: "DELETE" });
    setEdges((prev) => prev.filter((edge) => edge.id !== id));
  }

  async function generateImage(nodeId: string) {
    const response = await fetch(`/api/nodes/${nodeId}/image`, { method: "POST" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? "Image generation failed");
    }
    await reload();
  }

  async function generateVideo(nodeId: string) {
    const response = await fetch(`/api/nodes/${nodeId}/video`, { method: "POST" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? "Video generation failed");
    }
    await reload();
  }

  async function createProject(input: { title: string; premise: string; aspect_ratio: AspectRatio }) {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
    const data = await response.json();
    if (data.project) setProjectId(data.project.id);
  }

  async function deleteProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (id === projectId) {
      const list = await fetch("/api/projects").then((r) => r.json());
      const first = (list.projects as Project[])[0];
      setProjectId(first ? first.id : null);
    }
  }

  const selected = nodes.find((node) => node.id === selectedId) ?? null;

  return (
    <main className="workbench">
      <StudioSidebar
        project={project}
        onClearSelection={() => setSelectedId(null)}
        onAddNode={(kind) => {
          void addNode(kind);
        }}
      />

      <section className="studio-main">
        <header className="topbar">
          <div className="project-title">
            <span>Direkta Studio</span>
            <ProjectPicker
              current={project}
              onSwitch={(id) => setProjectId(id)}
              onCreate={createProject}
              onDelete={deleteProject}
            />
          </div>
          <div className="topbar-right">
            {project && (
              <label className="aspect-picker">
                Aspect
                <select
                  value={project.aspect_ratio}
                  onChange={(event) => setAspect(event.target.value as AspectRatio)}
                >
                  {ASPECTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Link href="/settings" className="topbar-link">
              <Settings size={16} /> Settings
            </Link>
          </div>
        </header>

        {vendorReady === false && (
          <div className="banner">
            Add a text API key in <Link href="/settings">Settings</Link> before running the agent.
          </div>
        )}

        <div className="workbench-grid">
          <Canvas
            nodes={nodes}
            edges={edges}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMoveNode={handleMove}
            onConnect={connect}
            onDeleteEdge={deleteEdge}
          />

          <Inspector
            project={project}
            selected={selected}
            imageVendorReady={imageVendorReady}
            videoVendorReady={videoVendorReady}
            onProjectPatch={patchProject}
            onNodePatch={patchNode}
            onNodeDelete={deleteNode}
            onNodeAdd={addNode}
            onGenerateImage={generateImage}
            onGenerateVideo={generateVideo}
          />

          <AgentDock projectId={projectId ?? ""} onNodeProduced={reload} />
        </div>
      </section>
    </main>
  );
}

function StudioSidebar({
  project,
  onClearSelection,
  onAddNode
}: {
  project: Project | null;
  onClearSelection: () => void;
  onAddNode: (kind: NodeKind) => void;
}) {
  return (
    <aside className="studio-sidebar">
      <div className="sidebar-brand">
        <span>
          <Workflow size={18} />
        </span>
        <strong>Direkta</strong>
      </div>

      <button className="sidebar-create" onClick={() => onAddNode("script")}>
        <Plus size={16} />
        New beat
      </button>

      <nav className="sidebar-nav" aria-label="Direkta workspace">
        {SIDEBAR_ACTIONS.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <Icon size={18} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
            </>
          );

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className="sidebar-link">
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => (item.kind ? onAddNode(item.kind) : onClearSelection())}
              className={item.label === "Node Board" ? "active" : undefined}
            >
              {content}
            </button>
          );
        })}
      </nav>

      <section className="sidebar-film">
        <span>Current film</span>
        <strong>{project?.title ?? "Loading project"}</strong>
        <small>{project?.aspect_ratio ?? "16:9"} workspace</small>
      </section>
    </aside>
  );
}

function defaultTitleFor(kind: NodeKind): string {
  switch (kind) {
    case "script":
      return "New script beat";
    case "character":
      return "New character";
    case "scene":
      return "New scene";
    case "storyboard":
      return "New storyboard";
    case "shot":
      return "New shot";
    case "music":
      return "New music cue";
    case "render":
      return "New render";
    case "note":
      return "Note";
  }
}
