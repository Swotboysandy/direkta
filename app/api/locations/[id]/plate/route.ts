import { NextResponse } from "next/server";
import { locations, projects, vendors } from "../../../../../lib/db/repo";
import { generateImage } from "../../../../../lib/agents/image";
import { isHiggsfieldMcpConnected, generateImageViaMcp } from "../../../../../lib/higgsfield/mcp";
import { skillForPart } from "../../../../../lib/skills/loader";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Location scout — generate an establishing plate for a location (its "look").
 * Mirrors the character portrait route: keyed image vendor first, Higgsfield
 * OAuth fallback; new plates reference prior ones so the place stays the same.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const location = locations.get(id);
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  const project = projects.get(location.project_id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const vendor = vendors.firstEnabledImage();
  const useMcp = !vendor && isHiggsfieldMcpConnected();
  if (!useMcp && !vendor) {
    return NextResponse.json({
      ok: false,
      simulated: true,
      note: "No image generator — connect Higgsfield in the Key Vault, or add an image key, to scout a real plate."
    });
  }

  const base = `Cinematic establishing shot of ${location.name}, ${
    location.int_ext === "EXT" ? "exterior" : location.int_ext === "INT" ? "interior" : "interior/exterior"
  }${location.time_of_day ? `, ${location.time_of_day.toLowerCase()}` : ""}. No people. Atmospheric, filmic, detailed production design. Context: ${project.premise}`;
  const skill = skillForPart("cinematography");
  const priorPlates = (location.refs ?? []).slice(0, 2);
  const consistency = priorPlates.length
    ? "This is the SAME place as in the attached reference image(s) — identical architecture, layout and dressing. "
    : "";
  const prompt = [base, skill?.body ?? "", `${consistency}One single cinematic frame — no grid, collage or multiple panels. No text or watermarks.`]
    .filter(Boolean)
    .join("\n\n");

  try {
    const image = useMcp
      ? await generateImageViaMcp({ prompt, aspectRatio: project.aspect_ratio })
      : await generateImage({ prompt, aspectRatio: project.aspect_ratio, vendor: vendor!, referenceImages: priorPlates });
    const refs = [image.url, ...(location.refs ?? [])];
    locations.update(id, { refs, soul_id_state: "trained", soul_id_progress: 1 });
    return NextResponse.json({ ok: true, url: image.url });
  } catch (error: any) {
    locations.update(id, { soul_id_state: "failed" });
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
