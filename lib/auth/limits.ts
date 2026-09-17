import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "../db/client";
import type { User } from "./store";

/**
 * Per-user daily generation allowance.
 *
 * Counts media generations — images, frames, clips, lip-sync — over a rolling
 * 24 hours, because those are what spend GPU and API money. A request that
 * makes four frames uses four.
 *
 * Units are reserved BEFORE the vendor call, not after: checking afterwards
 * would let several requests fired at once all pass the check. node:sqlite is
 * synchronous, so the check and the insert run with nothing in between. When
 * a vendor fails, the route refunds what was not delivered, so an outage does
 * not use up a tester's allowance.
 *
 * Admins, and users whose limit is null, are unlimited — their generations are
 * still recorded so the admin page shows real usage.
 */

export class DailyLimitError extends Error {
  constructor(
    public used: number,
    public limit: number,
    public requested: number
  ) {
    super(
      limit === 0
        ? "Your account cannot generate right now. Ask the admin to raise your daily limit."
        : requested > 1
        ? `This would make ${requested} generations, but you have ${Math.max(0, limit - used)} of your ${limit} left for the next 24 hours.`
        : `You have used all ${limit} of your generations for the last 24 hours. Try again later, or ask the admin to raise your limit.`
    );
    this.name = "DailyLimitError";
  }
}

export function generationsUsed(userId: string): number {
  const row = getDb()
    .prepare(
      "SELECT COALESCE(SUM(units), 0) AS used FROM generation_events WHERE user_id = ? AND created_at > datetime('now', '-1 day')"
    )
    .get(userId) as { used: number };
  return row.used;
}

export interface Reservation {
  /** Give back units that were not delivered. Omit the count to give back all. */
  refund(units?: number): void;
}

export function reserveGenerations(user: User, units: number, kind: string): Reservation {
  const requested = Math.max(0, Math.floor(units));
  if (requested === 0) return { refund() {} };

  const db = getDb();
  const limited = user.role !== "admin" && user.daily_limit !== null;
  if (limited) {
    const used = generationsUsed(user.id);
    if (used + requested > user.daily_limit!) throw new DailyLimitError(used, user.daily_limit!, requested);
  }

  const id = nanoid(12);
  db.prepare("INSERT INTO generation_events (id, user_id, kind, units) VALUES (?, ?, ?, ?)").run(id, user.id, kind, requested);

  let held = requested;
  return {
    refund(count?: number) {
      const give = Math.min(held, Math.max(0, Math.floor(count ?? held)));
      if (give === 0) return;
      held -= give;
      if (held === 0) db.prepare("DELETE FROM generation_events WHERE id = ?").run(id);
      else db.prepare("UPDATE generation_events SET units = ? WHERE id = ?").run(held, id);
    }
  };
}

/** `reserveGenerations` with the over-limit case already turned into the 429
 *  a route returns — checked the same way as the guards, `instanceof Response`. */
export function reserveOrRefuse(user: User, units: number, kind: string): Reservation | Response {
  try {
    return reserveGenerations(user, units, kind);
  } catch (error) {
    if (error instanceof DailyLimitError) return dailyLimitResponse(error);
    throw error;
  }
}

export function dailyLimitResponse(error: DailyLimitError): Response {
  return NextResponse.json(
    { error: error.message, dailyLimit: { used: error.used, limit: error.limit, requested: error.requested } },
    { status: 429 }
  );
}
