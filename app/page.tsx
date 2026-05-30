"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TopNav } from "./_components/TopNav";
import { Sidebar } from "./_components/Sidebar";
import { NewProjectModal } from "./_components/NewProjectModal";
import { CoDirectorOverlay } from "./_components/CoDirectorOverlay";
import { CommandPalette } from "./_components/CommandPalette";
import { KeyVaultPanel } from "./_components/KeyVaultPanel";
import { Dashboard } from "./_workspaces/Dashboard";
import { Screenplay } from "./_workspaces/Screenplay";
import { Casting } from "./_workspaces/Casting";
import { Storyboard } from "./_workspaces/Storyboard";
import { Stitch } from "./_workspaces/Stitch";
import { Library } from "./_workspaces/Library";
import { Export as ExportWorkspace } from "./_workspaces/Export";
import type {
  ActivityItem,
  AgentStatus,
  AspectRatio,
  Beat,
  Bible,
  Character,
  LengthEstimate,
  Location,
  Project,
  ProjectFormat,
  WorkspaceId,
  WorkspaceMeta
} from "../lib/types";

interface ProjectBundle {
  project: Project;
  bible: Bible;
  beats: Beat[];
  characters: Character[];
  locations: Location[];
  activity: ActivityItem[];
}

const LAST_PROJECT_KEY = "direkta:last-project";
const SIDEBAR_KEY = "direkta:sidebar-collapsed";

const DEFAULT_AGENTS: AgentStatus[] = [
  { id: "script-reader", name: "Script Reader", state: "idle" },
  { id: "beat-writer", name: "Beat Writer", state: "idle" },
  { id: "bible-builder", name: "Bible Builder", state: "idle" },
  { id: "casting-dir", name: "Casting Director", state: "idle" },
  { id: "cinematographer", name: "Cinematographer", state: "idle" },
  { id: "continuity", name: "Continuity Checker", state: "idle" },
  { id: "editor", name: "Editor", state: "idle" },
  { id: "video-director", name: "Video Director", state: "idle" },
  { id: "export-agent", name: "Export Agent", state: "idle" }
];

export default function Home() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bundle, setBundle] = useState<ProjectBundle | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>(DEFAULT_AGENTS);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [keyVaultOpen, setKeyVaultOpen] = useState(false);

  // Initial URL + storage resolution
  useEffect(() => {
    const url = new URL(window.location.href);
    const fromUrlProject = url.searchParams.get("p");
    const fromUrlWs = url.searchParams.get("ws") as WorkspaceId | null;
    const fromStorage =
      typeof localStorage !== "undefined" ? localStorage.getItem(LAST_PROJECT_KEY) : null;
    const collapsed =
      typeof localStorage !== "undefined" ? localStorage.getItem(SIDEBAR_KEY) === "1" : false;
    setSidebarCollapsed(collapsed);

    if (fromUrlWs) setActiveWorkspace(fromUrlWs);

    (async () => {
      const list = await fetch("/api/projects").then((r) => r.json());
      const all = list.projects as Project[];
      setProjects(all);
      const target = fromUrlProject ?? fromStorage ?? all[0]?.id ?? null;
      if (target) setProjectId(target);
      else setNewProjectOpen(true);
    })();
  }, []);

  // Sync URL + localStorage when state changes
  useEffect(() => {
    if (!projectId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("p", projectId);
    url.searchParams.set("ws", activeWorkspace);
    window.history.replaceState(null, "", url.toString());
    localStorage.setItem(LAST_PROJECT_KEY, projectId);
  }, [projectId, activeWorkspace]);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "1" : "0");
    }
  }, [sidebarCollapsed]);

  const reload = useCallback(async () => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) return;
    const data = (await res.json()) as ProjectBundle;
    setBundle(data);
    const agentsRes = await fetch(`/api/projects/${projectId}/agents`);
    if (agentsRes.ok) {
      const agentsData = await agentsRes.json();
      setAgents(agentsData.agents);
    }
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const reloadProjects = useCallback(async () => {
    const list = await fetch("/api/projects").then((r) => r.json());
    setProjects(list.projects as Project[]);
  }, []);

  // Compute workspace meta — locks intentionally disabled during development
  // so every workspace is reachable. Restore lockReason fields when V1 ships.
  const workspaces = useMemo<WorkspaceMeta[]>(() => {
    if (!bundle) {
      return [
        { id: "dashboard", label: "Dashboard", status: "idle", unlocked: true },
        { id: "screenplay", label: "Screenplay", status: "idle", unlocked: true },
        { id: "casting", label: "Casting", status: "idle", unlocked: true },
        { id: "storyboard", label: "Storyboard", status: "idle", unlocked: true },
        { id: "stitch", label: "Stitch", status: "idle", unlocked: true },
        { id: "library", label: "Library", status: "idle", unlocked: true },
        { id: "export", label: "Export", status: "idle", unlocked: true }
      ];
    }
    const submitted = bundle.project.script_submitted;
    const beatsDone = bundle.beats.length > 0;
    const anyTrained = bundle.characters.some((c) => c.soul_id_state === "trained");
    const trainedCount = bundle.characters.filter((c) => c.soul_id_state === "trained").length;

    return [
      { id: "dashboard", label: "Dashboard", status: "idle", unlocked: true },
      {
        id: "screenplay",
        label: "Screenplay",
        status: submitted ? (beatsDone ? "complete" : "in-progress") : "idle",
        unlocked: true,
        note: submitted ? `${bundle.beats.length} beats` : undefined
      },
      {
        id: "casting",
        label: "Casting",
        status:
          bundle.characters.length === 0
            ? "idle"
            : anyTrained && trainedCount === bundle.characters.length
            ? "complete"
            : "in-progress",
        unlocked: true,
        note:
          bundle.characters.length > 0
            ? `${trainedCount} / ${bundle.characters.length} soul ids`
            : undefined
      },
      {
        id: "storyboard",
        label: "Storyboard",
        status: "in-progress",
        unlocked: true,
        note: "v1.2 grid pending"
      },
      {
        id: "stitch",
        label: "Stitch",
        status: "in-progress",
        unlocked: true,
        note: "v1.2 canvas pending"
      },
      {
        id: "library",
        label: "Library",
        status: "idle",
        unlocked: true
      },
      {
        id: "export",
        label: "Export",
        status: "idle",
        unlocked: true
      }
    ];
  }, [bundle]);

  const switchWorkspace = useCallback(
    (ws: WorkspaceId) => {
      const target = workspaces.find((w) => w.id === ws);
      if (target && !target.unlocked) return;
      setActiveWorkspace(ws);
    },
    [workspaces]
  );

  const createProject = useCallback(
    async (input: {
      title: string;
      logline: string;
      format: ProjectFormat;
      length_estimate: LengthEstimate;
      aspect_ratio: AspectRatio;
    }) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input)
      });
      const data = await res.json();
      if (data.project) {
        await reloadProjects();
        setProjectId(data.project.id);
        setActiveWorkspace("dashboard");
        setNewProjectOpen(false);
      }
    },
    [reloadProjects]
  );

  return (
    <div className="workbench">
      <TopNav
        project={bundle?.project ?? null}
        projects={projects}
        activeProjectId={projectId}
        sidebarCollapsed={sidebarCollapsed}
        agents={agents}
        keyVaultOpen={keyVaultOpen}
        onSwitchProject={(id) => {
          setProjectId(id);
          setActiveWorkspace("dashboard");
        }}
        onNewProject={() => setNewProjectOpen(true)}
        onSwitchWorkspace={switchWorkspace}
        onOpenKeyVault={() => setKeyVaultOpen(true)}
      />

      <div className="app-body" data-collapsed={sidebarCollapsed}>
        <Sidebar
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          onSwitchWorkspace={switchWorkspace}
        />

        <main className="main">
          {!bundle ? (
            <div className="main-inner">
              <div className="card" style={{ borderStyle: "dashed" }}>
                <div className="eb">PRODUCER</div>
                <h2
                  style={{
                    fontFamily: "var(--f-display)",
                    fontSize: 32,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                    color: "var(--bone)",
                    marginTop: 8
                  }}
                >
                  No project loaded
                </h2>
                <p style={{ color: "var(--ink-70)", marginTop: 10 }}>
                  Start a project to bring the production pipeline online.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 14 }}
                  onClick={() => setNewProjectOpen(true)}
                >
                  New project
                </button>
              </div>
            </div>
          ) : activeWorkspace === "dashboard" ? (
            <Dashboard
              project={bundle.project}
              workspaces={workspaces}
              activity={bundle.activity}
              onSwitchWorkspace={switchWorkspace}
            />
          ) : activeWorkspace === "screenplay" ? (
            <Screenplay
              project={bundle.project}
              beats={bundle.beats}
              bible={bundle.bible}
              characters={bundle.characters}
              locations={bundle.locations}
              onSwitchWorkspace={switchWorkspace}
              onScriptSubmitted={reload}
              onReload={reload}
            />
          ) : activeWorkspace === "casting" ? (
            <Casting
              project={bundle.project}
              characters={bundle.characters}
              locations={bundle.locations}
              onSwitchWorkspace={switchWorkspace}
              onReload={reload}
            />
          ) : activeWorkspace === "storyboard" ? (
            <Storyboard project={bundle.project} onSwitchWorkspace={switchWorkspace} />
          ) : activeWorkspace === "stitch" ? (
            <Stitch project={bundle.project} onSwitchWorkspace={switchWorkspace} />
          ) : activeWorkspace === "library" ? (
            <Library project={bundle.project} onSwitchWorkspace={switchWorkspace} />
          ) : (
            <ExportWorkspace project={bundle.project} onSwitchWorkspace={switchWorkspace} />
          )}
        </main>
      </div>

      <KeyVaultPanel open={keyVaultOpen} onClose={() => setKeyVaultOpen(false)} />

      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreate={createProject}
      />

      <CoDirectorOverlay
        project={bundle?.project ?? null}
        onSwitchWorkspace={switchWorkspace}
        onOpenKeyVault={() => setKeyVaultOpen(true)}
      />

      <CommandPalette
        project={bundle?.project ?? null}
        projects={projects}
        activeProjectId={projectId}
        onSwitchWorkspace={switchWorkspace}
        onSwitchProject={(id) => {
          setProjectId(id);
          setActiveWorkspace("dashboard");
        }}
        onNewProject={() => setNewProjectOpen(true)}
        onOpenKeyVault={() => setKeyVaultOpen(true)}
      />
    </div>
  );
}
