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
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

type Modal = "keys" | "genre" | "style" | "camera" | null;
type ProviderMode = "hybrid" | "higgsfield" | "custom";

const genres = ["Noir", "Drama", "Epic", "General", "Action", "Horror", "Comedy", "Sci-Fi", "Romance", "Documentary"];
const styleColumns = [
  {
    title: "Color Palette",
    values: ["Auto", "Naturalistic Clean", "Bleached Warm", "Hyper Neon", "Teal Orange Epic", "Sodium Decay", "Cold Steel", "Bleach Bypass", "Classic B/W"]
  },
  {
    title: "Lighting",
    values: ["Auto", "Soft Cross", "Contre Jour", "Overhead Fall", "Window", "Practicals", "Silhouette", "Moon Bounce", "Hard Noon"]
  },
  {
    title: "Camera Moveset",
    values: ["Auto", "Classic Static", "Silent Machine", "One Take", "Epic Scale", "Intimate Observer", "Impossible Camera", "Documentary Snap", "Dreamy Flow"]
  }
];
const cameraColumns = [
  { title: "Camera", values: ["Auto", "Studio Digital S35", "Raw 16mm", "IMAX Plate", "Handheld MiniDV", "Vintage VHS", "Alexa 65"] },
  { title: "Lens", values: ["Auto", "Clinical Sharp", "Extreme Macro", "Anamorphic", "Warm Halation", "Vintage Haze", "Soft Portrait"] },
  { title: "Focal Length", values: ["mm", "8", "14", "24", "35", "50", "75", "100", "135"] },
  { title: "Aperture", values: ["Auto", "f/11", "f/8", "f/5.6", "f/4", "f/2.8", "f/1.4", "f/1.0"] }
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
              initial={{ opacity: 0, x: "-50%", y: 24, clipPath: "inset(20% 4% 0% 4% round 22px)" }}
              animate={{ opacity: 1, x: "-50%", y: 0, clipPath: "inset(0% 0% 0% 0% round 22px)" }}
              exit={{ opacity: 0, x: "-50%", y: 18, clipPath: "inset(15% 4% 0% 4% round 22px)" }}
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
  const [selected, setSelected] = useState([4, 1, 3]);

  function updateColumn(columnIndex: number, itemIndex: number) {
    updateSelection(selected, setSelected, columnIndex, itemIndex, (next) => {
      setStyle(next.map((item, index) => styleColumns[index].values[item]).join(", "));
    });
  }

  return (
    <>
      <PanelHeader title="Style Settings" />
      <div className="style-columns">
        {styleColumns.map((column, columnIndex) => (
          <SliderColumn
            key={column.title}
            title={column.title}
            values={column.values}
            activeIndex={selected[columnIndex]}
            onSelect={(itemIndex) => updateColumn(columnIndex, itemIndex)}
          />
        ))}
      </div>
    </>
  );
}

function GenrePanel({ genre, setGenre }: { genre: string; setGenre: (value: string) => void }) {
  const activeIndex = Math.max(0, genres.indexOf(genre));
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: Math.max(0, activeIndex * 57 - 22), behavior: "smooth" });
  }, [activeIndex]);

  function move(direction: number) {
    const next = wrapIndex(activeIndex + direction, genres.length);
    setGenre(genres[next]);
  }

  return (
    <>
      <PanelHeader title="Genre" subtle="" />
      <div className="genre-panel">
        <motion.div className="genre-orb" animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} />
        <button className="genre-arrow up" onClick={() => move(-1)} aria-label="Previous genre">^</button>
        <div ref={listRef} className="genre-list" onWheel={(event) => event.deltaY > 0 ? move(1) : move(-1)}>
          {genres.map((item, index) => (
            <button key={item} className={clsx(item === genre && "active")} onClick={() => setGenre(item)}>
              <span className="mini-thumb" />
              <strong>{item}</strong>
              {index === activeIndex && <em>selected</em>}
            </button>
          ))}
        </div>
        <button className="genre-arrow down" onClick={() => move(1)} aria-label="Next genre">v</button>
      </div>
    </>
  );
}

function CameraPanel({ camera, setCamera }: { camera: string; setCamera: (value: string) => void }) {
  const [selected, setSelected] = useState([1, 1, 6, 1]);

  function updateColumn(columnIndex: number, itemIndex: number) {
    updateSelection(selected, setSelected, columnIndex, itemIndex, (next) => {
      setCamera(cameraColumns[1].values[next[1]]);
    });
  }

  return (
    <>
      <PanelHeader title="Camera Settings" />
      <div className="camera-columns">
        {cameraColumns.map((column, columnIndex) => (
          <SliderColumn
            key={column.title}
            title={column.title}
            values={column.values}
            activeIndex={selected[columnIndex]}
            onSelect={(itemIndex) => updateColumn(columnIndex, itemIndex)}
          />
        ))}
      </div>
    </>
  );
}

function PanelHeader({ title, subtle = "Manual Style - Off" }: { title: string; subtle?: string }) {
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
  activeIndex,
  onSelect
}: {
  title: string;
  values: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    windowRef.current?.scrollTo({ top: Math.max(0, activeIndex * 106 - 9), behavior: "smooth" });
  }, [activeIndex]);

  function move(direction: number) {
    onSelect(wrapIndex(activeIndex + direction, values.length));
  }

  return (
    <div className="slider-column">
      <span>{title}</span>
      <button className="arrow-button" onClick={() => move(-1)} aria-label={`Previous ${title}`}>
        ^
      </button>
      <div ref={windowRef} className="slider-window" onWheel={(event) => event.deltaY > 0 ? move(1) : move(-1)}>
        {values.map((item, index) => {
          const active = index === activeIndex;
          const distance = Math.min(Math.abs(index - activeIndex), 3);
          return (
            <motion.button
              key={item}
              className={clsx("slider-item", active && "active")}
              data-distance={distance}
              onClick={() => onSelect(index)}
              whileHover={{ scale: active ? 1.02 : 0.96 }}
            >
              <span className="thumb" />
              <strong>{item}</strong>
            </motion.button>
          );
        })}
      </div>
      <button className="arrow-button" onClick={() => move(1)} aria-label={`Next ${title}`}>
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

function updateSelection(
  selected: number[],
  setSelected: Dispatch<SetStateAction<number[]>>,
  columnIndex: number,
  itemIndex: number,
  afterUpdate: (next: number[]) => void
) {
  const next = selected.map((value, index) => (index === columnIndex ? itemIndex : value));
  setSelected(next);
  afterUpdate(next);
}

function wrapIndex(index: number, length: number) {
  return (index + length) % length;
}
