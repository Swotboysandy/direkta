"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TopBar } from "./_components/TopBar";
import { Rail } from "./_components/Rail";
import { AgentPanel } from "./_components/AgentPanel";
import { SkeletonWorkspace, ErrorState } from "./_components/AsyncStates";
import { Composer, type ComposerSubmission } from "./_components/Composer";
import { NewProjectModal } from "./_components/NewProjectModal";
import { MovieBibleModal } from "./_components/MovieBibleModal";
import { CoDirectorOverlay } from "./_components/CoDirectorOverlay";
import { CommandPalette } from "./_components/CommandPalette";
import { KeyVaultPanel } from "./_components/KeyVaultPanel";
import { SkillsPanel } from "./_components/SkillsPanel";
import dynamic from "next/dynamic";
import { Dashboard } from "./_workspaces/Dashboard";
import { Screenplay } from "./_workspaces/Screenplay";
import { Casting } from "./_workspaces/Casting";
// Conditionally-rendered workspaces are code-split so their weight (React Flow
// in Stitch especially) stays out of the initial bundle and loads on first open.
const wsLoading = () => <SkeletonWorkspace />;
const Storyboard = dynamic(() => import("./_workspaces/Storyboard").then((m) => ({ default: m.Storyboard })), { ssr: false, loading: wsLoading });
const Stitch = dynamic(() => import("./_workspaces/Stitch").then((m) => ({ default: m.Stitch })), { ssr: false, loading: wsLoading });
const Library = dynamic(() => import("./_workspaces/Library").then((m) => ({ default: m.Library })), { ssr: false, loading: wsLoading });
const ExportWorkspace = dynamic(() => import("./_workspaces/Export").then((m) => ({ default: m.Export })), { ssr: false, loading: wsLoading });
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
  Prop,
  WorkspaceId,
  WorkspaceMeta
} from "../lib/types";

interface ProjectBundle {
  project: Project;
  bible: Bible;
  beats: Beat[];
  characters: Character[];
  locations: Location[];
  props: Prop[];
  activity: ActivityItem[];
}

const LAST_PROJECT_KEY = "fylmer:last-project";

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
  // One search box on screen: the bar owns the field, the canvas reads it.
  const [query, setQuery] = useState("");
  const [agentOpen, setAgentOpen] = useState(false);
  // Set when a suggestion is taken from the agent; the composer consumes it
  // and clears it, so pressing the same card twice loads it again.
  const [composerSeed, setComposerSeed] = useState<string | null>(null);
  // Distinguishes "still loading" from "no project" and "load failed" —
  // a null bundle alone cannot tell those apart, and claiming a project is
  // missing while it is in flight is the worst of the three to get wrong.
  const [bundleState, setBundleState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>(DEFAULT_AGENTS);
  // Pipeline gate data — how far production has actually progressed.
  const [gate, setGate] = useState<{ frames: number; stitchNodes: number; hasFinalVideo: boolean }>({
    frames: 0,
    stitchNodes: 0,
    hasFinalVideo: false
  });
  const [gateLoaded, setGateLoaded] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>("dashboard");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [keyVaultOpen, setKeyVaultOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [bibleOpen, setBibleOpen] = useState(false);

  // Initial URL + storage resolution
  useEffect(() => {
    const url = new URL(window.location.href);
    const fromUrlProject = url.searchParams.get("p");
    const fromUrlWs = url.searchParams.get("ws") as WorkspaceId | null;
    const fromStorage =
      typeof localStorage !== "undefined" ? localStorage.getItem(LAST_PROJECT_KEY) : null;

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


  // Lightweight gate refresh — only the counts that unlock later stages.
  // Kept separate from the full bundle reload so it can poll without
  // clobbering in-flight edits (e.g. the Screenplay draft).
  const refreshGate = useCallback(async () => {
    if (!projectId) return;
    try {
      const [sbRes, stRes, fvRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/storyboard`),
        fetch(`/api/projects/${projectId}/stitch`),
        fetch(`/api/projects/${projectId}/final-video`)
      ]);
      const sb = sbRes.ok ? await sbRes.json() : { variants: [] };
      const st = stRes.ok ? await stRes.json() : { nodes: [] };
      const fv = fvRes.ok ? await fvRes.json() : { attached: false };
      setGate({
        frames: (sb.variants ?? []).filter((v: { asset_url: string | null }) => v.asset_url).length,
        stitchNodes: (st.nodes ?? []).length,
        hasFinalVideo: Boolean(fv.attached)
      });
      setGateLoaded(true);
    } catch {
      /* gates simply stay as they were */
    }
  }, [projectId]);

  // New project selected → gates are unknown again until the first fetch.
  useEffect(() => {
    setGateLoaded(false);
  }, [projectId]);

  const reload = useCallback(async () => {
    if (!projectId) return;
    setBundleState((prev) => (prev === "ready" ? prev : "loading"));
    setBundleError(null);
    let res: Response;
    try {
      res = await fetch(`/api/projects/${projectId}`);
    } catch {
      setBundleState("error");
      setBundleError("Could not reach the server.");
      return;
    }
    if (!res.ok) {
      // Previously this returned silently, leaving the bundle null and the
      // screen claiming no project existed.
      setBundleState("error");
      setBundleError(`Could not load this project (${res.status}).`);
      return;
    }
    const data = (await res.json()) as ProjectBundle;
    setBundle(data);
    setBundleState("ready");
    const agentsRes = await fetch(`/api/projects/${projectId}/agents`);
    if (agentsRes.ok) {
      const agentsData = await agentsRes.json();
      setAgents(agentsData.agents);
    }
    refreshGate();
  }, [projectId, refreshGate]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Gates unlock work done inside self-contained workspaces (Storyboard,
  // Stitch), so refresh them on every workspace switch and on a slow poll.
  useEffect(() => {
    refreshGate();
    const timer = setInterval(refreshGate, 15_000);
    return () => clearInterval(timer);
  }, [refreshGate, activeWorkspace]);

  const reloadProjects = useCallback(async () => {
    const list = await fetch("/api/projects").then((r) => r.json());
    setProjects(list.projects as Project[]);
  }, []);

  // Compute workspace meta — the pipeline is strictly sequential: each stage
  // unlocks only when the previous one has produced something real.
  const workspaces = useMemo<WorkspaceMeta[]>(() => {
    if (!bundle) {
      return [
        { id: "dashboard", label: "Dashboard", status: "idle", unlocked: true },
        { id: "screenplay", label: "Screenplay", status: "idle", unlocked: true },
        { id: "casting", label: "Casting", status: "idle", unlocked: false, lockReason: "Submit a script in Screenplay first" },
        { id: "storyboard", label: "Storyboard", status: "idle", unlocked: false, lockReason: "Cast at least one character first" },
        { id: "stitch", label: "Stitch", status: "idle", unlocked: false, lockReason: "Generate a storyboard frame first" },
        { id: "library", label: "Library", status: "idle", unlocked: true },
        { id: "export", label: "Export", status: "idle", unlocked: false, lockReason: "Assemble shots in Stitch first" }
      ];
    }
    const submitted = bundle.project.script_submitted;
    const beatsDone = bundle.beats.length > 0;
    const hasCast = bundle.characters.length > 0;
    // Voice-only presences never get a portrait, so they're excluded from the
    // "trained" denominator — otherwise a project with one never reaches 100%.
    const castableChars = bundle.characters.filter((c) => c.brief?.physical_form !== "abstract");
    const trainedCount = castableChars.filter((c) => c.soul_id_state === "trained").length;

    const castingUnlocked = Boolean(submitted);
    const storyboardUnlocked = castingUnlocked && hasCast;
    const stitchUnlocked = storyboardUnlocked && gate.frames > 0;
    const exportUnlocked = (stitchUnlocked && gate.stitchNodes > 0) || gate.hasFinalVideo;

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
            : trainedCount === castableChars.length
            ? "complete"
            : "in-progress",
        unlocked: castingUnlocked,
        lockReason: castingUnlocked ? undefined : "Submit a script in Screenplay first",
        note:
          bundle.characters.length > 0
            ? `${trainedCount} / ${castableChars.length} soul ids`
            : undefined
      },
      {
        id: "storyboard",
        label: "Storyboard",
        status: gate.frames > 0 ? "in-progress" : "idle",
        unlocked: storyboardUnlocked,
        lockReason: storyboardUnlocked ? undefined : "Cast at least one character first",
        note: storyboardUnlocked && beatsDone ? `${bundle.beats.length} beats ready` : undefined
      },
      {
        id: "stitch",
        label: "Stitch",
        status: gate.stitchNodes > 0 ? "in-progress" : "idle",
        unlocked: stitchUnlocked,
        lockReason: stitchUnlocked ? undefined : "Generate a storyboard frame first",
        note: gate.stitchNodes > 0 ? `${gate.stitchNodes} shots` : undefined
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
        unlocked: exportUnlocked,
        lockReason: exportUnlocked ? undefined : "Assemble shots in Stitch first"
      }
    ];
  }, [bundle, gate]);

  const switchWorkspace = useCallback(
    (ws: WorkspaceId) => {
      const target = workspaces.find((w) => w.id === ws);
      if (target && !target.unlocked) return;
      setActiveWorkspace(ws);
    },
    [workspaces]
  );

  // If the active workspace becomes locked (project switch, fresh project,
  // stale ?ws= URL), snap back to the dashboard rather than showing a stage
  // the pipeline hasn't reached. Waits for the gate fetch so a deep link to
  // e.g. ?ws=stitch isn't bounced while the counts are still loading.
  useEffect(() => {
    if (!bundle || !gateLoaded) return;
    const active = workspaces.find((w) => w.id === activeWorkspace);
    if (active && !active.unlocked) setActiveWorkspace("dashboard");
  }, [bundle, gateLoaded, workspaces, activeWorkspace]);

  const deleteProject = useCallback(
    async (id: string) => {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const list = await fetch("/api/projects").then((r) => r.json());
      const all = list.projects as Project[];
      setProjects(all);
      if (id === projectId) {
        const next = all[0]?.id ?? null;
        setProjectId(next);
        setActiveWorkspace("dashboard");
        if (!next) {
          setBundle(null);
          setNewProjectOpen(true);
        }
      }
    },
    [projectId]
  );

  const createProject = useCallback(
    async (input: {
      title: string;
      logline: string;
      creative_brief: string;
      brand_kit: string;
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


  // The composer creates the shot, then hands it to the existing animate route.
  // Keeping generation in one place means a composed shot and a storyboard shot
  // travel exactly the same path, so they cannot drift apart.
  const [composing, setComposing] = useState(false);
  const [composeNote, setComposeNote] = useState<string | null>(null);

  const compose = useCallback(
    async ({ text, refs }: ComposerSubmission) => {
      if (!projectId) return;
      setComposing(true);
      setComposeNote(null);
      try {
        const created = await fetch(`/api/projects/${projectId}/compose`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: text })
        });
        const createdBody = await created.json().catch(() => null);
        if (!created.ok || !createdBody?.node_id) {
          setComposeNote(createdBody?.error || "Could not start that shot.");
          return;
        }
        const run = await fetch(`/api/stitch/nodes/${createdBody.node_id}/animate`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ model: "minimax_h3", refs })
        });
        const runBody = await run.json().catch(() => null);
        setComposeNote(
          run.ok && runBody?.ok
            ? `Shot rendered${refs.length ? ` with ${refs.length} reference${refs.length > 1 ? "s" : ""}` : ""}.`
            : runBody?.error || "The shot could not be generated."
        );
        reload();
      } catch {
        setComposeNote("Could not reach the server.");
      } finally {
        setComposing(false);
      }
    },
    [projectId, reload]
  );

  return (
    <div className="workbench">
      <TopBar
        project={bundle?.project ?? null}
        projects={projects}
        activeProjectId={projectId}
        query={query}
        onQuery={setQuery}
        onSwitchProject={(id) => {
          if (!id) return;
          setProjectId(id);
          setActiveWorkspace("dashboard");
        }}
        onNewProject={() => setNewProjectOpen(true)}
        onDeleteProject={deleteProject}
        onOpenKeys={() => setKeyVaultOpen(true)}
        onOpenSkills={() => setSkillsOpen(true)}
        onOpenAgent={() => setAgentOpen((v) => !v)}
        agentOpen={agentOpen}
      />

      <div className="app-body" data-agent={agentOpen ? "true" : "false"}>
        <Rail workspaces={workspaces} active={activeWorkspace} onSwitch={switchWorkspace} />

        <main className="main">
          {!bundle && bundleState === "loading" ? (
            <SkeletonWorkspace />
          ) : !bundle && bundleState === "error" ? (
            <div className="main-inner">
              <ErrorState message={bundleError} onRetry={reload} />
            </div>
          ) : !bundle ? (
            <div className="main-inner">
              <div
                style={{
                  background: "var(--surface)",
                  backdropFilter: "blur(18px)",
                  borderRadius: 18,
                  boxShadow: "var(--shadow-1)",
                  padding: "36px 40px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 12
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    color: "var(--accent)"
                  }}
                >
                  Producer
                </span>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: "clamp(24px,2.4vw,32px)",
                    letterSpacing: "-0.02em",
                    color: "var(--ink)"
                  }}
                >
                  No project loaded
                </h2>
                <p style={{ margin: 0, fontSize: 15, color: "var(--mute)" }}>
                  Start a project to bring the production pipeline online.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 8, fontFamily: "var(--font-ui)" }}
                  onClick={() => setNewProjectOpen(true)}
                >
                  New project
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeWorkspace === "dashboard" && (
                <Dashboard
                  project={bundle.project}
                  workspaces={workspaces}
                  stats={{
                    beats: bundle.beats.length,
                    characters: bundle.characters.length,
                    locations: bundle.locations.length
                  }}
                  query={query}
                  onSwitchWorkspace={switchWorkspace}
                />
              )}

              {/* Screenplay stays mounted so generation and extraction survive tab switches */}
              <div style={{ display: activeWorkspace === "screenplay" ? "contents" : "none" }}>
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
              </div>

              {/* Casting stays mounted so portrait generation survives tab switches */}
              <div style={{ display: activeWorkspace === "casting" ? "contents" : "none" }}>
                <Casting
                  project={bundle.project}
                  characters={bundle.characters}
                  locations={bundle.locations}
                  props={bundle.props}
                  onSwitchWorkspace={switchWorkspace}
                  onReload={reload}
                />
              </div>

              {activeWorkspace === "storyboard" && (
                <Storyboard project={bundle.project} onSwitchWorkspace={switchWorkspace} />
              )}
              {activeWorkspace === "stitch" && (
                <Stitch project={bundle.project} onSwitchWorkspace={switchWorkspace} />
              )}
              {activeWorkspace === "library" && (
                <Library project={bundle.project} onSwitchWorkspace={switchWorkspace} />
              )}
              {activeWorkspace === "export" && (
                <ExportWorkspace project={bundle.project} onSwitchWorkspace={switchWorkspace} />
              )}
            </>
          )}
          {bundle && (
            <div className="composer-dock">
              <div className="main-inner">
                <Composer
                  projectId={bundle.project.id}
                  onSubmit={compose}
                  busy={composing}
                  seed={composerSeed}
                  onSeedConsumed={() => setComposerSeed(null)}
                />
                {composeNote && <p className="composer-note">{composeNote}</p>}
              </div>
            </div>
          )}
        </main>

        {bundle && (
          <AgentPanel
            projectId={bundle.project.id}
            open={agentOpen}
            onClose={() => setAgentOpen(false)}
            onUsePrompt={(text) => {
              setComposerSeed(text);
              setAgentOpen(false);
            }}
          />
        )}
      </div>

      <KeyVaultPanel open={keyVaultOpen} onClose={() => setKeyVaultOpen(false)} />
      <SkillsPanel open={skillsOpen} onClose={() => setSkillsOpen(false)} />

      {bundle && bibleOpen && (
        <MovieBibleModal
          project={bundle.project}
          bible={bundle.bible}
          beats={bundle.beats}
          characters={bundle.characters}
          locations={bundle.locations}
          onClose={() => setBibleOpen(false)}
        />
      )}

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
