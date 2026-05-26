"use client";

import { useEffect, useState } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import type { VendorConfig } from "../../lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const KIND_LABEL: Record<string, string> = {
  text: "Text",
  image: "Image",
  video: "Video"
};

export function KeyVaultPanel({ open, onClose }: Props) {
  const [vendors, setVendors] = useState<VendorConfig[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/vendors");
    const data = await res.json();
    setVendors(data.vendors);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function patch(id: string, body: Partial<VendorConfig>) {
    setBusy(id);
    await fetch("/api/vendors", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...body })
    });
    setBusy(null);
    load();
  }

  if (!open) return null;

  const groups: Array<{ kind: string; vendors: VendorConfig[] }> = ["text", "image", "video"].map(
    (kind) => ({
      kind,
      vendors: vendors.filter((v) => v.kind === kind)
    })
  );

  return (
    <aside className="key-vault" role="dialog" aria-label="Key Vault">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12
        }}
      >
        <div>
          <div className="eb">KEY VAULT</div>
          <h2
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 26,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--bone)",
              marginTop: 4
            }}
          >
            Your crew&apos;s tools
          </h2>
        </div>
        <button className="btn-ghost btn btn-sm" onClick={onClose} aria-label="Close">
          <X size={14} />
        </button>
      </header>

      <div className="kv-body">
        <p style={{ color: "var(--ink-70)", fontSize: 13, lineHeight: 1.55 }}>
          Direkta is BYOK — bring your own keys. You pay each provider directly for what you
          generate. Keys are stored locally in the SQLite vendors table and never leave this
          machine.
        </p>

        {groups.map((group) => (
          <section key={group.kind}>
            <div className="eb" style={{ marginBottom: 10 }}>
              {KIND_LABEL[group.kind]?.toUpperCase()} VENDORS · {group.vendors.length}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {group.vendors.map((vendor) => {
                const hasKey = vendor.api_key.length > 0;
                return (
                  <div key={vendor.id} className="kv-vendor">
                    <header>
                      <strong>{vendor.label}</strong>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
                        <input
                          type="checkbox"
                          checked={vendor.enabled}
                          onChange={(e) => patch(vendor.id, { enabled: e.target.checked })}
                          style={{ width: "auto", padding: 0 }}
                        />
                        enabled
                      </label>
                    </header>
                    <div className="row">
                      <input value={vendor.provider} disabled />
                      <input
                        defaultValue={vendor.model}
                        onBlur={(e) =>
                          e.target.value !== vendor.model && patch(vendor.id, { model: e.target.value })
                        }
                      />
                      <input
                        type="password"
                        placeholder={hasKey ? "•••• stored" : "Paste API key"}
                        onBlur={(e) => {
                          if (e.target.value) {
                            patch(vendor.id, { api_key: e.target.value });
                            e.target.value = "";
                          }
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginTop: 10,
                        fontFamily: "var(--f-mono)",
                        fontSize: 10,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: hasKey
                          ? vendor.enabled
                            ? "var(--green)"
                            : "var(--ink-60)"
                          : "var(--cut)"
                      }}
                    >
                      {hasKey ? (
                        <>
                          <Check size={12} /> {vendor.enabled ? "Connected" : "Disabled"}
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} /> No key
                        </>
                      )}
                      {busy === vendor.id && <span style={{ marginLeft: "auto" }}>saving…</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
