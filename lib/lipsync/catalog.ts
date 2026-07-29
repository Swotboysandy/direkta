/**
 * Lip-sync model catalog — Sync.so (api.sync.so/v2), the only wired vendor.
 * Pricing is Sync.so's own published per-second rate, billed to the user's
 * own Sync.so account — NOT part of Direkta's BytePlus token ledger.
 */

export interface LipsyncModel {
  id: string;
  label: string;
  description: string;
  /** Sync.so's `model` field in the generate request. */
  model: string;
  costText: string;
}

export const LIPSYNC_MODELS: LipsyncModel[] = [
  {
    id: "lipsync-2",
    label: "Lipsync 2",
    description: "Balanced default — good quality, moderate cost.",
    model: "lipsync-2",
    costText: "≈$0.04–0.05/sec"
  },
  {
    id: "lipsync-2-pro",
    label: "Lipsync 2 Pro",
    description: "Highest quality, slower and pricier.",
    model: "lipsync-2-pro",
    costText: "≈$0.067–0.083/sec"
  },
  {
    id: "sync-3",
    label: "Sync 3",
    description: "Newest model generation.",
    model: "sync-3",
    costText: "≈$0.107–0.133/sec"
  }
];

export const DEFAULT_LIPSYNC_MODEL = "lipsync-2";

export function lipsyncModel(id: string | undefined): LipsyncModel {
  return LIPSYNC_MODELS.find((m) => m.id === id) ?? LIPSYNC_MODELS[0];
}
