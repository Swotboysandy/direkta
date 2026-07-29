import { NextResponse } from "next/server";
import { props, projects, vendors } from "../../../../../lib/db/repo";
import { generateImage } from "../../../../../lib/agents/image";
import { isHiggsfieldMcpConnected, generateImageViaMcp } from "../../../../../lib/higgsfield/mcp";
import { skillForPart } from "../../../../../lib/skills/loader";
import { assertBudget, BudgetExceededError, TOKEN_COSTS } from "../../../../../lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Props scout — generate a reference plate for a recurring prop/artifact
 * (its "look"). Mirrors the location plate route, but for an object instead
 * of a place: isolated on a neutral backdrop so the material/shape reads
 * clearly, with no person or hand in frame to confuse the reference.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const prop = props.get(id);
  if (!prop) return NextResponse.json({ error: "Prop not found" }, { status: 404 });

  const project = projects.get(prop.project_id);
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

  const base = `Cinematic reference shot of a single object: ${prop.name}${
    prop.description ? ` — ${prop.description}` : ""
  }. Isolated on a plain neutral backdrop, studio-quality even lighting, sharp focus on its exact shape, material and color. No people, no hands, no other objects in frame. Context: ${project.premise}`;
  const skill = skillForPart("cinematography");
  const priorPlates = (prop.refs ?? []).slice(0, 2);
  const consistency = priorPlates.length
    ? "This is the SAME object as in the attached reference image(s) — identical shape, material, color and markings. "
    : "";
  const prompt = [base, skill?.body ?? "", `${consistency}One single object, no grid, collage or multiple panels. No text or watermarks.`]
    .filter(Boolean)
    .join("\n\n");

  if (!useMcp && vendor!.provider === "byteplus-image") {
    try {
      assertBudget(TOKEN_COSTS.image);
    } catch (e) {
      if (e instanceof BudgetExceededError) {
        return NextResponse.json({ error: e.message, budgetExceeded: true }, { status: 402 });
      }
      throw e;
    }
  }

  try {
    const image = useMcp
      ? await generateImageViaMcp({ prompt, aspectRatio: project.aspect_ratio })
      : await generateImage({ prompt, aspectRatio: project.aspect_ratio, vendor: vendor!, referenceImages: priorPlates });
    const refs = [image.url, ...(prop.refs ?? [])];
    props.update(id, { refs, soul_id_state: "trained", soul_id_progress: 1 });
    return NextResponse.json({ ok: true, url: image.url });
  } catch (error: any) {
    props.update(id, { soul_id_state: "failed" });
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
