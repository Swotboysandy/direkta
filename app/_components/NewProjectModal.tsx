"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { AspectRatio, LengthEstimate, ProjectFormat } from "../../lib/types";

const FORMATS: ProjectFormat[] = ["Short Film", "Music Video", "Ad", "Series", "Feature", "Other"];
const LENGTHS: LengthEstimate[] = ["Under 5 min", "5–15 min", "15–30 min", "30+ min"];
const ASPECTS: { value: AspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9 landscape" },
  { value: "9:16", label: "9:16 portrait" },
  { value: "1:1", label: "1:1 square" },
  { value: "4:5", label: "4:5 social" },
  { value: "21:9", label: "21:9 ultrawide" }
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    title: string;
    logline: string;
    format: ProjectFormat;
    length_estimate: LengthEstimate;
    aspect_ratio: AspectRatio;
  }) => Promise<void>;
}

export function NewProjectModal({ open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [logline, setLogline] = useState("");
  const [format, setFormat] = useState<ProjectFormat>("Short Film");
  const [length, setLength] = useState<LengthEstimate>("Under 5 min");
  const [aspect, setAspect] = useState<AspectRatio>("16:9");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await onCreate({
        title: title.trim(),
        logline: logline.trim(),
        format,
        length_estimate: length,
        aspect_ratio: aspect
      });
      setTitle("");
      setLogline("");
      setFormat("Short Film");
      setLength("Under 5 min");
      setAspect("16:9");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <header>
          <div className="crumb">New project</div>
          <h2>Brief the crew</h2>
        </header>

        <div className="modal-body">
          <div>
            <label>Project title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Lisbon Pact"
              required
            />
          </div>

          <div>
            <label>Logline (optional)</label>
            <textarea
              value={logline}
              onChange={(e) => setLogline(e.target.value)}
              placeholder="One sentence. What's the story?"
              rows={2}
            />
          </div>

          <div>
            <label>Format</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FORMATS.map((option) => (
                <button
                  type="button"
                  key={option}
                  className="btn btn-sm"
                  data-active={format === option}
                  style={{
                    borderColor: format === option ? "var(--tungsten)" : undefined,
                    color: format === option ? "var(--tungsten)" : undefined
                  }}
                  onClick={() => setFormat(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label>Estimated length</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {LENGTHS.map((option) => (
                <button
                  type="button"
                  key={option}
                  className="btn btn-sm"
                  style={{
                    borderColor: length === option ? "var(--tungsten)" : undefined,
                    color: length === option ? "var(--tungsten)" : undefined
                  }}
                  onClick={() => setLength(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label>Aspect ratio</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ASPECTS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className="btn btn-sm"
                  style={{
                    borderColor: aspect === option.value ? "var(--tungsten)" : undefined,
                    color: aspect === option.value ? "var(--tungsten)" : undefined
                  }}
                  onClick={() => setAspect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!title.trim() || busy}>
            {busy ? "Creating…" : "Assemble crew"} <ArrowRight size={14} />
          </button>
        </footer>
      </form>
    </div>
  );
}
