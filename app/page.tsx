"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Aperture,
  Camera,
  Check,
  ImageIcon,
  KeyRound,
  Music2,
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

const stylePresets = ["One Take", "Soft Cross", "Clean Noir", "Neutral Film"];
const cameraPresets = ["Auto", "Clinical Sharp", "35 mm", "Studio Digital S35"];
const providers = ["Best model per task", "Higgsfield only", "Manual routing"];

export default function Home() {
  const [modal, setModal] = useState<Modal>(null);
  const [mode, setMode] = useState<"image" | "video">("video");
  const [providerMode, setProviderMode] = useState<ProviderMode>("hybrid");
  const [style, setStyle] = useState("One Take, Soft Cross");
  const [camera, setCamera] = useState("Clinical Sharp");
  const [duration, setDuration] = useState("8s");
  const [quality, setQuality] = useState("1080p");
  const [batch, setBatch] = useState(1);
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
    <main className="direkta-shell">
      <header className="topbar">
        <button className="brand" aria-label="Direkta home">
          <Aperture size={20} />
          <span>Direkta</span>
        </button>
        <button className="icon-button" onClick={() => setModal("keys")} aria-label="Open key vault">
          <KeyRound size={16} />
        </button>
      </header>

      <section className="hero-copy" aria-label="Cinema prompt">
        <span>Cinema Studio</span>
        <h1>What would you shoot<br />with infinite budget?</h1>
      </section>

      <section className="studio-dock">
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

        <div className="composer">
          <div className="chips">
            <button onClick={() => setModal("style")}>Style: {style}</button>
            <button onClick={() => setModal("camera")}>Camera: {camera}</button>
            <button onClick={() => setModal("keys")}>{providerLabel}</button>
          </div>

          <div className="composer-main">
            <button className="upload" aria-label="Upload reference">
              <Upload size={18} />
            </button>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe your scene"
            />
            <button className="camera-card" onClick={() => setModal("camera")}>
              <Camera size={15} />
              <strong>Studio Digital S35</strong>
              <span>35 mm, f/4</span>
            </button>
            <motion.button className="generate" onClick={generate} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}>
              Generate
              <Sparkles size={15} />
              {generated || 1}
            </motion.button>
          </div>

          <div className="controls">
            <button>
              <Wand2 size={14} />
              Cinema Studio
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
            {modal === "keys" && <KeyVault providerMode={providerMode} setProviderMode={setProviderMode} />}
            {modal === "style" && <PresetPicker values={stylePresets} value={style} onChange={setStyle} />}
            {modal === "camera" && <PresetPicker values={cameraPresets} value={camera} onChange={setCamera} />}
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
      <motion.div className="modal-panel" initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }}>
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
