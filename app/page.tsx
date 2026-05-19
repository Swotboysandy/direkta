"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Aperture,
  Boxes,
  CheckSquare2,
  Clapperboard,
  Database,
  Film,
  Folder,
  ImageIcon,
  KeyRound,
  Layers3,
  LayoutDashboard,
  ListChecks,
  Network,
  PenLine,
  Play,
  Plus,
  Save,
  Settings,
  Sparkles,
  Upload,
  Wand2
} from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";

type View = "projects" | "script" | "assets" | "nodes" | "timeline" | "keys";
type Provider = "best" | "higgsfield" | "manual";

const navItems = [
  { id: "projects", label: "Projects", icon: Folder },
  { id: "script", label: "Script Lab", icon: ListChecks },
  { id: "assets", label: "Assets", icon: ImageIcon },
  { id: "nodes", label: "Node Board", icon: Network },
  { id: "timeline", label: "Timeline", icon: Film }
] satisfies { id: View; label: string; icon: typeof Folder }[];

const projects = [
  {
    title: "Runaway Heiress",
    tag: "cinematic drama",
    summary: "A pressured heir escapes a royal city while a loyal guard rewrites her route.",
    date: "2026-05-20 01:54"
  },
  {
    title: "Glass City",
    tag: "near future noir",
    summary: "A detective follows a memory trail through mirrored towers and rain-soaked markets.",
    date: "2026-05-18 22:10"
  },
  {
    title: "Monsoon Vault",
    tag: "adventure",
    summary: "Four strangers discover a flooded archive holding the map to a lost power source.",
    date: "2026-05-15 16:42"
  }
];

const chatCards = [
  {
    title: "1. Opening rewrite",
    body:
      "Tighten the cold open. Start with the market chase, introduce the heroine's debt, and make the guard's choice visible within the first 12 seconds."
  },
  {
    title: "2. Shot notes",
    body:
      "Keep every scene vertical-safe. Use one strong visual objective per beat: escape, misdirection, reveal, and consequence."
  },
  {
    title: "3. Production cue",
    body:
      "Lock the character seed before generating wardrobe variations. Keep hair, jewelry, and face structure consistent across all shots."
  }
];

const tabs = ["Story Structure", "Rewrite Strategy", "Script", "Continuity"];

const strategySections = [
  {
    title: "Core Rules",
    rows: [
      ["Positive", "Every scene must have a clear visual decision, not only exposition."],
      ["Negative", "Avoid long backstory blocks and repeated emotional explanations."],
      ["Positive", "Use one cinematic surprise every 20 seconds to keep momentum."],
      ["Negative", "Do not change the main character face, costume palette, or voice between shots."]
    ]
  },
  {
    title: "Scene Compression",
    rows: [
      ["Cut", "Merge the council argument into the balcony escape."],
      ["Cut", "Remove duplicate guard warnings and keep one decisive line."],
      ["Keep", "Preserve the coin rain reveal because it motivates the next chase."]
    ]
  }
];

const assets = [
  { title: "Princess Sora", type: "Character", model: "Character lock", status: "Prompt ready" },
  { title: "Royal Kitchen", type: "Scene", model: "Image model", status: "Generated" },
  { title: "Guard Captain", type: "Character", model: "Character lock", status: "Draft" },
  { title: "Treasury Hall", type: "Scene", model: "Image model", status: "Generated" },
  { title: "Street Market", type: "Scene", model: "Video model", status: "Motion test" },
  { title: "Glass Pendant", type: "Prop", model: "Image model", status: "Generated" },
  { title: "Escape Dress", type: "Costume", model: "Reference image", status: "Approved" },
  { title: "Rain Courtyard", type: "Scene", model: "Image model", status: "Prompt ready" }
];

const nodes = [
  { id: "script", title: "Script Parser", group: "Input", x: 6, y: 18, ports: ["text", "beats"] },
  { id: "character", title: "Character Lock", group: "Control", x: 28, y: 8, ports: ["face", "seed"] },
  { id: "style", title: "Look Bible", group: "Control", x: 28, y: 46, ports: ["palette", "camera"] },
  { id: "image", title: "Keyframe Gen", group: "Image", x: 52, y: 18, ports: ["prompt", "frame"] },
  { id: "video", title: "Motion Gen", group: "Video", x: 73, y: 18, ports: ["frame", "clip"] },
  { id: "audio", title: "Music Cue", group: "Audio", x: 52, y: 58, ports: ["mood", "wav"] },
  { id: "render", title: "Final Render", group: "Output", x: 78, y: 58, ports: ["tracks", "mp4"] }
];

const timeline = [
  { track: "Video", clips: ["Market open", "Balcony run", "Guard choice", "Coin rain"] },
  { track: "Voice", clips: ["Whisper", "Warning", "Promise"] },
  { track: "Music", clips: ["Pulse", "Rise", "Drop"] },
  { track: "SFX", clips: ["Crowd", "Glass", "Hooves", "Gate"] }
];

const providers = [
  { id: "best", label: "Best model per task", copy: "Direkta routes script, image, video, and music to the best configured provider." },
  { id: "higgsfield", label: "Higgsfield only", copy: "Use a single provider for every generation stage when available." },
  { id: "manual", label: "Manual routing", copy: "Choose a provider for script, storyboard, video, music, and grading." }
] satisfies { id: Provider; label: string; copy: string }[];

export default function Home() {
  const [view, setView] = useState<View>("script");
  const [activeTab, setActiveTab] = useState("Rewrite Strategy");
  const [selectedAsset, setSelectedAsset] = useState(assets[0].title);
  const [provider, setProvider] = useState<Provider>("best");
  const [toast, setToast] = useState("");
  const [prompt, setPrompt] = useState("");

  const title = useMemo(() => {
    if (view === "projects") return "My Projects";
    if (view === "assets") return "Asset Board";
    if (view === "nodes") return "Generation Node Board";
    if (view === "timeline") return "Timeline";
    if (view === "keys") return "Model Keys";
    return "Runaway Heiress";
  }, [view]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  return (
    <main className="app-frame">
      <header className="window-bar">
        <strong>Direkta</strong>
        <div aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </header>

      <aside className="side-rail">
        <button className="rail-logo" aria-label="Direkta home" onClick={() => setView("projects")}>
          <Aperture size={34} />
        </button>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={clsx(view === item.id && "active")}
                onClick={() => setView(item.id)}
                aria-label={item.label}
                title={item.label}
              >
                <Icon size={25} />
              </button>
            );
          })}
        </nav>
        <div>
          <button onClick={() => setView("keys")} className={clsx(view === "keys" && "active")} aria-label="Model keys" title="Model keys">
            <KeyRound size={24} />
          </button>
          <button aria-label="Settings" title="Settings">
            <Settings size={25} />
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="workspace-head">
          <div>
            <h1>{title}</h1>
            <span>{view === "projects" ? "Manage every short film workspace" : "Cinema AI pipeline for script, assets, graph, audio, grading, and render"}</span>
          </div>
          <div className="tool-strip">
            <button className={clsx(view === "script" && "active")} onClick={() => setView("script")} aria-label="Script">
              <PenLine size={24} />
            </button>
            <button className={clsx(view === "nodes" && "active")} onClick={() => setView("nodes")} aria-label="Node board">
              <Network size={24} />
            </button>
            <button className={clsx(view === "assets" && "active")} onClick={() => setView("assets")} aria-label="Assets">
              <Boxes size={24} />
            </button>
            <button className={clsx(view === "timeline" && "active")} onClick={() => setView("timeline")} aria-label="Timeline">
              <Clapperboard size={24} />
            </button>
            <i />
            <button onClick={() => notify("Project saved")} aria-label="Save">
              <Save size={24} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="workspace-body"
          >
            {view === "projects" && <ProjectsView onOpen={() => setView("script")} />}
            {view === "script" && (
              <ScriptView
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                prompt={prompt}
                setPrompt={setPrompt}
                onGenerate={() => notify("Script beat queued")}
              />
            )}
            {view === "assets" && <AssetsView selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} onGenerate={() => notify("Asset prompt queued")} />}
            {view === "nodes" && <NodeBoard onRun={() => notify("Node graph queued")} />}
            {view === "timeline" && <TimelineView onRender={() => notify("Render queued")} />}
            {view === "keys" && <KeysView provider={provider} setProvider={setProvider} />}
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
  );
}

function ProjectsView({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="projects-view">
      <button className="new-project" onClick={onOpen}>
        <Plus size={23} />
        New Project
      </button>
      <div className="project-grid">
        {projects.map((project) => (
          <motion.button key={project.title} onClick={onOpen} whileHover={{ y: -4 }}>
            <header>
              <h2>{project.title}</h2>
              <span>{project.tag}</span>
            </header>
            <p>{project.summary}</p>
            <footer>
              <time>{project.date}</time>
              <PenLine size={21} />
            </footer>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ScriptView({
  activeTab,
  setActiveTab,
  prompt,
  setPrompt,
  onGenerate
}: {
  activeTab: string;
  setActiveTab: (value: string) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="script-layout">
      <section className="chat-column">
        {chatCards.map((card, index) => (
          <article key={card.title} className="message-card">
            <span />
            <h2>{card.title}</h2>
            <p>{card.body}</p>
            {index === 2 && <strong>Episode 1 rewrite is ready for review.</strong>}
          </article>
        ))}
        <div className="prompt-box">
          <button aria-label="Prompt settings">
            <Settings size={21} />
          </button>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask Direkta to rewrite, expand, storyboard, or generate a shot plan..." />
          <button onClick={onGenerate} aria-label="Send prompt">
            <Sparkles size={22} />
          </button>
        </div>
      </section>

      <section className="document-column">
        <div className="tabs">
          {tabs.map((tab) => (
            <button key={tab} className={clsx(tab === activeTab && "active")} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
          <button className="edit-button">Edit</button>
        </div>
        <article className="document-panel">
          <h2>{activeTab === "Script" ? "Episode 1 Script Draft" : "Runaway Heiress - Key Decisions"}</h2>
          {strategySections.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              <ul>
                {section.rows.map((row) => (
                  <li key={row[1]} className={row[0].toLowerCase()}>
                    <CheckSquare2 size={24} />
                    <strong>{row[0]}</strong>
                    <span>{row[1]}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <table>
            <thead>
              <tr>
                <th>Change</th>
                <th>Reason</th>
                <th>Replacement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Long intro memory</td>
                <td>Too much exposition</td>
                <td>Open on the chase and reveal history through props</td>
              </tr>
              <tr>
                <td>Repeated warnings</td>
                <td>Slows momentum</td>
                <td>One direct guard line before the gate closes</td>
              </tr>
            </tbody>
          </table>
        </article>
      </section>
    </div>
  );
}

function AssetsView({
  selectedAsset,
  setSelectedAsset,
  onGenerate
}: {
  selectedAsset: string;
  setSelectedAsset: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="assets-layout">
      <aside className="asset-controls">
        <h2>Batch Settings</h2>
        {["Select all", "Select empty prompts", "Select ungenerated", "Preview images", "Clear selection"].map((label) => (
          <button key={label}>{label}</button>
        ))}
        <fieldset>
          <legend>Asset Type</legend>
          {["Character", "Scene", "Prop", "Costume"].map((label) => (
            <label key={label}>
              <input type="checkbox" defaultChecked={label !== "Prop"} />
              {label}
            </label>
          ))}
        </fieldset>
        <label>
          Generation Model
          <select defaultValue="best">
            <option value="best">Best available</option>
            <option value="image">Image model</option>
            <option value="video">Video model</option>
          </select>
        </label>
        <label>
          Resolution
          <select defaultValue="2k">
            <option value="1k">1K</option>
            <option value="2k">2K</option>
            <option value="4k">4K</option>
          </select>
        </label>
        <button className="primary" onClick={onGenerate}>Generate Prompts</button>
        <button className="primary" onClick={onGenerate}>Generate Assets</button>
      </aside>

      <section className="asset-grid">
        {assets.map((asset, index) => (
          <motion.button
            key={asset.title}
            className={clsx(selectedAsset === asset.title && "active")}
            onClick={() => setSelectedAsset(asset.title)}
            whileHover={{ y: -3 }}
          >
            <span className="asset-check" />
            <div className="asset-thumb" data-index={index}>
              <ImageIcon size={42} />
            </div>
            <h3>{asset.title}</h3>
            <p>
              <em>{asset.type}</em>
              <b>{asset.model}</b>
              <i>{asset.status}</i>
            </p>
            <small>Continuity prompt, reference seed, grading notes, and generation history are attached.</small>
          </motion.button>
        ))}
      </section>
    </div>
  );
}

function NodeBoard({ onRun }: { onRun: () => void }) {
  return (
    <div className="node-workspace">
      <aside className="node-library">
        <h2>Nodes</h2>
        {["Script", "Character", "Style", "Image", "Video", "Audio", "Render"].map((label) => (
          <button key={label}>
            <Database size={18} />
            {label}
          </button>
        ))}
        <button className="primary" onClick={onRun}>
          <Play size={18} />
          Run Graph
        </button>
      </aside>
      <section className="graph-canvas">
        <svg className="graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M18 31 C 29 31, 27 20, 39 20" />
          <path d="M18 31 C 29 31, 27 58, 39 58" />
          <path d="M47 20 C 56 20, 55 31, 63 31" />
          <path d="M47 58 C 57 58, 54 31, 63 31" />
          <path d="M73 31 C 80 31, 78 59, 86 59" />
          <path d="M63 70 C 73 70, 76 59, 86 59" />
        </svg>
        {nodes.map((node) => (
          <motion.button
            key={node.id}
            className="graph-node"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            whileHover={{ scale: 1.03 }}
          >
            <span>{node.group}</span>
            <strong>{node.title}</strong>
            <div>
              <i>{node.ports[0]}</i>
              <i>{node.ports[1]}</i>
            </div>
          </motion.button>
        ))}
      </section>
    </div>
  );
}

function TimelineView({ onRender }: { onRender: () => void }) {
  return (
    <div className="timeline-layout">
      <header>
        <div>
          <h2>Episode 1 Assembly</h2>
          <span>24 fps / 16:9 / music locked / color pass pending</span>
        </div>
        <button onClick={onRender}>
          <Play size={19} />
          Render Preview
        </button>
      </header>
      <section className="timeline-board">
        {timeline.map((track, trackIndex) => (
          <div key={track.track} className="timeline-row">
            <strong>{track.track}</strong>
            <div>
              {track.clips.map((clip, clipIndex) => (
                <button key={clip} style={{ width: `${18 + clip.length * 3}%`, marginLeft: clipIndex === 0 ? 0 : `${trackIndex + clipIndex}%` }}>
                  {clip}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function KeysView({ provider, setProvider }: { provider: Provider; setProvider: (value: Provider) => void }) {
  return (
    <div className="keys-layout">
      <section>
        <h2>Routing</h2>
        {providers.map((item) => (
          <button key={item.id} className={clsx(provider === item.id && "active")} onClick={() => setProvider(item.id)}>
            <strong>{item.label}</strong>
            <span>{item.copy}</span>
          </button>
        ))}
      </section>
      <section className="key-form">
        {["Higgsfield", "Claude", "OpenAI", "Fal", "Suno", "Runway"].map((name) => (
          <label key={name}>
            {name}
            <input type="password" placeholder="Paste API key" />
          </label>
        ))}
      </section>
    </div>
  );
}
