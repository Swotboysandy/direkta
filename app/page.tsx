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
  Wand2
} from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";

type Modal = "keys" | "genre" | "style" | "camera" | null;
type ProviderMode = "hybrid" | "higgsfield" | "custom";

const genres = ["Drama", "Epic", "General", "Action", "Horror", "Comedy"];
const styleColumns = [
  { title: "Color Palette", values: ["Hyper Neon", "Teal Orange Epic", "Neutral Film"] },
  { title: "Lighting", values: ["Auto", "Soft Cross", "Window Fall"] },
  { title: "Camera Moveset", values: ["Silent Machine", "One Take", "Epic Scale"] }
];
const cameraColumns = [
  { title: "Camera", values: ["Auto", "Raw 16mm", "Studio Digital"] },
  { title: "Lens", values: ["Auto", "Clinical Sharp", "Anamorphic"] },
  { title: "Focal Length", values: ["mm", "75", "50", "35"] },
  { title: "Aperture", values: ["Auto", "f/11", "f/1.4", "f/4"] }
];
const providers = ["Best model per task", "Higgsfield only", "Manual routing"];

export default function Home() {
  const [modal, setModal] = useState<Modal>(null);
  const [mode, setMode] = useState<"image" | "video">("video");
  const [providerMode, setProviderMode] = useState<ProviderMode>("hybrid");
  const [genre, setGenre] = useState("General");
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
        <span>Direkta Studio</span>
        <h1>What would you shoot<br />with infinite budget?</h1>
      </section>

      <AnimatePresence>
        {modal && (
          <>
            <motion.button
              className="panel-scrim"
              aria-label="Close settings"
              onClick={() => setModal(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.section
              className={clsx("settings-panel", modal)}
              initial={{ opacity: 0, y: 24, clipPath: "inset(20% 4% 0% 4% round 22px)" }}
              animate={{ opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0% round 22px)" }}
              exit={{ opacity: 0, y: 18, clipPath: "inset(15% 4% 0% 4% round 22px)" }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            >
              {modal === "keys" && <KeyVault providerMode={providerMode} setProviderMode={setProviderMode} />}
              {modal === "genre" && <GenrePanel genre={genre} setGenre={setGenre} />}
              {modal === "style" && <StylePanel style={style} setStyle={setStyle} />}
              {modal === "camera" && <CameraPanel camera={camera} setCamera={setCamera} />}
            </motion.section>
          </>
        )}
      </AnimatePresence>

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
          {mode === "video" && (
            <div className="chips">
              <button className={clsx(modal === "genre" && "active")} onClick={() => setModal("genre")}>
                Genre: {genre}
              </button>
              <button className={clsx(modal === "style" && "active")} onClick={() => setModal("style")}>
                Style: {style}
              </button>
              <button className={clsx(modal === "camera" && "active")} onClick={() => setModal("camera")}>
                Camera: {camera}
              </button>
              <button className={clsx(modal === "keys" && "active")} onClick={() => setModal("keys")}>
                {providerLabel}
              </button>
            </div>
          )}

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
            {mode === "video" ? (
              <>
                <button onClick={() => setGenre(nextValue(genres, genre, setGenre))}>
                  <Wand2 size={14} />
                  Direkta Studio
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
              </>
            ) : (
              <>
                <button>
                  <Camera size={14} />
                  Cinematic Cameras
                </button>
                <button onClick={() => setBatch(Math.max(1, batch - 1))}>-</button>
                <strong>{batch}/4</strong>
                <button onClick={() => setBatch(Math.min(4, batch + 1))}>+</button>
                <button>16:9</button>
                <button onClick={() => setQuality(quality === "1080p" ? "2K" : "1080p")}>2K</button>
                <button>1x1</button>
              </>
            )}
          </div>
        </div>
      </section>

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

function StylePanel({ style, setStyle }: { style: string; setStyle: (value: string) => void }) {
  return (
    <>
      <PanelHeader title="Style Settings" />
      <div className="style-columns">
        {styleColumns.map((column) => (
          <SliderColumn key={column.title} title={column.title} values={column.values} selected={style} onSelect={setStyle} />
        ))}
      </div>
    </>
  );
}

function GenrePanel({ genre, setGenre }: { genre: string; setGenre: (value: string) => void }) {
  return (
    <>
      <PanelHeader title="Genre" subtle="" />
      <div className="genre-panel">
        <motion.div className="genre-orb" animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} />
        <div className="genre-list">
          {genres.map((item, index) => (
            <button key={item} className={clsx(item === genre && "active")} onClick={() => setGenre(item)}>
              <span className="mini-thumb" />
              <strong>{item}</strong>
              {index === 2 && <em>selected</em>}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function CameraPanel({ camera, setCamera }: { camera: string; setCamera: (value: string) => void }) {
  return (
    <>
      <PanelHeader title="Camera Settings" />
      <div className="camera-columns">
        {cameraColumns.map((column) => (
          <SliderColumn key={column.title} title={column.title} values={column.values} selected={camera} onSelect={setCamera} />
        ))}
      </div>
    </>
  );
}

function PanelHeader({ title, subtle = "Manual Style · Off" }: { title: string; subtle?: string }) {
  return (
    <header className="panel-header">
      <h2>{title}</h2>
      {subtle && <span>{subtle}</span>}
    </header>
  );
}

function SliderColumn({
  title,
  values,
  selected,
  onSelect
}: {
  title: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="slider-column">
      <span>{title}</span>
      <button className="arrow-button" aria-label={`Previous ${title}`}>
        ^
      </button>
      <div className="slider-window">
        {values.map((item, index) => {
          const active = selected.includes(item) || item === selected || index === 1;
          return (
            <motion.button
              key={item}
              className={clsx("slider-item", active && "active")}
              onClick={() => onSelect(item)}
              whileHover={{ scale: active ? 1.02 : 0.96 }}
            >
              <span className="thumb" />
              <strong>{item}</strong>
            </motion.button>
          );
        })}
      </div>
      <button className="arrow-button" aria-label={`Next ${title}`}>
        v
      </button>
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
      <PanelHeader title="Key Vault" />
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

function nextValue(values: string[], current: string, setValue: (value: string) => void) {
  const next = values[(values.indexOf(current) + 1) % values.length];
  setValue(next);
  return next;
}
