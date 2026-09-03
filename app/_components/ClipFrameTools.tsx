"use client";

import { useEffect, useRef, useState } from "react";

/** Free local frame export and a playback preview for inspecting trim points. */
export function ClipFrameTools({ nodeId, clipUrl }: { nodeId: string; clipUrl: string }) {
  const [info, setInfo] = useState<{ fps: number; duration: number; frames: number | null } | null>(null);
  const [frame, setFrame] = useState(0);
  const [note, setNote] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    setInfo(null); setFrame(0); setOutput(null); setNote("");
    fetch(`/api/stitch/nodes/${nodeId}/frame`, { signal: controller.signal })
      .then(async (r) => { const data = await r.json(); if (!controller.signal.aborted) { if (r.ok) setInfo(data); else setNote(data.error); } })
      .catch(() => { if (!controller.signal.aborted) setNote("Could not inspect the clip."); });
    return () => controller.abort();
  }, [nodeId, clipUrl]);
  const last = info ? Math.max(0, (info.frames ?? Math.floor(info.duration * info.fps)) - 1) : 0;
  return <details style={{ fontSize: 12 }}>
    <summary>Inspect / export a still frame</summary>
    <video ref={video} src={clipUrl} controls preload="metadata" style={{ width: "100%", marginTop: 8, borderRadius: "var(--r-sm)" }} />
    <label style={{ display: "grid", gap: 6, marginTop: 8 }}>
      Frame {frame}{info ? ` / ${last} · ${(frame / info.fps).toFixed(3)}s` : ""}
      <input aria-label="Still frame index" type="range" min={0} max={last} step={1} value={Math.min(frame, last)} disabled={!info}
        onChange={(e) => { const n = Number(e.target.value); setFrame(n); if (video.current && info) { video.current.pause(); video.current.currentTime = (n + 0.1) / info.fps; } }} />
    </label>
    <button disabled={!info || busy} onClick={async () => {
      setBusy(true); setNote(""); setOutput(null);
      try {
        const res = await fetch(`/api/stitch/nodes/${nodeId}/frame`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ frame, size: "1080p", fit: "contain" }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Export failed.");
        setOutput(data.url);
        setNote("PNG exported locally. Composition preserved with padding; no generation credits used.");
      } catch (error: any) { setNote(error.message); }
      finally { setBusy(false); }
    }}>{busy ? "Exporting…" : "Export 1080p PNG"}</button>
    {output && <p><a href={output} download>Download exported frame</a></p>}
    {note && <p role="status">{note}</p>}
  </details>;
}
