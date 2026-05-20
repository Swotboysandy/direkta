import { runPipeline } from "../../../lib/agents/orchestrator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const projectId = String(body.project_id ?? "");
  const userMessage = String(body.message ?? "").trim();

  if (!projectId || !userMessage) {
    return new Response(JSON.stringify({ error: "project_id and message required" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        for await (const event of runPipeline({ projectId, userMessage })) {
          send(event);
        }
      } catch (error: any) {
        send({ type: "error", message: error.message ?? String(error) });
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
