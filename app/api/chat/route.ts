import { runDirector, pendingApprovals, prunePending } from "../../../lib/agents/director";
import { requireAccess } from "../../../lib/auth/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * The Director's conversation (brief §10–13, §63).
 *
 * Streams `DirectorEvent` frames as SSE, the same framing the panel has
 * always parsed. What changed underneath is that the Director now acts
 * through validated tools rather than writing prose about a canvas nobody
 * reads, and anything that would spend money stops here as an approval the
 * person answers at /api/chat/approve.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const projectId = String(body.project_id ?? "");
  const message = String(body.message ?? "").trim();
  // What the director had selected when they spoke, so "this shot" resolves
  // without them naming it.
  const selection =
    body.selection && typeof body.selection === "object"
      ? {
          kind: String((body.selection as Record<string, unknown>).kind ?? ""),
          id: String((body.selection as Record<string, unknown>).id ?? ""),
          label: String((body.selection as Record<string, unknown>).label ?? "")
        }
      : null;

  if (!projectId || !message) {
    return new Response(JSON.stringify({ error: "project_id and message required" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }
  const access = requireAccess(req, "project", projectId);
  if (access instanceof Response) return access;
  const { user } = access;
  const admin = user.role === "admin";

  prunePending();

  // The generator records approvals here; they are copied into the process-
  // wide map with their production so the approve route can run them.
  const pending = new Map<string, { name: string; args: unknown }>();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        for await (const event of runDirector({ projectId, message, selection, pending, admin })) {
          if (event.type === "approval") {
            // Approval ids are only unique within one conversation, so the key
            // carries the person: nobody can answer, or collide with, another's.
            pendingApprovals.set(`${user.id}:${event.id}`, { name: event.name, args: event.args, projectId, userId: user.id, admin, at: Date.now() });
          }
          send(event);
        }
      } catch (error: unknown) {
        send({ type: "error", message: error instanceof Error ? error.message : String(error) });
        send({ type: "done" });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no"
    }
  });
}
