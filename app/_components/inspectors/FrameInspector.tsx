"use client";

import { useEffect, useState } from "react";
import type { InspectorBodyProps } from "../Inspector";
import { Button } from "../ui/button";
import { Status } from "../ui/status";
import { MediaTile } from "../ui/media-tile";
import { Check, Film, Flag, RefreshCcw, X, ZoomIn } from "../icons";
import {
  ANGLE_OPTIONS,
  APERTURE_OPTIONS,
  CAMERA_BODY_OPTIONS,
  LENS_OPTIONS,
  MOVEMENT_OPTIONS,
  SHOT_SIZE_OPTIONS,
  pad2,
  useFrameApi,
  type BeatStyle
} from "./storyboard-shared";

/**
 * The frame inspector (Task 8): one storyboard take, large, with the things
 * a director does to it — read and edit the prompt, adjust the beat's camera,
 * approve or send back, put it on the board, or roll the row again.
 *
 * Every write goes through the workspace's API so the filmstrip and the
 * inspector never disagree about a take.
 */
export function FrameInspector({ selected, close }: InspectorBodyProps) {
  const api = useFrameApi();
  const variant = api?.variants.find((v) => v.id === selected.id);
  const beat = variant ? api?.beats.find((b) => b.id === variant.beat_id) : undefined;

  const [prompt, setPrompt] = useState(variant?.prompt ?? "");
  useEffect(() => {
    setPrompt(variant?.prompt ?? "");
  }, [variant?.id, variant?.prompt]);

  if (!api || !variant || !beat) {
    return (
      <div className="sbd-insp-gone">
        <p>This frame is not on screen. Open Storyboard to inspect it.</p>
        <Button size="sm" onClick={close}>
          Close
        </Button>
      </div>
    );
  }

  const row = api.rows[beat.id];
  const style: BeatStyle = row?.style ?? {};
  const onBoard = api.stitched.has(variant.id);
  const pending = variant.id.startsWith("pending-");
  const dirty = prompt !== (variant.prompt ?? "");
  const camera = (key: keyof BeatStyle, v: string) => api.patchRow(beat.id, { style: { [key]: v } });

  return (
    <div className="sbd-insp">
      <div className="sbd-insp-media" style={{ aspectRatio: api.aspect.replace(":", " / ") }}>
        {variant.asset_url ? (
          <MediaTile url={variant.asset_url} kind="image" alt={`${beat.title}, take ${variant.n}`} className="sbd-insp-img" />
        ) : (
          <Status domain="generation" value={pending ? "Rendering" : "Failed"} />
        )}
      </div>

      <div className="sbd-insp-row">
        <span className="sbd-mono">
          Beat {pad2(beat.n)} · Take {variant.n}
        </span>
        <ApprovalStatus approval={variant.approval} />
        {onBoard && <Status domain="creative" value="Locked" detail={`Scene ${beat.n}`} />}
      </div>

      <section className="sbd-insp-section">
        <h3 className="sbd-insp-h">Approval</h3>
        <div className="sbd-insp-actions">
          <Button size="sm" intent={variant.approval === "approved" ? "primary" : "secondary"} onClick={() => api.patchVariant(variant.id, { approval: "approved" })} disabled={pending}>
            <Check size={12} /> Approve
          </Button>
          <Button size="sm" onClick={() => api.patchVariant(variant.id, { approval: "needs_work" })} disabled={pending}>
            <Flag size={12} /> Send back
          </Button>
          {variant.approval !== "pending" && (
            <Button size="sm" intent="ghost" onClick={() => api.patchVariant(variant.id, { approval: "pending" })}>
              Reset
            </Button>
          )}
        </div>
      </section>

      <section className="sbd-insp-section">
        <h3 className="sbd-insp-h">Board</h3>
        <div className="sbd-insp-actions">
          {onBoard ? (
            <Button size="sm" onClick={() => api.removeFromStitch(variant)}>
              <X size={12} /> Remove from Shots
            </Button>
          ) : (
            <Button size="sm" intent="primary" onClick={() => api.addToStitch(variant)} disabled={!variant.asset_url} title={variant.asset_url ? undefined : "There is no frame to add yet"}>
              <Film size={12} /> Add to Shots as Scene {beat.n}
            </Button>
          )}
          <Button size="sm" intent="ghost" onClick={() => api.openFocus(variant.id)} disabled={!variant.asset_url}>
            <ZoomIn size={12} /> Focus
          </Button>
        </div>
      </section>

      <section className="sbd-insp-section">
        <h3 className="sbd-insp-h">Prompt</h3>
        <textarea
          className="sbd-textarea"
          value={prompt}
          rows={6}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="No prompt recorded for this take."
          aria-label="Prompt used for this take"
        />
        {dirty && (
          <div className="sbd-insp-actions">
            <Button size="sm" intent="primary" onClick={() => api.patchVariant(variant.id, { prompt })}>
              Save prompt
            </Button>
            <Button size="sm" intent="ghost" onClick={() => setPrompt(variant.prompt ?? "")}>
              Discard
            </Button>
          </div>
        )}
      </section>

      <section className="sbd-insp-section">
        <h3 className="sbd-insp-h">Camera · whole beat</h3>
        <div className="sbd-fields">
          <Field label="Shot size" value={style.shot_size ?? "Wide"} options={SHOT_SIZE_OPTIONS} onChange={(v) => camera("shot_size", v)} />
          <Field label="Angle" value={style.camera_angle ?? "Eye level"} options={ANGLE_OPTIONS} onChange={(v) => camera("camera_angle", v)} />
          <Field label="Lens" value={style.lens ?? "35mm"} options={LENS_OPTIONS} onChange={(v) => camera("lens", v)} />
          <Field label="Movement" value={style.movement ?? "Locked"} options={MOVEMENT_OPTIONS} onChange={(v) => camera("movement", v)} />
          <Field label="Aperture" value={style.aperture ?? "f/4 (balanced)"} options={APERTURE_OPTIONS} onChange={(v) => camera("aperture", v)} />
          <Field label="Camera" value={style.camera_body ?? "Full-frame cine digital"} options={CAMERA_BODY_OPTIONS} onChange={(v) => camera("camera_body", v)} />
        </div>
        <p className="sbd-note">Camera settings belong to the beat; the next roll uses them.</p>
      </section>

      <section className="sbd-insp-section">
        <h3 className="sbd-insp-h">Beat</h3>
        <dl className="sbd-kv">
          <dt>Heading</dt>
          <dd>{beat.scene_heading || "—"}</dd>
          <dt>Cast</dt>
          <dd>{beat.characters.join(", ") || "—"}</dd>
          <dt>Mood</dt>
          <dd>{beat.mood.join(", ") || "—"}</dd>
          {variant.note && (
            <>
              <dt>Note</dt>
              <dd>{variant.note}</dd>
            </>
          )}
        </dl>
      </section>

      <div className="sbd-insp-foot">
        <Button size="sm" onClick={() => api.regenerateRow(beat.id, prompt || variant.prompt)} disabled={row?.state === "generating"} title={row?.state === "generating" ? "This beat is already rolling" : undefined}>
          <RefreshCcw size={12} /> Regenerate row
        </Button>
        <span className="sbd-note">Replaces every take for this beat. You will be asked first.</span>
      </div>
    </div>
  );
}

export function ApprovalStatus({ approval }: { approval: string }) {
  if (approval === "approved") return <Status domain="creative" value="Approved" />;
  if (approval === "needs_work") return <Status domain="creative" value="Rejected" detail="sent back" />;
  return <Status domain="creative" value="Draft" detail="awaiting call" />;
}

export function Field({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <label className="sbd-field">
      <span className="sbd-field-k">{label}</span>
      <select className="sbd-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
