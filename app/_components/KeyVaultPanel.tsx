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
  const [hf, setHf] = useState<{ connected: boolean; connectedAt: string | null } | null>(null);
  const [codex, setCodex] = useState<{ connected: boolean; connectedAt: string | null; error?: string } | null>(null);

  const load = async () => {
    const res = await fetch("/api/vendors");
    const data = await res.json();
    setVendors(data.vendors);
  };

  const loadHf = async () => {
    try {
      const res = await fetch("/api/higgsfield/status");
      setHf(await res.json());
    } catch {
      setHf({ connected: false, connectedAt: null });
    }
  };

  const loadCodex = async () => {
    try {
      const res = await fetch("/api/codex/status");
      setCodex(await res.json());
    } catch {
      setCodex({ connected: false, connectedAt: null });
    }
  };

  async function importCodex() {
    setBusy("codex");
    setCodex((c) => c ? { ...c, error: undefined } : null);
    try {
      const res = await fetch("/api/codex/import", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setCodex({ connected: false, connectedAt: null, error: data.error });
      } else {
        setCodex({ connected: true, connectedAt: data.connectedAt });
      }
    } catch (err) {
      setCodex({ connected: false, connectedAt: null, error: String(err) });
    } finally {
      setBusy(null);
    }
  }

  async function disconnectCodex() {
    setBusy("codex-dis");
    await fetch("/api/codex/disconnect", { method: "POST" });
    setBusy(null);
    loadCodex();
  }

  async function disconnectHf() {
    setBusy("hf");
    await fetch("/api/higgsfield/disconnect", { method: "POST" });
    setBusy(null);
    loadHf();
  }

  useEffect(() => {
    if (open) {
      load();
      loadHf();
      loadCodex();
    }
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
            {/* ── CODEX / OPENAI SUBSCRIPTION ── */}
            <section className="kv-group">
              <div className="t-eyebrow kv-group-head">CODEX · OPENAI SUBSCRIPTION</div>
              <div className="kv-vendor" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {codex?.connected ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                      <Check size={15} style={{ color: "var(--viridian, #2e7d5b)" }} />
                      Connected — text generation uses your ChatGPT subscription.
                    </div>
                    <span className="t-mute" style={{ fontSize: 11 }}>
                      Token imported from <code>~/.codex/auth.json</code>. Auto-refreshes when it expires.
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-sm"
                        disabled={busy === "codex"}
                        onClick={importCodex}
                      >
                        {busy === "codex" ? "Re-importing…" : "Re-import token"}
                      </button>
                      <button
                        className="btn btn-sm"
                        disabled={busy === "codex-dis"}
                        onClick={disconnectCodex}
                      >
                        {busy === "codex-dis" ? "Disconnecting…" : "Disconnect"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 600 }}>Use your ChatGPT Plus / Pro subscription</div>
                    <span className="t-mute" style={{ fontSize: 11 }}>
                      1. SSH into the VPS and run <code>codex login</code> (tunnel port 1455 first).<br />
                      2. Click <strong>Import from VPS</strong> — Direkta reads <code>~/.codex/auth.json</code> and stores the token.
                    </span>
                    {codex?.error && (
                      <span style={{ fontSize: 11, color: "var(--accent)" }}>{codex.error}</span>
                    )}
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ alignSelf: "flex-start" }}
                      disabled={busy === "codex"}
                      onClick={importCodex}
                    >
                      {busy === "codex" ? "Importing…" : "Import from VPS"}
                    </button>
                  </>
                )}
              </div>
            </section>

            {/* ── HIGGSFIELD ── */}
            <section className="kv-group">
              <div className="t-eyebrow kv-group-head">HIGGSFIELD · YOUR ACCOUNT</div>
              <div className="kv-vendor" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {hf?.connected ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                      <Check size={15} style={{ color: "var(--viridian, #2e7d5b)" }} />
                      Connected — every Generate runs on your Higgsfield plan &amp; credits.
                    </div>
                    <span className="t-mute" style={{ fontSize: 11 }}>
                      No API keys, no per-vendor billing. Generation uses your Higgsfield account directly.
                    </span>
                    <button
                      className="btn btn-sm"
                      style={{ alignSelf: "flex-start" }}
                      disabled={busy === "hf"}
                      onClick={disconnectHf}
                    >
                      {busy === "hf" ? "Disconnecting…" : "Disconnect"}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 600 }}>Generate on your own Higgsfield plan</div>
                    <span className="t-mute" style={{ fontSize: 11 }}>
                      Connect your Higgsfield account once. Then every Generate button in Direkta
                      rolls real frames on your plan — no keys to paste, nothing billed separately.
                      You log in on Higgsfield; Direkta never sees your password.
                    </span>
                    <a className="btn btn-sm btn-primary" style={{ alignSelf: "flex-start" }} href="/api/higgsfield/connect">
                      Connect Higgsfield (OAuth)
                    </a>
                  </>
                )}
              </div>
            </section>
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
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(keyId);
  const idMismatch = keyId.length > 0 && !looksLikeUuid;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
      <label className="t-mute" style={{ fontSize: 11 }}>API Key ID (looks like <code>bf28f1f3-1e30-4d06-94d9-af6e10d43129</code>)</label>
      <input
        placeholder="bf28f1f3-1e30-4d06-94d9-af6e10d43129"
        value={keyId}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setKeyId(e.target.value.trim())}
      />
      {idMismatch && (
        <span style={{ fontSize: 11, color: "var(--accent)" }}>
          That does not look like a Key ID (UUID). Make sure you pasted the ID, not the long hex Secret.
        </span>
      )}
      <label className="t-mute" style={{ fontSize: 11 }}>API Key Secret (long hex, no dashes)</label>
      <input
        type="password"
        placeholder={hasKey ? "•••• secret saved — paste to replace" : "long hex secret"}
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
