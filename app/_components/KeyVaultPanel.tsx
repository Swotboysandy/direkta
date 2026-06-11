"use client";

import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { X, Check, AlertCircle, KeyRound } from "lucide-react";
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

  const groups: Array<{ kind: string; vendors: VendorConfig[] }> = ["text", "image", "video"].map(
    (kind) => ({
      kind,
      vendors: vendors.filter((v) => v.kind === kind)
    })
  );

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => !o && onClose()}
      direction="right"
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="kv-overlay" />
        <Drawer.Content className="kv-drawer" aria-describedby={undefined}>
          <Drawer.Title className="kv-drawer-head">
            <div>
              <span className="t-eyebrow">
                <KeyRound size={12} style={{ marginRight: 6, verticalAlign: -1 }} />
                KEY VAULT
              </span>
              <div className="kv-drawer-title">Your crew&apos;s tools</div>
            </div>
            <button className="btn-ghost btn btn-sm" onClick={onClose} aria-label="Close">
              <X size={14} />
            </button>
          </Drawer.Title>

          <Drawer.Description className="kv-drawer-blurb">
            Direkta is BYOK — bring your own keys. You pay each provider directly for what you
            generate. Keys are stored locally in the SQLite vendors table and never leave this
            machine.
          </Drawer.Description>

          <div className="kv-drawer-body">
            {groups.map((group) => (
              <section key={group.kind} className="kv-group">
                <div className="t-eyebrow kv-group-head">
                  {KIND_LABEL[group.kind]?.toUpperCase()} VENDORS · {group.vendors.length}
                </div>
                <div className="kv-group-list">
                  {group.vendors.map((vendor) => {
                    const hasKey = vendor.api_key.length > 0;
                    return (
                      <div key={vendor.id} className="kv-vendor">
                        <header>
                          <strong>{vendor.label}</strong>
                          <label className="kv-toggle">
                            <input
                              type="checkbox"
                              checked={vendor.enabled}
                              onChange={(e) => patch(vendor.id, { enabled: e.target.checked })}
                            />
                            enabled
                          </label>
                        </header>
                        {vendor.provider.startsWith("higgsfield") ? (
                          <>
                            <div className="row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                              <input value={vendor.provider} disabled />
                              <input
                                defaultValue={vendor.model}
                                onBlur={(e) =>
                                  e.target.value !== vendor.model && patch(vendor.id, { model: e.target.value })
                                }
                              />
                            </div>
                            <HiggsfieldCreds
                              hasKey={hasKey}
                              busy={busy === vendor.id}
                              onSave={(combined) => patch(vendor.id, { api_key: combined })}
                            />
                          </>
                        ) : (
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
                        )}
                        <div
                          className="kv-vendor-status"
                          data-state={hasKey ? (vendor.enabled ? "connected" : "disabled") : "empty"}
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** Two-field credential entry for Higgsfield Cloud (Key ID + Secret), saved
 *  combined as "ID:Secret" — the app Basic-encodes it for the API. */
function HiggsfieldCreds({
  hasKey,
  busy,
  onSave
}: {
  hasKey: boolean;
  busy: boolean;
  onSave: (combined: string) => void;
}) {
  const [keyId, setKeyId] = useState("");
  const [secret, setSecret] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
      <input
        placeholder="API Key ID"
        value={keyId}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setKeyId(e.target.value.trim())}
      />
      <input
        type="password"
        placeholder={hasKey ? "•••• secret saved — paste to replace" : "API Key Secret"}
        value={secret}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setSecret(e.target.value.trim())}
      />
      <button
        className="btn btn-sm btn-primary"
        style={{ justifyContent: "center" }}
        disabled={busy || !keyId || !secret}
        onClick={() => {
          onSave(`${keyId}:${secret}`);
          setSecret("");
        }}
      >
        {busy ? "Saving…" : hasKey ? "Update credentials" : "Save Higgsfield credentials"}
      </button>
    </div>
  );
}
