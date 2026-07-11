import { nanoid } from "nanoid";
import { getDb } from "./db/client";

/**
 * BytePlus token-pack spend ledger. Generations append here (exact tokens when
 * the API reports usage, an estimate otherwise); /api/usage aggregates it for
 * the top-bar balance chip.
 */

/** Measured costs (tokens) for the models we run — used for estimates. */
export const TOKEN_COSTS = {
  image: 14_400, // Seedream 4.5, ~2K frame
  clip720: 108_900, // Seedance, 5s @ 720p
  clip1080: 245_025 // Seedance, 5s @ 1080p
} as const;

/** Total pack size; override with DIREKTA_BYTEPLUS_PACK_TOKENS. */
export function packTotal(): number {
  const n = Number(process.env.DIREKTA_BYTEPLUS_PACK_TOKENS);
  return Number.isFinite(n) && n > 0 ? n : 7_000_000;
}

export function logUsage(input: {
  kind: "image" | "video" | "baseline";
  tokens: number;
  estimated?: boolean;
  note?: string;
}): void {
  try {
    getDb()
      .prepare("INSERT INTO usage_log (id, provider, kind, tokens, estimated, note) VALUES (?, 'byteplus', ?, ?, ?, ?)")
      .run(nanoid(10), input.kind, Math.round(input.tokens), input.estimated ? 1 : 0, input.note ?? "");
  } catch {
    /* the ledger is best-effort — never fail a generation over it */
  }
}

export function usageSummary(): {
  pack_total: number;
  spent: number;
  remaining: number;
  estimates: { frames: number; clips_720p: number; clips_1080p: number };
} {
  let spent = 0;
  try {
    const row = getDb().prepare("SELECT COALESCE(SUM(tokens),0) AS s FROM usage_log WHERE provider='byteplus'").get() as {
      s: number;
    };
    spent = row?.s ?? 0;
  } catch {
    /* table may not exist yet on first boot */
  }
  const total = packTotal();
  const remaining = Math.max(0, total - spent);
  return {
    pack_total: total,
    spent,
    remaining,
    estimates: {
      frames: Math.floor(remaining / TOKEN_COSTS.image),
      clips_720p: Math.floor(remaining / TOKEN_COSTS.clip720),
      clips_1080p: Math.floor(remaining / TOKEN_COSTS.clip1080)
    }
  };
}
