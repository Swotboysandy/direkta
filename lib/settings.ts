import { getDb } from "./db/client";

/**
 * App-wide flags. Currently the Unlimited-browser toggles: whether the
 * headless-browser (zero-credit) path is used for frames and for clips. Both
 * default ON so that once a session is connected, nothing spends credits
 * without the user turning a toggle off.
 */
export type FlagKey = "browser_images" | "browser_video";

const DEFAULTS: Record<FlagKey, boolean> = {
  browser_images: true,
  browser_video: true
};

export function getFlag(key: FlagKey): boolean {
  const row = getDb().prepare("SELECT value FROM app_settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  if (!row) return DEFAULTS[key];
  return row.value === "1";
}

export function setFlag(key: FlagKey, on: boolean) {
  getDb()
    .prepare(
      "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, on ? "1" : "0");
}

export function allFlags(): Record<FlagKey, boolean> {
  return { browser_images: getFlag("browser_images"), browser_video: getFlag("browser_video") };
}
