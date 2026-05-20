"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, FileText } from "lucide-react";
import type { SkillFile, VendorConfig } from "../../lib/types";

type VendorView = Omit<VendorConfig, "api_key"> & { api_key: string };

export default function SettingsPage() {
  const [vendors, setVendors] = useState<VendorView[]>([]);
  const [skills, setSkills] = useState<SkillFile[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const loadVendors = useCallback(async () => {
    const response = await fetch("/api/vendors");
    const data = await response.json();
    setVendors(data.vendors);
  }, []);

  useEffect(() => {
    loadVendors();
    fetch("/api/skills")
      .then((response) => response.json())
      .then((data) => setSkills(data.skills));
  }, [loadVendors]);

  async function patchVendor(id: string, patch: Partial<VendorView>) {
    setSaving(id);
    await fetch("/api/vendors", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...patch })
    });
    setSaving(null);
    setSavedAt(id);
    setTimeout(() => setSavedAt(null), 1200);
    loadVendors();
  }

  return (
    <main className="settings-page">
      <header>
        <Link href="/" className="topbar-link">
          <ArrowLeft size={16} /> Canvas
        </Link>
        <h1>Settings</h1>
      </header>

      <section>
        <h2>
          <KeyRound size={18} /> Text vendors
        </h2>
        <p className="muted">
          The first enabled text vendor with a key drives Decision, Execution, and Supervision layers.
        </p>
        <div className="vendor-grid">
          {vendors.filter((vendor) => vendor.kind === "text").map((vendor) => (
            <div key={vendor.id} className="vendor-card">
              <header>
                <strong>{vendor.label}</strong>
                <label>
                  <input
                    type="checkbox"
                    checked={vendor.enabled}
                    onChange={(event) => patchVendor(vendor.id, { enabled: event.target.checked })}
                  />
                  enabled
                </label>
              </header>
              <label>
                Provider
                <input value={vendor.provider} disabled />
              </label>
              <label>
                Model
                <input
                  defaultValue={vendor.model}
                  onBlur={(event) =>
                    event.target.value !== vendor.model && patchVendor(vendor.id, { model: event.target.value })
                  }
                />
              </label>
              <label>
                API key
                <input
                  type="password"
                  placeholder={vendor.api_key || "Paste key"}
                  onBlur={(event) => {
                    if (event.target.value) {
                      patchVendor(vendor.id, { api_key: event.target.value });
                      event.target.value = "";
                    }
                  }}
                />
              </label>
              <label>
                Base URL (optional)
                <input
                  defaultValue={vendor.base_url ?? ""}
                  placeholder="https://api.example.com/v1"
                  onBlur={(event) =>
                    event.target.value !== (vendor.base_url ?? "") &&
                    patchVendor(vendor.id, { base_url: event.target.value })
                  }
                />
              </label>
              {saving === vendor.id && <small>Saving…</small>}
              {savedAt === vendor.id && <small className="ok">Saved</small>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>
          <KeyRound size={18} /> Image vendors
        </h2>
        <p className="muted">
          Configure one image provider — Fal AI (Flux) or OpenAI gpt-image-1. The first enabled image
          vendor with a key handles every <code>Generate image</code> click.
        </p>
        <div className="vendor-grid">
          {vendors.filter((vendor) => vendor.kind === "image").map((vendor) => (
            <div key={vendor.id} className="vendor-card">
              <header>
                <strong>{vendor.label}</strong>
                <label>
                  <input
                    type="checkbox"
                    checked={vendor.enabled}
                    onChange={(event) => patchVendor(vendor.id, { enabled: event.target.checked })}
                  />
                  enabled
                </label>
              </header>
              <label>
                Provider
                <input value={vendor.provider} disabled />
              </label>
              <label>
                Model
                <input
                  defaultValue={vendor.model}
                  onBlur={(event) =>
                    event.target.value !== vendor.model && patchVendor(vendor.id, { model: event.target.value })
                  }
                />
              </label>
              <label>
                API key
                <input
                  type="password"
                  placeholder={vendor.api_key || "Paste key"}
                  onBlur={(event) => {
                    if (event.target.value) {
                      patchVendor(vendor.id, { api_key: event.target.value });
                      event.target.value = "";
                    }
                  }}
                />
              </label>
              {saving === vendor.id && <small>Saving…</small>}
              {savedAt === vendor.id && <small className="ok">Saved</small>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>
          <KeyRound size={18} /> Video vendors
        </h2>
        <p className="muted">
          Scaffolded for Fal AI (Kling), Runway, and MiniMax. Fal is fully wired; Runway and MiniMax stop
          at <code>lib/agents/video.ts</code> with a clear &ldquo;needs wiring&rdquo; message — drop a key + finish the
          provider call and they activate.
        </p>
        <div className="vendor-grid">
          {vendors.filter((vendor) => vendor.kind === "video").map((vendor) => (
            <div key={vendor.id} className="vendor-card">
              <header>
                <strong>{vendor.label}</strong>
                <label>
                  <input
                    type="checkbox"
                    checked={vendor.enabled}
                    onChange={(event) => patchVendor(vendor.id, { enabled: event.target.checked })}
                  />
                  enabled
                </label>
              </header>
              <label>
                Provider
                <input value={vendor.provider} disabled />
              </label>
              <label>
                Model
                <input
                  defaultValue={vendor.model}
                  onBlur={(event) =>
                    event.target.value !== vendor.model && patchVendor(vendor.id, { model: event.target.value })
                  }
                />
              </label>
              <label>
                API key
                <input
                  type="password"
                  placeholder={vendor.api_key || "Paste key"}
                  onBlur={(event) => {
                    if (event.target.value) {
                      patchVendor(vendor.id, { api_key: event.target.value });
                      event.target.value = "";
                    }
                  }}
                />
              </label>
              {saving === vendor.id && <small>Saving…</small>}
              {savedAt === vendor.id && <small className="ok">Saved</small>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>
          <FileText size={18} /> Skill files
        </h2>
        <p className="muted">
          Each layer of the agent loads its system prompt from a markdown file under <code>data/skills/</code>.
          Edit the files on disk and refresh — no rebuild required.
        </p>
        <div className="skill-grid">
          {skills.map((skill) => (
            <div key={skill.id} className="skill-card">
              <header>
                <span className={`skill-tag layer-${skill.layer}`}>{skill.layer}</span>
                <strong>{skill.title}</strong>
              </header>
              <p>{skill.description}</p>
              <code>{skill.source}</code>
            </div>
          ))}
          {skills.length === 0 && <p className="muted">No skill files loaded.</p>}
        </div>
      </section>
    </main>
  );
}
