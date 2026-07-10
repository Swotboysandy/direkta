import { NextResponse } from "next/server";
import { listTools, callTool } from "../../../lib/mcp/server";

/**
 * Direkta MCP endpoint — Streamable HTTP (JSON-RPC 2.0).
 * Any MCP client connects to  {PUBLIC_BASE}/api/mcp  with a Bearer token
 * (env DIREKTA_MCP_TOKEN; open if unset). Implements initialize / tools/list /
 * tools/call / ping. Hand-rolled so it needs no extra deps.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 800; // long video generations

const DEFAULT_PROTOCOL = "2025-06-18";
const TOKEN = process.env.DIREKTA_MCP_TOKEN || "";

function cors<T extends NextResponse>(res: T): T {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "content-type, authorization, mcp-session-id, mcp-protocol-version, x-api-key");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return res;
}
function authed(req: Request): boolean {
  if (!TOKEN) return true;
  const h = req.headers.get("authorization") || "";
  const bearer = h.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = bearer || req.headers.get("x-api-key") || "";
  return token === TOKEN;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  return cors(NextResponse.json({ name: "direkta-mcp", version: "1.0.0", transport: "streamable-http", status: "ok" }));
}

export async function POST(req: Request) {
  if (!authed(req)) {
    return cors(NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "unauthorized" } }, { status: 401 }));
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return cors(NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }, { status: 400 }));
  }

  const handleOne = async (msg: any): Promise<any | null> => {
    const id = msg?.id;
    const method: string = msg?.method;
    const params = msg?.params || {};
    const isNotification = id === undefined || id === null;
    try {
      switch (method) {
        case "initialize":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: params.protocolVersion || DEFAULT_PROTOCOL,
              capabilities: { tools: { listChanged: false } },
              serverInfo: { name: "direkta-mcp", version: "1.0.0" },
              instructions:
                "Direkta film pipeline. Use create_project, then generate_image (with reference_image_urls to lock a character), generate_video (image->video with baked-in camera + dialogue), and stitch_film to assemble. Assets return public URLs.",
            },
          };
        case "ping":
          return { jsonrpc: "2.0", id, result: {} };
        case "tools/list":
          return { jsonrpc: "2.0", id, result: { tools: await listTools() } };
        case "tools/call": {
          const name = params?.name;
          try {
            const content = await callTool(name, params?.arguments || {});
            return { jsonrpc: "2.0", id, result: { content, isError: false } };
          } catch (e: any) {
            return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Error: ${e?.message || String(e)}` }], isError: true } };
          }
        }
        default:
          if (isNotification || method?.startsWith("notifications/")) return null;
          return { jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${method}` } };
      }
    } catch (e: any) {
      if (isNotification) return null;
      return { jsonrpc: "2.0", id, error: { code: -32603, message: e?.message || String(e) } };
    }
  };

  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map(handleOne))).filter(Boolean);
    return out.length ? cors(NextResponse.json(out)) : cors(new NextResponse(null, { status: 202 }));
  }
  const res = await handleOne(body);
  return res ? cors(NextResponse.json(res)) : cors(new NextResponse(null, { status: 202 }));
}
