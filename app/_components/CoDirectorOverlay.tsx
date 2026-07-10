"use client";

import { useState } from "react";
import { Sparkles, X, ArrowRight } from "lucide-react";
import type { Project, WorkspaceId } from "../../lib/types";

interface Props {
  project: Project | null;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
  onOpenKeyVault: () => void;
}

interface Step {
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  run: () => void;
}

export function CoDirectorOverlay({ project, onSwitchWorkspace, onOpenKeyVault }: Props) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  if (!open) {
    return (
      <button
        type="button"
        className="codirector-launcher"
        onClick={() => setOpen(true)}
        aria-label="Open AI Co-Director"
        title="Co-Director"
      >
        <Sparkles size={20} />
      </button>
    );
  }

  const steps: Step[] = [
    {
      eyebrow: "SETUP 01",
      title: "Project brief",
      body:
        "Lock the title, format, length, and one-line logline so every specialist agent works from the same north star.",
      action: "Review dashboard",
      run: () => onSwitchWorkspace("dashboard")
    },
    {
      eyebrow: "SETUP 02",
      title: "Connect keys",
      body:
        "Connect image and video keys before generation. I will keep the crew blocked from paid actions until the Key Vault is ready.",
      action: "Open Key Vault",
      run: onOpenKeyVault
    },
    {
      eyebrow: "SETUP 03",
      title: "Add screenplay",
      body:
        "Paste or draft the script. Script Reader turns it into beats, characters, locations, and the first production bible.",
      action: "Open Screenplay",
      run: () => onSwitchWorkspace("screenplay")
    },
    {
      eyebrow: "SETUP 04",
      title: "Train Soul IDs",
      body:
        "Casting Director builds character and location consistency before any frame is generated.",
      action: "Open Casting",
      run: () => onSwitchWorkspace("casting")
    },
    {
      eyebrow: "SETUP 05",
      title: "Select frames",
      body:
        "Cinematographer proposes storyboard variants. Pick one frame per beat and the Continuity Checker watches the line.",
      action: "Open Storyboard",
      run: () => onSwitchWorkspace("storyboard")
    },
    {
      eyebrow: "SETUP 06",
      title: "Stitch animatic",
      body:
        "Editor and Video Director assemble selected frames into clips, then Export Agent prepares the final package.",
      action: "Open Stitch",
      run: () => onSwitchWorkspace("stitch")
    }
  ];

  const step = steps[stepIndex];

  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 75,
        width: 380,
        maxWidth: "calc(100vw - 48px)",
        background: "var(--ink-05)",
        border: "1px solid var(--tungsten)",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 14
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="eb">CO-DIRECTOR · {step.eyebrow} OF 06</span>
        <button
          type="button"
          className="btn-ghost btn btn-sm"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </header>

      <h3
        style={{
          fontFamily: "var(--f-display)",
          fontSize: 26,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--bone)",
          lineHeight: 1
        }}
      >
        {step.title}
      </h3>

      <p style={{ color: "var(--ink-70)", fontSize: 13, lineHeight: 1.55 }}>{step.body}</p>

      {project && stepIndex === 0 && (
        <div className="card" style={{ padding: 12, background: "var(--ink-00)" }}>
          <div className="eb">CURRENT PROJECT</div>
          <div style={{ color: "var(--bone)", marginTop: 4 }}>{project.title}</div>
          <div style={{ color: "var(--ink-60)", fontSize: 12 }}>
            {project.format} · {project.length_estimate} · {project.aspect_ratio}
          </div>
        </div>
      )}

      <footer style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button
          type="button"
          className="btn btn-sm"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => {
            step.run();
            setStepIndex((i) => Math.min(steps.length - 1, i + 1));
          }}
        >
          {step.action} <ArrowRight size={12} />
        </button>
      </footer>
    </div>
  );
}
