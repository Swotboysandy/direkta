"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Aperture,
  Camera,
  Check,
  Clapperboard,
  Film,
  Grid2X2,
  Heart,
  ImageIcon,
  KeyRound,
  Layers2,
  Monitor,
  Music2,
  Plus,
  Settings2,
  Sparkles,
  Upload,
  Video,
  Wand2,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";

type Modal = "keys" | "style" | "camera" | null;
type ProviderMode = "hybrid" | "higgsfield" | "custom";

const nav = ["Explore", "Image", "Video", "Audio", "Supercomputer", "Cinema Studio", "AI Influencer", "Canvas", "Apps"];
const stylePresets = ["One Take", "Soft Cross", "Teal Orange", "Clean Noir"];
const cameraPresets = ["Auto", "Clinical Sharp", "35 mm", "Studio Digital S35"];
const providers = ["Best model per task", "Higgsfield only", "Manual routing"];

export default function Home() {
  const [modal, setModal] = useState<Modal>(null);
  const [mode, setMode] = useState<"image" | "video">("video");
  const [providerMode, setProviderMode] = useState<ProviderMode>("hybrid");
  const [style, setStyle] = useState("One Take, Soft Cross, Teal Orange");
  const [camera, setCamera] = useState("Clinical Sharp");
  const [duration, setDuration] = useState("8s");
  const [quality, setQuality] = useState("1080p");
  const [batch, setBatch] = useState(4);
  const [generated, setGenerated] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [toast, setToast] = useState("");

  const providerLabel = useMemo(() => {
    if (providerMode === "higgsfield") return "Higgsfield only";
    if (providerMode === "custom") return "Manual routing";
    return "Best model";
  }, [providerMode]);

  function generate() {
    setGenerated((value) => value + batch);
    setToast(`Queued ${batch} shot${batch > 1 ? "s" : ""}`);
  }

  return (
    <main className="cinema-shell">
      <header className="top-nav">
        <button className="logo" aria-label="Home">
          <Aperture size={22} />
        </button>
        <nav aria-label="Product navigation">
          {nav.map((item) => (
            <button key={item} className={clsx(item === "Cinema Studio" && "active", item === "Supercomputer" && "cyan")}>
              {item === "Supercomputer" && <Grid2X2 size={13} />}
              {item}
              {item === "Supercomputer" && <span>New</span>}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <button onClick={() => setModal("keys")}>
            <KeyRound size={14} />
            Keys
          </button>
          <button className="login">Login</button>
          <button className="signup">Sign up</button>
        </div>
      </header>

      <aside className="project-rail">
        <button className="rail-line">
          <Monitor size={15} />
          Hide
        </button>
        <button className="new-project">
          <Plus size={16} />
          New project
        </button>
        <span className="rail-label">Projects</span>
        <button className="generation-pill">
          <Layers2 size={16} />
          My Generations
        </button>
        <div className="empty-project">
          <div className="folder-stack">
            <Plus size={18} />
          </div>
          <strong>No projects yet</strong>
          <p>Create a project to organize your images, videos, and audio.</p>
          <button>
            <Plus size={13} />
            Create project
          </button>
        </div>
      </aside>

      <section className="center-prompt" aria-label="Cinema prompt">
        <div>
          <span>Cinema Studio 3.5</span>
          <h1>What would you shoot<br />with infinite budget?</h1>
        </div>
      </section>

      <section className="studio-composer">
        <div className="mode-switch">
          <button className={clsx(mode === "image" && "active")} onClick={() => setMode("image")}>
            <ImageIcon size={15} />
            Image
          </button>
          <button className={clsx(mode === "video" && "active")} onClick={() => setMode("video")}>
            <Video size={15} />
            Video
          </button>
        </div>

        <div className="composer-card">
          <div className="composer-tags">
            <button onClick={() => setModal("style")}>
              Style: <strong>{style}</strong>
            </button>
            <button onClick={() => setModal("camera")}>
              Camera: <strong>{camera}</strong>
            </button>
            <button onClick={() => setModal("keys")}>
              <KeyRound size={13} />
              {providerLabel}
            </button>
          </div>

          <div className="composer-main">
            <button className="upload" aria-label="Upload reference">
              <Upload size={18} />
            </button>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe your scene - use @ to add characters & locations"
            />
            <div className="camera-card">
              <Camera size={15} />
              <strong>Studio Digital S35</strong>
              <span>35 mm, f/4</span>
            </div>
            <motion.button className="generate" onClick={generate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              Generate
              <Sparkles size={15} />
              {generated > 0 ? generated : 2}
            </motion.button>
          </div>

          <div className="composer-controls">
            <button>
              <Wand2 size={14} />
              Cinema Studio 3.5
            </button>
            <button onClick={() => setDuration(duration === "8s" ? "12s" : "8s")}>{duration}</button>
            <button onClick={() => setQuality(quality === "1080p" ? "2K" : "1080p")}>{quality}</button>
            <button>Auto</button>
            <button onClick={() => setBatch(Math.max(1, batch - 1))}>-</button>
            <strong>{batch}/4</strong>
            <button onClick={() => setBatch(Math.min(4, batch + 1))}>+</button>
            <button>
              <Music2 size={14} />
              Off
            </button>
            <button>@</button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {modal && (
          <ModalShell title={modalTitle(modal)} onClose={() => setModal(null)}>
            {modal === "keys" && (
              <KeyVault providerMode={providerMode} setProviderMode={setProviderMode} />
            )}
            {modal === "style" && (
              <PresetPicker values={stylePresets} value={style} onChange={setStyle} />
            )}
            {modal === "camera" && (
              <PresetPicker values={cameraPresets} value={camera} onChange={setCamera} />
            )}
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <Check size={14} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="modal-panel"
        initial={{ scale: 0.96, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 14 }}
      >
        <header>
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        {children}
      </motion.div>
    </motion.div>
  );
}

function PresetPicker({
  values,
  value,
  onChange
}: {
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="preset-grid">
      {values.map((item) => (
        <button key={item} className={clsx(item === value && "active")} onClick={() => onChange(item)}>
          {item === value && <Check size={15} />}
          {item}
        </button>
      ))}
    </div>
  );
}

function KeyVault({
  providerMode,
  setProviderMode
}: {
  providerMode: ProviderMode;
  setProviderMode: (value: ProviderMode) => void;
}) {
  return (
    <div className="key-vault">
      <div className="provider-tabs">
        {providers.map((label, index) => {
          const id = (index === 1 ? "higgsfield" : index === 2 ? "custom" : "hybrid") as ProviderMode;
          return (
            <button key={label} className={clsx(providerMode === id && "active")} onClick={() => setProviderMode(id)}>
              {label}
            </button>
          );
        })}
      </div>
      {["Higgsfield", "Claude", "Fal.ai", "Suno"].map((provider) => (
        <label key={provider}>
          {provider}
          <input type="password" placeholder="Paste API key" />
        </label>
      ))}
    </div>
  );
}

function modalTitle(modal: Exclude<Modal, null>) {
  return {
    keys: "Key Vault",
    style: "Style",
    camera: "Camera"
  }[modal];
}
