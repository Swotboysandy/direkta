import { NextResponse } from "next/server";
import { assets, nodes, projects, vendors } from "../../../../../lib/db/repo";
import { generateImage } from "../../../../../lib/agents/image";
import { requireAccess } from "../../../../../lib/auth/guard";
import { reserveOrRefuse } from "../../../../../lib/auth/limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = requireAccess(req, "node", id);
  if (access instanceof Response) return access;
  const node = nodes.get(id);
  if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });

  const project = projects.get(node.project_id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const vendor = vendors.firstEnabledImage();
  if (!vendor) {
    return NextResponse.json(
      { error: "No image vendor is enabled with an API key. Open /settings." },
      { status: 400 }
    );
  }

  const prompt = buildPrompt(node.kind, node.title, node.body, project.premise);

  const reservation = reserveOrRefuse(access.user, 1, "node_image");
  if (reservation instanceof Response) return reservation;

  try {
    const image = await generateImage({ prompt, aspectRatio: project.aspect_ratio, vendor });
    const asset = assets.create({
      node_id: id,
      kind: "image",
      url: image.url,
      prompt,
      vendor_id: vendor.id,
      meta: { aspect_ratio: project.aspect_ratio }
    });
    const meta = { ...node.meta, image: image.url, image_prompt: prompt };
    nodes.update(id, { meta });
    return NextResponse.json({ node: nodes.get(id), asset });
  } catch (error: any) {
    reservation.refund();
    return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
  }
}

function buildPrompt(kind: string, title: string, body: string, premise: string): string {
  const cleanBody = body.replace(/\s+/g, " ").trim().slice(0, 1200);
  if (kind === "character") {
    return `Character portrait. ${title}. ${cleanBody}. Cinematic lighting, photographic, detailed face, consistent appearance for film continuity. Context: ${premise}`;
  }
  if (kind === "scene") {
    return `Cinematic film scene. Location: ${title}. ${cleanBody}. Establishing shot, cinematic composition, depth, film grain. Context: ${premise}`;
  }
  if (kind === "storyboard") {
    return `Storyboard panel. ${title}. ${cleanBody}. Black and white sketch, dynamic composition, shot framing, film board style. Context: ${premise}`;
  }
  if (kind === "shot") {
    return `Cinematic film shot. ${title}. ${cleanBody}. Photographic, motion picture composition. Context: ${premise}`;
  }
  return `${title}. ${cleanBody}. Cinematic, photographic. Context: ${premise}`;
}
