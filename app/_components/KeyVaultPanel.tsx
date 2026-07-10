"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { X, Check, KeyRound } from "./icons";
import { staggerContainer, staggerItem, tap } from "./motion";
import type { VendorConfig } from "../../lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface HiggsfieldBalance {
  connected: boolean;
  credits: number | null;
  plan: string | null;
}

const KIND_LABEL: Record<string, string> = {
  text: "Text",
  image: "Image",
  video: "Video"
};

const KIND_ORDER: VendorConfig["kind"][] = ["text", "image", "video"];

const eyebrowStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: "0.02em",
  color: "var(--mute)"
};

const cardStyle: CSSProperties = {
  padding: 16,
  background: "var(--bg)",
  borderRadius: 18,
  display: "flex",
  flexDirection: "column",
  gap: 8
};

const pillGhostSm: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  fontFamily: "var(--font-ui)",
  fontWeight: 600,
  fontSize: 13,
  color: "var(--ink)",
  backdropFilter: "blur(10px)",
  background: "color-mix(in srgb, var(--ink) 5%, transparent)",
  border: 0,
  boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--ink) 22%, transparent)",
  borderRadius: 999,
  cursor: "pointer"
};

const pillPrimarySm: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  fontFamily: "var(--font-ui)",
  fontWeight: 600,
  fontSize: 13,
  color: "var(--on-accent)",
  background: "var(--accent)",
  border: "none",
  borderRadius: 999,
  boxShadow: "var(--shadow-1)",
  cursor: "pointer"
};

/* `tap` (motion.ts) covers press/lift; these extend its hover target with the
   background swap the mockup specifies for ghost vs. primary pills. */
const GHOST_HOVER = { ...tap.whileHover, background: "color-mix(in srgb, var(--ink) 14%, transparent)" };
const PRIMARY_HOVER = { ...tap.whileHover, background: "var(--accent-hover)" };

function disabledStyle(disabled: boolean): CSSProperties {
  return disabled ? { opacity: 0.5, pointerEvents: "none" } : {};
}

function textFieldStyle(color: string): CSSProperties {
  return {
    flex: 1,
    minWidth: 0,
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color,
    background: "transparent",
    border: "none",
    outline: "none",
    padding: 0
  };
}

export function KeyVaultPanel({ open, onClose }: Props) {
  const [vendors, setVendors] = useState<VendorConfig[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [hf, setHf] = useState<{ connected: boolean; connectedAt: string | null } | null>(null);
  const [codex, setCodex] = useState<{ connected: boolean; connectedAt: string | null; error?: string } | null>(null);
  const [balance, setBalance] = useState<HiggsfieldBalance | null>(null);

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

  const loadBalance = async () => {
    try {
      const res = await fetch("/api/higgsfield/balance");
      setBalance(await res.json());
    } catch {
      setBalance(null);
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
    loadBalance();
  }

  useEffect(() => {
    if (open) {
      load();
      loadHf();
      loadCodex();
      loadBalance();
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

  const orderedVendors = KIND_ORDER.flatMap((kind) => vendors.filter((v) => v.kind === kind));

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => !o && onClose()}
      direction="right"
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.62)",
            backdropFilter: "blur(4px)",
            zIndex: 90
          }}
        />
        <Drawer.Content
          aria-describedby={undefined}
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(440px, calc(100vw - 28px))",
            background: "var(--surface)",
            boxShadow: "var(--shadow-3)",
            zIndex: 92,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            outline: "none"
          }}
        >
          <Drawer.Title
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              padding: "20px 28px",
              borderBottom: "1px solid var(--cream-deep)",
              background: "var(--bg)"
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.02em",
                  color: "var(--accent)"
                }}
              >
                <KeyRound size={12} />
                KEY VAULT
              </span>
              <h3
                style={{
                  margin: "8px 0 0",
                  fontWeight: 600,
                  fontSize: 22,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)"
                }}
              >
                Key Vault &amp; Models
              </h3>
            </div>
            <motion.button
              {...tap}
              whileHover={GHOST_HOVER}
              onClick={onClose}
              aria-label="Close"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: 6,
                color: "var(--ink)",
                backdropFilter: "blur(10px)",
                background: "color-mix(in srgb, var(--ink) 5%, transparent)",
                border: 0,
                boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--ink) 22%, transparent)",
                borderRadius: 999,
                cursor: "pointer"
              }}
            >
              <X size={14} />
            </motion.button>
          </Drawer.Title>

          <Drawer.Description
            style={{ padding: "16px 28px 0", color: "var(--mute)", fontSize: 13, lineHeight: 1.55 }}
          >
            Keys never leave this machine. Each stage uses its default vendor unless a beat overrides it.
          </Drawer.Description>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 28px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            <motion.div
              variants={staggerItem}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "var(--accent-2)",
                color: "var(--on-accent-2)",
                borderRadius: 18
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em" }}>
                Credit balance
              </span>
              <span style={{ fontWeight: 600, fontSize: 18 }}>
                {balance?.credits != null ? balance.credits.toLocaleString() : "—"}
              </span>
            </motion.div>

            {/* CODEX / OPENAI SUBSCRIPTION */}
            <motion.div variants={staggerItem} style={cardStyle}>
              <span style={eyebrowStyle}>CODEX · OPENAI SUBSCRIPTION</span>
              {codex?.connected ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>
                    <Check size={15} style={{ color: "var(--accent-3)" }} />
                    Connected — text generation uses your ChatGPT subscription.
                  </div>
                  <span style={{ fontSize: 11, color: "var(--mute)", lineHeight: 1.5 }}>
                    Token imported from <code>~/.codex/auth.json</code>. Auto-refreshes when it expires.
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <motion.button
                      {...tap}
                      whileHover={GHOST_HOVER}
                      disabled={busy === "codex"}
                      onClick={importCodex}
                      style={{ ...pillGhostSm, ...disabledStyle(busy === "codex") }}
                    >
                      {busy === "codex" ? "Re-importing…" : "Re-import token"}
                    </motion.button>
                    <motion.button
                      {...tap}
                      whileHover={GHOST_HOVER}
                      disabled={busy === "codex-dis"}
                      onClick={disconnectCodex}
                      style={{ ...pillGhostSm, ...disabledStyle(busy === "codex-dis") }}
                    >
                      {busy === "codex-dis" ? "Disconnecting…" : "Disconnect"}
                    </motion.button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>
                    Use your ChatGPT Plus / Pro subscription
                  </div>
                  <span style={{ fontSize: 11, color: "var(--mute)", lineHeight: 1.5 }}>
                    1. SSH into the VPS and run <code>codex login</code> (tunnel port 1455 first).
                    <br />
                    2. Click <strong>Import from VPS</strong> — Direkta reads <code>~/.codex/auth.json</code> and stores the token.
                  </span>
                  {codex?.error && <span style={{ fontSize: 11, color: "var(--accent)" }}>{codex.error}</span>}
                  <motion.button
                    {...tap}
                    whileHover={PRIMARY_HOVER}
                    disabled={busy === "codex"}
                    onClick={importCodex}
                    style={{ ...pillPrimarySm, alignSelf: "flex-start", ...disabledStyle(busy === "codex") }}
                  >
                    {busy === "codex" ? "Importing…" : "Import from VPS"}
                  </motion.button>
                </>
              )}
            </motion.div>

            {/* HIGGSFIELD */}
            <motion.div variants={staggerItem} style={cardStyle}>
              <span style={eyebrowStyle}>HIGGSFIELD · YOUR ACCOUNT</span>
              {hf?.connected ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>
                    <Check size={15} style={{ color: "var(--accent-3)" }} />
                    Connected — every Generate runs on your Higgsfield plan &amp; credits.
                  </div>
                  <span style={{ fontSize: 11, color: "var(--mute)", lineHeight: 1.5 }}>
                    No API keys, no per-vendor billing. Generation uses your Higgsfield account directly.
                  </span>
                  <motion.button
                    {...tap}
                    whileHover={GHOST_HOVER}
                    disabled={busy === "hf"}
                    onClick={disconnectHf}
                    style={{ ...pillGhostSm, alignSelf: "flex-start", ...disabledStyle(busy === "hf") }}
                  >
                    {busy === "hf" ? "Disconnecting…" : "Disconnect"}
                  </motion.button>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>
                    Generate on your own Higgsfield plan
                  </div>
                  <span style={{ fontSize: 11, color: "var(--mute)", lineHeight: 1.5 }}>
                    Connect your Higgsfield account once. Then every Generate button in Direkta rolls real
                    frames on your plan — no keys to paste, nothing billed separately. You log in on
                    Higgsfield; Direkta never sees your password.
                  </span>
                  <motion.a
                    {...tap}
                    whileHover={PRIMARY_HOVER}
                    href="/api/higgsfield/connect"
                    style={{ ...pillPrimarySm, alignSelf: "flex-start", textDecoration: "none" }}
                  >
                    Connect Higgsfield (OAuth)
                  </motion.a>
                </>
              )}
            </motion.div>

            {orderedVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} busy={busy} onPatch={patch} />
            ))}
          </motion.div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function VendorCard({
  vendor,
  busy,
  onPatch
}: {
  vendor: VendorConfig;
  busy: string | null;
  onPatch: (id: string, body: Partial<VendorConfig>) => void;
}) {
  const hasKey = vendor.api_key.length > 0;
  const isHf = vendor.provider.startsWith("higgsfield");
  const stateLabel = hasKey ? (vendor.enabled ? "Connected" : "Disabled") : "No key";
  const stateFg = hasKey ? (vendor.enabled ? "var(--accent-3)" : "var(--mute)") : "var(--accent)";

  return (
    <motion.div variants={staggerItem} style={cardStyle}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.02em", color: "var(--mute)" }}>
        {KIND_LABEL[vendor.kind]?.toUpperCase()}
      </span>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }} title={vendor.provider}>
          {vendor.label}
        </span>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.02em",
            color: stateFg,
            cursor: "pointer"
          }}
        >
          <input
            type="checkbox"
            checked={vendor.enabled}
            onChange={(e) => onPatch(vendor.id, { enabled: e.target.checked })}
            style={{ width: 0, height: 0, opacity: 0, padding: 0, margin: 0, border: "none" }}
          />
          {stateLabel}
        </label>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <input
          defaultValue={vendor.model}
          onBlur={(e) => e.target.value !== vendor.model && onPatch(vendor.id, { model: e.target.value })}
          style={textFieldStyle("var(--mute)")}
        />
        {isHf ? (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-soft)" }}>
            {hasKey ? vendor.api_key : "Not set"}
          </span>
        ) : (
          <input
            type="password"
            placeholder={hasKey ? vendor.api_key : "Paste API key"}
            onBlur={(e) => {
              if (e.target.value) {
                onPatch(vendor.id, { api_key: e.target.value });
                e.target.value = "";
              }
            }}
            style={{ ...textFieldStyle("var(--ink-soft)"), textAlign: "right" }}
          />
        )}
      </div>
      {isHf && (
        <HiggsfieldCreds
          hasKey={hasKey}
          busy={busy === vendor.id}
          onSave={(combined) => onPatch(vendor.id, { api_key: combined })}
        />
      )}
      {busy === vendor.id && (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.02em", color: "var(--mute)" }}>
          saving…
        </span>
      )}
    </motion.div>
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
  const fieldStyle: CSSProperties = {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "var(--ink)",
    background: "var(--surface-2)",
    border: "none",
    borderRadius: 14,
    outline: "none",
    boxSizing: "border-box"
  };
  const saveDisabled = busy || !keyId || !secret;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
      <label style={{ fontSize: 11, color: "var(--mute)" }}>
        API Key ID (looks like <code>bf28f1f3-1e30-4d06-94d9-af6e10d43129</code>)
      </label>
      <input
        placeholder="bf28f1f3-1e30-4d06-94d9-af6e10d43129"
        value={keyId}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setKeyId(e.target.value.trim())}
        style={fieldStyle}
      />
      {idMismatch && (
        <span style={{ fontSize: 11, color: "var(--accent)" }}>
          That does not look like a Key ID (UUID). Make sure you pasted the ID, not the long hex Secret.
        </span>
      )}
      <label style={{ fontSize: 11, color: "var(--mute)" }}>API Key Secret (long hex, no dashes)</label>
      <input
        type="password"
        placeholder={hasKey ? "•••• secret saved — paste to replace" : "long hex secret"}
        value={secret}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setSecret(e.target.value.trim())}
        style={fieldStyle}
      />
      <motion.button
        {...tap}
        whileHover={PRIMARY_HOVER}
        disabled={saveDisabled}
        onClick={() => {
          onSave(`${keyId}:${secret}`);
          setSecret("");
        }}
        style={{ ...pillPrimarySm, justifyContent: "center", ...disabledStyle(saveDisabled) }}
      >
        {busy ? "Saving…" : hasKey ? "Update credentials" : "Save Higgsfield credentials"}
      </motion.button>
    </div>
  );
}
