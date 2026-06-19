import { NextResponse } from "next/server";
import { importFromFile, getCodexStatus } from "../../../../lib/codex/token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
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
