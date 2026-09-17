import { NextResponse } from "next/server";
import { importFromFile, getCodexStatus } from "../../../../lib/codex/token";
import { requireAdmin } from "../../../../lib/auth/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = requireAdmin(req);
  if (admin instanceof Response) return admin;
  try {
    importFromFile();
    return NextResponse.json({ ok: true, ...getCodexStatus() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err instanceof Error ? err.message : err) },
      { status: 400 }
    );
  }
}
