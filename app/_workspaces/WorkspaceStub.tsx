"use client";

import { ArrowLeft, type LucideIcon } from "lucide-react";
import type { WorkspaceId } from "../../lib/types";

interface Props {
  id: WorkspaceId;
  label: string;
  crumb: string;
  description: string;
  icon: LucideIcon;
  onSwitchWorkspace: (ws: WorkspaceId) => void;
}

export function WorkspaceStub({ id, label, crumb, description, icon: Icn, onSwitchWorkspace }: Props) {
  return (
    <div className="main-inner">
      <header className="page-head">
        <div>
          <div className="crumb">{crumb}</div>
          <h1>{label}</h1>
        </div>
        <div className="actions">
          <span className="pip-state">V1 PART 2</span>
        </div>
      </header>

      <div className="workspace-stub">
        <Icn size={42} style={{ color: "var(--mute)" }} />
        <h2>{label}</h2>
        <p>{description}</p>
        <button className="btn" onClick={() => onSwitchWorkspace("dashboard")}>
          <ArrowLeft size={14} /> Back to dashboard
        </button>
      </div>
    </div>
  );
}
