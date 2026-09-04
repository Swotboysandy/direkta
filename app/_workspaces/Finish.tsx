"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button, IconButton } from "../_components/ui/button";
import { Status } from "../_components/ui/status";
import { EmptyState } from "../_components/ui/empty-state";
import { InlineError } from "../_components/ui/inline-error";
import { useAsync } from "../_hooks/useAsync";
import { pageIn } from "../_components/motion";
import { ArrowDown, Music, X } from "../_components/icons";
import type { Project, WorkspaceId } from "../../lib/types";

interface Props {
  project: Project;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

interface RenderResult {
  url: string;
  shots: number;
  duration: number;
  titled?: boolean;
  scored?: boolean;
  hasAudio?: boolean;
}

/**
 * Finish (brief §11): the cut, the facts about it, and the one action.
 *
 * One column. The cut is the largest thing on the page, in the production's
 * own aspect. Under it, what the master contains as statuses rather than
 * badges; then Render, with a sentence that says what it does; then the
 * score. The three "coming soon" cards that used to share the page with it
 * are gone — a control that does nothing is not a preview, it is a promise
 * the interface cannot keep.
 */
export function Finish({ project, onSwitchWorkspace }: Props) {
  const [rendering, setRendering] = useState(false);
  const [cut, setCut] = useState<RenderResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [score, setScore] = useState<{ attached: boolean; ext: string | null } | null>(null);
  const [scoreBusy, setScoreBusy] = useState(false);
  const [scoreErr, setScoreErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Whether there is anything to render, before offering to.
  const board = useAsync<number>(`/api/projects/${project.id}/stitch`, (b) => (b.nodes ?? []).length);

  useEffect(() => {
    fetch(`/api/projects/${project.id}/score`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setScore(d))
      .catch(() => {});
    // A master can also be attached from outside the pipeline; it shows the
    // same as a render.
    fetch(`/api/projects/${project.id}/final-video`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.attached && setCut({ url: d.url, shots: 0, duration: d.duration ?? 0 }))
      .catch(() => {});
  }, [project.id]);

  async function renderCut() {
    setRendering(true);
    setErr(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/render`, { method: "POST" });
      const data = await res.json();
      if (data.url) setCut(data as RenderResult);
      else setErr(data.error || "The render did not complete.");
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setRendering(false);
    }
  }

  async function uploadScore(file: File) {
    setScoreBusy(true);
    setScoreErr(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/projects/${project.id}/score`, { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) setScore({ attached: true, ext: data.ext });
      else setScoreErr(data.error || "That track could not be attached.");
    } catch (e: any) {
      setScoreErr(e?.message ?? String(e));
    } finally {
      setScoreBusy(false);
    }
  }

  async function removeScore() {
    setScoreBusy(true);
    try {
      await fetch(`/api/projects/${project.id}/score`, { method: "DELETE" });
      setScore({ attached: false, ext: null });
    } finally {
      setScoreBusy(false);
    }
  }

  // The render pads and scales to the production's own canvas, so this is
  // the real output shape — the one dynamic style on the page.
  const aspect = project.aspect_ratio.replace(":", " / ");
  const shots = board.data ?? 0;
  const nothingToRender = board.status === "ready" && shots === 0 && !cut;

  return (
    <motion.div className="main-inner finish" {...pageIn}>
      <header className="finish-head">
        <p className="phome-kicker">Finish</p>
        <h1 className="prods-title">{cut ? "The cut" : "Assemble the cut"}</h1>
        <p className="create-lede">
          The master is every shot on the board in order, with a title card, movement on stills, crossfades between
          shots, and a fade at each end, at 1080p in {project.aspect_ratio}.
        </p>
      </header>

      {nothingToRender ? (
        <EmptyState
          title="Nothing on the board to assemble"
          why="The cut is built from the shots in Shots. There are none yet."
          action={{ label: "Open Shots", onClick: () => onSwitchWorkspace("stitch") }}
        />
      ) : (
        <section className="finish-cut">
          <div className="finish-viewer" style={cut || rendering ? { aspectRatio: aspect } : undefined} data-state={rendering ? "rendering" : cut ? "ready" : "idle"}>
            {rendering ? (
              <div className="finish-rendering" role="status" aria-live="polite">
                <Status domain="generation" value="Processing" />
                <span>Assembling {shots} shots and their transitions</span>
              </div>
            ) : cut ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={cut.url} controls playsInline preload="metadata" />
            ) : (
              <div className="finish-idle">
                <span className="font-mono">
                  {shots} shot{shots === 1 ? "" : "s"} on the board
                </span>
              </div>
            )}
          </div>

          {cut && !rendering && (
            <ul className="finish-facts" aria-label="What the master contains">
              <li>
                <span className="finish-fact-k">Length</span>
                <span className="finish-fact-v font-mono tabular-nums">{cut.duration}s</span>
              </li>
              {cut.shots > 0 && (
                <li>
                  <span className="finish-fact-k">Shots</span>
                  <span className="finish-fact-v font-mono tabular-nums">{cut.shots}</span>
                </li>
              )}
              <li>
                <span className="finish-fact-k">Title card</span>
                <span className="finish-fact-v">{cut.titled ? "Yes" : "No"}</span>
              </li>
              <li>
                <span className="finish-fact-k">Audio</span>
                <span className="finish-fact-v">{cut.scored ? "Score" : cut.hasAudio ? "Clip audio" : "Silent"}</span>
              </li>
              <li>
                <Status domain="creative" value="Approved" detail="master" />
              </li>
            </ul>
          )}

          <div className="finish-actions">
            <Button intent="primary" onClick={renderCut} disabled={rendering || board.status !== "ready"}>
              {rendering ? "Rendering…" : cut ? "Render again" : "Render the cut"}
            </Button>
            {cut && !rendering && (
              <a className="finish-download" href={cut.url} download>
                <ArrowDown size={14} /> Download master
              </a>
            )}
            <span className="finish-cost">Rendering happens on this server. It costs nothing.</span>
          </div>
          {err && <InlineError message="The render did not complete." detail={err} onRetry={renderCut} />}
        </section>
      )}

      <section className="finish-score">
        <div className="finish-score-row">
          <Music size={16} className={score?.attached ? "text-status-success" : "text-fg-tertiary"} />
          <div className="finish-score-copy">
            <p className="finish-score-title">{score?.attached ? `Score attached · .${score.ext}` : "No score"}</p>
            <p className="finish-score-why">
              {score?.attached
                ? "Rides under the cut on the next render, and ducks under any clip that has its own audio."
                : "Attach an MP3, WAV or M4A and it rides under the cut with a fade in and out."}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.m4a,.wav,.aac,audio/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadScore(f);
              e.target.value = "";
            }}
          />
          <Button intent="secondary" size="sm" disabled={scoreBusy} onClick={() => fileInputRef.current?.click()}>
            {scoreBusy ? "Attaching…" : score?.attached ? "Replace" : "Attach a track"}
          </Button>
          {score?.attached && (
            <IconButton label="Remove the score" size="sm" disabled={scoreBusy} onClick={removeScore}>
              <X size={13} />
            </IconButton>
          )}
        </div>
        {scoreErr && <InlineError message={scoreErr} />}
      </section>
    </motion.div>
  );
}
