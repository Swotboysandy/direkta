import { NextResponse } from "next/server";
import { assets, nodes, projects, vendors } from "../../../../../lib/db/repo";
import { generateVideo } from "../../../../../lib/agents/video";
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

  const vendor = vendors.firstEnabledVideo();
  if (!vendor) {
    return NextResponse.json(
      { error: "No video vendor is enabled with an API key. Open /settings." },
      { status: 400 }
    );
  }

  const prompt = buildVideoPrompt(node.kind, node.title, node.body, project.premise);
  const referenceImage = typeof node.meta?.image === "string" ? (node.meta.image as string) : undefined;

  const reservation = reserveOrRefuse(access.user, 1, "node_video");
  if (reservation instanceof Response) return reservation;

  try {
    const video = await generateVideo({
      prompt,
      aspectRatio: project.aspect_ratio,
      referenceImageUrl: referenceImage,
      vendor
    });
    const asset = assets.create({
      node_id: id,
      kind: "video",
      url: video.url,
      prompt,
      vendor_id: vendor.id,
      meta: { aspect_ratio: project.aspect_ratio, reference: referenceImage }
    });
    const meta = { ...node.meta, video: video.url, video_prompt: prompt };
    nodes.update(id, { meta });
    return NextResponse.json({ node: nodes.get(id), asset });
  } catch (error: any) {
    reservation.refund();
    return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
  }
}

function buildVideoPrompt(kind: string, title: string, body: string, premise: string): string {
  const cleanBody = body.replace(/\s+/g, " ").trim().slice(0, 1000);
  if (kind === "shot") {
    return `${title}. ${cleanBody}. Cinematic film shot, motion, depth. Context: ${premise}`;
  }
  if (kind === "storyboard") {
    return `Live action of: ${title}. ${cleanBody}. Cinematic movement. Context: ${premise}`;
  }
  return `${title}. ${cleanBody}. Cinematic motion. Context: ${premise}`;
}
