import { proxyBase, H3_CLIENT_ID } from "../../../../lib/agents/minimax-h3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Live generation feed.
 *
 *  ComfyUI already broadcasts execution state on its own websocket: which node
 *  is running, the sampler's step count, and periodic latent previews as binary
 *  frames. The pod is not reachable from the browser, so this route holds the
 *  websocket server-side and relays it to the client as SSE.
 *
 *  Binary preview frames arrive as an 8-byte header (event type, image type)
 *  followed by the encoded image; they are forwarded as data URLs. */
export async function GET() {
  // Must match the id generations are submitted under, or ComfyUI addresses
  // progress and preview events elsewhere and this feed only sees queue status.
  const clientId = H3_CLIENT_ID;
  const wsUrl = `${proxyBase().replace(/^https/, "wss")}/ws?clientId=${clientId}`;

  const encoder = new TextEncoder();
  let socket: WebSocket | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let open = true;
      const send = (event: string, data: unknown) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          open = false;
        }
      };
      const shutdown = () => {
        if (!open) return;
        open = false;
        if (heartbeat) clearInterval(heartbeat);
        try { socket?.close(); } catch {}
        try { controller.close(); } catch {}
      };

      socket = new WebSocket(wsUrl);
      socket.binaryType = "arraybuffer";

      socket.onopen = () => send("open", { clientId });
      socket.onerror = () => {
        send("error", { message: "Lost the connection to the pod. It may be stopped or still starting." });
        shutdown();
      };
      socket.onclose = shutdown;

      socket.onmessage = (event) => {
        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data);
            send(msg.type || "message", msg.data ?? {});
          } catch {
            // ComfyUI only sends JSON on the text channel; ignore anything else.
          }
          return;
        }
        const bytes = new Uint8Array(event.data as ArrayBuffer);
        if (bytes.byteLength <= 8) return;
        const mime = new DataView(bytes.buffer).getUint32(4) === 2 ? "image/png" : "image/jpeg";
        const b64 = Buffer.from(bytes.subarray(8)).toString("base64");
        send("preview", { image: `data:${mime};base64,${b64}` });
      };

      // Proxies drop a silent SSE connection; a comment frame keeps it alive.
      heartbeat = setInterval(() => {
        if (!open) return;
        try { controller.enqueue(encoder.encode(": ping\n\n")); } catch { shutdown(); }
      }, 15_000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      try { socket?.close(); } catch {}
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no"
    }
  });
}
