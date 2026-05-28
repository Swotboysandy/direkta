"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clapperboard,
  FileText,
  Folder,
  ImageIcon,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Network,
  Plus,
  Settings,
  Sparkles,
  Workflow,
  type LucideIcon
} from "lucide-react";
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

type SidebarAction = {
  label: string;
  hint: string;
  icon: LucideIcon;
  kind?: NodeKind;
  href?: string;
};

const SIDEBAR_GROUPS: { title: string; items: SidebarAction[] }[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", hint: "Project overview", icon: LayoutDashboard },
      { label: "Projects", hint: "Switch or create", icon: Folder },
      { label: "Node Board", hint: "Canvas view", icon: Network }
    ]
  },
  {
    title: "Create",
    items: [
      { label: "Script", hint: "Add story beat", icon: ListChecks, kind: "script" },
      { label: "Visual", hint: "Add scene node", icon: ImageIcon, kind: "scene" },
      { label: "Timeline", hint: "Add render node", icon: Clapperboard, kind: "render" }
    ]
  },
  {
    title: "System",
    items: [{ label: "Model Keys", hint: "API routing", icon: KeyRound, href: "/settings" }]
  }
];

const STUDIO_STEPS: { kind: NodeKind; label: string }[] = [
  { kind: "script", label: "Script" },
  { kind: "scene", label: "Scene" },
  { kind: "storyboard", label: "Board" },
  { kind: "render", label: "Render" }
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
        nodes={nodes}
        vendorReady={vendorReady}
        imageVendorReady={imageVendorReady}
        videoVendorReady={videoVendorReady}
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
            {vendorReady === false && (
              <Link href="/settings" className="topbar-warning">
                Text key missing
              </Link>
            )}
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

        <div className="workbench-grid">
          <section className="canvas-column">
            <DashboardStrip
              project={project}
              nodes={nodes}
              edges={edges}
              vendorReady={vendorReady}
              imageVendorReady={imageVendorReady}
              videoVendorReady={videoVendorReady}
              onAddNode={(kind) => {
                void addNode(kind);
              }}
            />
            <div className="canvas-card">
              <Canvas
                nodes={nodes}
                edges={edges}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMoveNode={handleMove}
                onConnect={connect}
                onDeleteEdge={deleteEdge}
              />
            </div>
          </section>

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
  nodes,
  vendorReady,
  imageVendorReady,
  videoVendorReady,
  onClearSelection,
  onAddNode
}: {
  project: Project | null;
  nodes: CanvasNode[];
  vendorReady: boolean | null;
  imageVendorReady: boolean;
  videoVendorReady: boolean;
  onClearSelection: () => void;
  onAddNode: (kind: NodeKind) => void;
}) {
  const completedSteps = STUDIO_STEPS.filter((step) => nodes.some((node) => node.kind === step.kind)).length;
  const progress = Math.round((completedSteps / STUDIO_STEPS.length) * 100);

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
        {SIDEBAR_GROUPS.map((group) => (
          <div className="sidebar-group" key={group.title}>
            <span className="sidebar-kicker">{group.title}</span>
            {group.items.map((item) => {
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
          </div>
        ))}
      </nav>

      <section className="sidebar-film">
        <span>Current film</span>
        <strong>{project?.title ?? "Loading project"}</strong>
        <small>{project?.aspect_ratio ?? "16:9"} workspace</small>
        <div className="sidebar-progress" aria-label={`${progress}% project coverage`}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="sidebar-status">
          <StatusDot active={Boolean(vendorReady)} label="Text" />
          <StatusDot active={Boolean(imageVendorReady || videoVendorReady)} label="Media" />
        </div>
      </section>
    </aside>
  );
}

function DashboardStrip({
  project,
  nodes,
  edges,
  vendorReady,
  imageVendorReady,
  videoVendorReady,
  onAddNode
}: {
  project: Project | null;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  vendorReady: boolean | null;
  imageVendorReady: boolean;
  videoVendorReady: boolean;
  onAddNode: (kind: NodeKind) => void;
}) {
  const scriptCount = countKind(nodes, "script");
  const shotCount = countKind(nodes, "shot") + countKind(nodes, "storyboard");
  const renderCount = countKind(nodes, "render");
  const readyModels = [vendorReady, imageVendorReady, videoVendorReady].filter(Boolean).length;

  return (
    <section className="dashboard-strip" aria-label="Project dashboard">
      <div className="dashboard-summary">
        <span>Active production</span>
        <strong>{project?.title ?? "Loading project"}</strong>
        <small>{project?.premise || "Build a script, connect shots, then render from the board."}</small>
      </div>

      <div className="dashboard-metrics">
        <MetricCard label="Script" value={scriptCount || "0"} detail="beats" icon={FileText} />
        <MetricCard label="Shots" value={shotCount || "0"} detail="boards" icon={Clapperboard} />
        <MetricCard label="Links" value={edges.length || "0"} detail="edges" icon={Network} />
        <MetricCard label="Models" value={`${readyModels}/3`} detail="ready" icon={Sparkles} />
      </div>

      <div className="dashboard-actions" aria-label="Quick actions">
        <button onClick={() => onAddNode("script")}>
          <Plus size={14} />
          Script
        </button>
        <button onClick={() => onAddNode("storyboard")}>
          <Plus size={14} />
          Board
        </button>
        <button onClick={() => onAddNode(renderCount ? "shot" : "render")}>
          <Plus size={14} />
          {renderCount ? "Shot" : "Render"}
        </button>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="metric-card">
      <Icon size={16} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
  const Icon = active ? CheckCircle2 : Circle;
  return (
    <span className={active ? "is-ready" : undefined}>
      <Icon size={13} />
      {label}
    </span>
  );
}

function countKind(nodes: CanvasNode[], kind: NodeKind) {
  return nodes.filter((node) => node.kind === kind).length;
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
