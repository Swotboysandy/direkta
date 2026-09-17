import { NextResponse } from "next/server";
import { loadSkills, saveSkill } from "../../../lib/skills/loader";
import { requireAdmin } from "../../../lib/auth/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (admin instanceof Response) return admin;
  return NextResponse.json({ skills: loadSkills(true) });
}

export async function PATCH(req: Request) {
  const admin = requireAdmin(req);
  if (admin instanceof Response) return admin;
  const body = await req.json().catch(() => ({} as { id?: string; body?: string }));
  const id = typeof body.id === "string" ? body.id : "";
  const content = typeof body.body === "string" ? body.body : "";
  if (!id) return NextResponse.json({ error: "Missing skill id" }, { status: 400 });

  try {
    const skill = saveSkill(id, content);
    if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    return NextResponse.json({ skill });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
