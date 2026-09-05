"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dropCache, readCache, writeCache } from "./_lib/browser-cache";
import { SideBar } from "./_components/SideBar";
import { useRenderEngine } from "./_components/RenderEngineChip";
import { DirectorDock } from "./_components/DirectorDock";
import { Inspector } from "./_components/Inspector";
import { SkeletonWorkspace, ErrorState } from "./_components/AsyncStates";
import type { ComposerSubmission } from "./_components/Composer";
import { NewProjectModal } from "./_components/NewProjectModal";
import { MovieBibleModal } from "./_components/MovieBibleModal";
import { CommandPalette } from "./_components/CommandPalette";
import { KeyVaultPanel } from "./_components/KeyVaultPanel";
import { SkillsPanel } from "./_components/SkillsPanel";
import { ConfirmProvider } from "./_components/ui/alert-dialog";
import { STAGE_LABELS, LOCK_REASONS, isAppMode, type AppMode } from "./_lib/stages";
import { SelectionProvider } from "./_state/selection";
import { TooltipProvider } from "./_components/ui/tooltip";
import dynamic from "next/dynamic";
import { ProductionHome } from "./_workspaces/ProductionHome";
import { Productions } from "./_workspaces/Productions";
import { CreateHome } from "./_workspaces/CreateHome";
import { Screenplay } from "./_workspaces/Screenplay";
import { Casting } from "./_workspaces/Casting";
// Conditionally-rendered workspaces are code-split so their weight (React Flow
// in Stitch especially) stays out of the initial bundle and loads on first open.
const wsLoading = () => <SkeletonWorkspace />;
const Storyboard = dynamic(() => import("./_workspaces/Storyboard").then((m) => ({ default: m.Storyboard })), { ssr: false, loading: wsLoading });
const Stitch = dynamic(() => import("./_workspaces/Stitch").then((m) => ({ default: m.Stitch })), { ssr: false, loading: wsLoading });
const Library = dynamic(() => import("./_workspaces/Library").then((m) => ({ default: m.Library })), { ssr: false, loading: wsLoading });
const FinishWorkspace = dynamic(() => import("./_workspaces/Finish").then((m) => ({ default: m.Finish })), { ssr: false, loading: wsLoading });
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
/** The production that Create draws into. Every generation route needs a
 *  project, so Create gets one of its own rather than a new backend; it is
 *  hidden from the switcher and the productions wall. */
const SCRATCH_TITLE = "Scratch";

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
  const [paletteOpen, setPaletteOpen] = useState(false);
  // The render engine's state is read once here and handed to whatever shows
  // it, so the bar and the Dock never poll RunPod twice for the same fact.
  const h3 = useRenderEngine();
  // Bumped whenever anything finishes generating. The canvas watches it and
  // re-fetches; without it a finished shot never appeared until the filter
  // was changed or the page reloaded.
  const [assetsVersion, setAssetsVersion] = useState(0);
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
  // Top-level destination (brief §8). `home` shows the current production;
  // the others are surfaces that exist without one. Carried in `?m=` so a
  // link to Create or Assets opens there.
  const [mode, setMode] = useState<AppMode>("home");
  // Bumped when a production is created or deleted so the wall refetches.
  const [projectsVersion, setProjectsVersion] = useState(0);
  /** The list has come back from the server at least once. Until it has, we
   *  cannot tell "there is no scratch production" from "we have not looked". */
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  // The production that was open before Create took the project slot.
  const lastProduction = useRef<string | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [keyVaultOpen, setKeyVaultOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [bibleOpen, setBibleOpen] = useState(false);

  // Initial URL + storage resolution
  useEffect(() => {
    const url = new URL(window.location.href);
    const fromUrlProject = url.searchParams.get("p");
    const fromUrlWs = url.searchParams.get("ws") as WorkspaceId | null;
    const fromUrlMode = url.searchParams.get("m");
    const fromStorage =
      typeof localStorage !== "undefined" ? localStorage.getItem(LAST_PROJECT_KEY) : null;

    if (fromUrlWs) setActiveWorkspace(fromUrlWs);
    if (isAppMode(fromUrlMode)) setMode(fromUrlMode);

    // The list we saw last time, painted before the network answers.
    const cachedList = readCache<Project[]>("projects");
    if (cachedList?.length) setProjects(cachedList);

    // When the URL or the last session already names the production, open it
    // now rather than after the list round-trip: the bundle and the list then
    // load side by side instead of one behind the other.
    const hint = fromUrlProject ?? fromStorage;
    if (hint) setProjectId(hint);

    (async () => {
      const list = await fetch("/api/projects").then((r) => r.json());
      const all = list.projects as Project[];
      setProjects(all);
      setProjectsLoaded(true);
      writeCache("projects", all);
      // A hint can name a production that has since been deleted; fall back
      // rather than sitting on a bundle that will never load.
      const hintIsReal = hint ? all.some((p) => p.id === hint) : false;
      if (hintIsReal) return;
      const target = all[0]?.id ?? null;
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
    // Home is the default and needs no parameter; a stale `?m=create` on a
    // link that has since gone home would otherwise reopen Create.
    if (mode === "home") url.searchParams.delete("m");
    else url.searchParams.set("m", mode);
    window.history.replaceState(null, "", url.toString());
    // The scratch production is never the one to come back to.
    if (mode !== "create") localStorage.setItem(LAST_PROJECT_KEY, projectId);
  }, [projectId, activeWorkspace, mode]);

  const scratchId = useMemo(() => projects.find((p) => p.title === SCRATCH_TITLE)?.id ?? null, [projects]);
  const visibleProjects = useMemo(() => projects.filter((p) => p.title !== SCRATCH_TITLE), [projects]);

  /** Create needs a production to generate into. Make the scratch one once. */
  const ensureScratch = useCallback(async (): Promise<string | null> => {
    if (scratchId) return scratchId;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: SCRATCH_TITLE, format: "Other", premise: "Generation outside any production." })
    }).catch(() => null);
    const body = res && res.ok ? await res.json().catch(() => null) : null;
    if (!body?.project?.id) return null;
    const list = await fetch("/api/projects").then((r) => r.json());
    setProjects(list.projects as Project[]);
    writeCache("projects", list.projects as Project[]);
    return body.project.id as string;
  }, [scratchId]);

  const changeMode = useCallback(
    async (m: AppMode) => {
      if (m === mode) return;
      if (m === "create") {
        lastProduction.current = projectId;
        const id = await ensureScratch();
        if (id) setProjectId(id);
      } else if (mode === "create" && lastProduction.current) {
        setProjectId(lastProduction.current);
      }
      setMode(m);
      if (m === "home") setActiveWorkspace("dashboard");
      if (m === "assets") setActiveWorkspace("library");
    },
    [mode, projectId, ensureScratch]
  );


  // Create renders against the scratch production, which changeMode() sets on
  // the way in. Arriving by URL - a bookmark, or just a reload, since the mode
  // is written into the address - skipped that and left the workspace showing
  // loading skeletons that never resolved. Reaching it any way now settles it.
  useEffect(() => {
    if (mode !== "create" || !projectsLoaded) return;
    if (scratchId && projectId === scratchId) return;
    let cancelled = false;
    void (async () => {
      const id = await ensureScratch();
      if (!cancelled && id) setProjectId(id);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, projectsLoaded, scratchId, projectId, ensureScratch]);

  // Lightweight gate refresh — only the counts that unlock later stages.
  // Kept separate from the full bundle reload so it can poll without
  // clobbering in-flight edits (e.g. the Screenplay draft).
  const refreshGate = useCallback(async () => {
    if (!projectId) return;
    const cachedGate = readCache<typeof gate>(`gate:${projectId}`);
    if (cachedGate) {
      setGate(cachedGate);
      setGateLoaded(true);
    }
    try {
      const [sbRes, stRes, fvRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/storyboard`),
        fetch(`/api/projects/${projectId}/stitch`),
        fetch(`/api/projects/${projectId}/final-video`)
      ]);
      const sb = sbRes.ok ? await sbRes.json() : { variants: [] };
      const st = stRes.ok ? await stRes.json() : { nodes: [] };
      const fv = fvRes.ok ? await fvRes.json() : { attached: false };
      const next = {
        frames: (sb.variants ?? []).filter((v: { asset_url: string | null }) => v.asset_url).length,
        stitchNodes: (st.nodes ?? []).length,
        hasFinalVideo: Boolean(fv.attached)
      };
      setGate(next);
      writeCache(`gate:${projectId}`, next);
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
    // Show last time's bundle immediately; the fetch below replaces it. While
    // something real is on screen a failure must not wipe it for an error
    // card, so the error states only fire when there is nothing to show.
    const cached = readCache<ProjectBundle>(`bundle:${projectId}`);
    const painted = Boolean(cached);
    if (cached) {
      setBundle(cached);
      setBundleState("ready");
    } else {
      setBundleState((prev) => (prev === "ready" ? prev : "loading"));
    }
    setBundleError(null);
    let res: Response;
    try {
      res = await fetch(`/api/projects/${projectId}`);
    } catch {
      if (painted) return;
      setBundleState("error");
      setBundleError("Could not reach the server.");
      return;
    }
    if (!res.ok) {
      // Previously this returned silently, leaving the bundle null and the
      // screen claiming no project existed.
      if (painted) return;
      setBundleState("error");
      setBundleError(`Could not load this project (${res.status}).`);
      return;
    }
    const data = (await res.json()) as ProjectBundle;
    setBundle(data);
    writeCache(`bundle:${projectId}`, data);
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
        { id: "dashboard", label: STAGE_LABELS.dashboard, status: "idle", unlocked: true },
        { id: "screenplay", label: STAGE_LABELS.screenplay, status: "idle", unlocked: true },
        { id: "casting", label: STAGE_LABELS.casting, status: "idle", unlocked: false, lockReason: LOCK_REASONS.casting },
        { id: "storyboard", label: STAGE_LABELS.storyboard, status: "idle", unlocked: false, lockReason: LOCK_REASONS.storyboard },
        { id: "stitch", label: STAGE_LABELS.stitch, status: "idle", unlocked: false, lockReason: LOCK_REASONS.stitch },
        { id: "library", label: STAGE_LABELS.library, status: "idle", unlocked: true },
        { id: "export", label: STAGE_LABELS.export, status: "idle", unlocked: false, lockReason: LOCK_REASONS.export }
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
    // A frame on the storyboard opens Shots — and so does a shot already on
    // the board. Kaliyug's shots were made outside the Storyboard, and the
    // old predicate locked the stage on a board with eighteen shots on it.
    const stitchUnlocked = storyboardUnlocked && (gate.frames > 0 || gate.stitchNodes > 0);
    const exportUnlocked = (stitchUnlocked && gate.stitchNodes > 0) || gate.hasFinalVideo;

    return [
      { id: "dashboard", label: STAGE_LABELS.dashboard, status: "idle", unlocked: true },
      {
        id: "screenplay",
        label: STAGE_LABELS.screenplay,
        status: submitted ? (beatsDone ? "complete" : "in-progress") : "idle",
        unlocked: true,
        note: submitted ? `${bundle.beats.length} beats` : undefined
      },
      {
        id: "casting",
        label: STAGE_LABELS.casting,
        status:
          bundle.characters.length === 0
            ? "idle"
            : trainedCount === castableChars.length
            ? "complete"
            : "in-progress",
        unlocked: castingUnlocked,
        lockReason: castingUnlocked ? undefined : LOCK_REASONS.casting,
        note:
          bundle.characters.length > 0
            ? `${trainedCount} / ${castableChars.length} soul ids`
            : undefined
      },
      {
        id: "storyboard",
        label: STAGE_LABELS.storyboard,
        status: gate.frames > 0 ? "in-progress" : "idle",
        unlocked: storyboardUnlocked,
        lockReason: storyboardUnlocked ? undefined : LOCK_REASONS.storyboard,
        note: storyboardUnlocked && beatsDone ? `${bundle.beats.length} beats ready` : undefined
      },
      {
        id: "stitch",
        label: STAGE_LABELS.stitch,
        status: gate.stitchNodes > 0 ? "in-progress" : "idle",
        unlocked: stitchUnlocked,
        lockReason: stitchUnlocked ? undefined : LOCK_REASONS.stitch,
        note: gate.stitchNodes > 0 ? `${gate.stitchNodes} shots` : undefined
      },
      {
        id: "library",
        label: STAGE_LABELS.library,
        status: "idle",
        unlocked: true
      },
      {
        id: "export",
        label: STAGE_LABELS.export,
        status: "idle",
        unlocked: exportUnlocked,
        lockReason: exportUnlocked ? undefined : LOCK_REASONS.export
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
      // Otherwise its bundle and gates would still paint on the next visit.
      dropCache(id);
      const list = await fetch("/api/projects").then((r) => r.json());
      const all = list.projects as Project[];
      setProjects(all);
      writeCache("projects", all);
      setProjectsVersion((v) => v + 1);
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
        setProjectsVersion((v) => v + 1);
        setProjectId(data.project.id);
        setMode("home");
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
        setAssetsVersion((v) => v + 1);
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
    // One tooltip provider for the whole shell: every icon button and locked
    // stage explains itself through it, and Radix throws without one.
    <TooltipProvider delayDuration={300}>
    <ConfirmProvider>
    <SelectionProvider>
    <div className="workbench">
      {/* Everything the global bar and the stage strip used to carry, down
          the side and collapsible (brief §8-§9). The stages are still the
          production's navigation context, so they appear only while one is
          open. */}
      <SideBar
        project={bundle?.project ?? null}
        projects={visibleProjects}
        activeProjectId={projectId}
        mode={mode}
        onMode={(m) => void changeMode(m)}
        onSwitchProject={(id) => {
          if (!id) return;
          setProjectId(id);
          setMode("home");
          setActiveWorkspace("dashboard");
        }}
        onNewProject={() => setNewProjectOpen(true)}
        onDeleteProject={deleteProject}
        onOpenKeys={() => setKeyVaultOpen(true)}
        onOpenSkills={() => setSkillsOpen(true)}
        onOpenPalette={() => setPaletteOpen(true)}
        h3={h3}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSwitchWorkspace={switchWorkspace}
        showStages={mode === "home" && Boolean(bundle)}
      />

      <div className="app-body">
        <div className="work">
          <main className="main">
          {mode === "productions" ? (
            <Productions
              activeId={projectId}
              hideId={scratchId}
              version={projectsVersion}
              onOpen={(id) => {
                setProjectId(id);
                setMode("home");
                setActiveWorkspace("dashboard");
              }}
              onNew={() => setNewProjectOpen(true)}
              onDelete={deleteProject}
            />
          ) : mode === "create" ? (
            scratchId && projectId === scratchId ? (
              <CreateHome projectId={scratchId} assetsVersion={assetsVersion} />
            ) : (
              <SkeletonWorkspace />
            )
          ) : !bundle && bundleState === "loading" ? (
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
                <ProductionHome
                  project={bundle.project}
                  beats={bundle.beats}
                  characters={bundle.characters}
                  activity={bundle.activity}
                  gate={gate}
                  assetsVersion={assetsVersion}
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
                <Library project={bundle.project} assetsVersion={assetsVersion} onSwitchWorkspace={switchWorkspace} />
              )}
              {activeWorkspace === "export" && (
                <FinishWorkspace project={bundle.project} onSwitchWorkspace={switchWorkspace} />
              )}
            </>
          )}
          </main>
        </div>

        {/* Takes a column only while something is selected and a stage has
            registered a body for it; otherwise it renders nothing and the
            work keeps the width. */}
        <Inspector />
      </div>

      {/* The Director Dock is the last row of the shell, in normal flow, so it
          can never sit on top of the work the way a sticky strip did. */}
      {bundle && (
        <DirectorDock
          project={bundle.project}
          h3={h3}
          onGenerate={compose}
          generating={composing}
          generateNote={composeNote}
          onFinished={() => setAssetsVersion((v) => v + 1)}
          initialMode={mode === "create" ? "generate" : "direct"}
        />
      )}

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

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        project={bundle?.project ?? null}
        projects={visibleProjects}
        activeProjectId={projectId}
        onSwitchWorkspace={switchWorkspace}
        onSwitchProject={(id) => {
          setProjectId(id);
          setMode("home");
          setActiveWorkspace("dashboard");
        }}
        onNewProject={() => setNewProjectOpen(true)}
        onOpenKeyVault={() => setKeyVaultOpen(true)}
      />
    </div>
    </SelectionProvider>
    </ConfirmProvider>
    </TooltipProvider>
  );
}
