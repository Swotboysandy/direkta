import { NextResponse } from "next/server";
import { loadSkills } from "../../../lib/skills/loader";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ skills: loadSkills(true) });
}
