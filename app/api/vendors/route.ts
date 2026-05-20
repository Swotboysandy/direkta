import { NextResponse } from "next/server";
import { vendors } from "../../../lib/db/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const list = vendors.list().map((vendor) => ({
    ...vendor,
    api_key: vendor.api_key ? "•••" + vendor.api_key.slice(-4) : ""
  }));
  return NextResponse.json({ vendors: list });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  vendors.update(String(body.id), {
    label: typeof body.label === "string" ? body.label : undefined,
    model: typeof body.model === "string" ? body.model : undefined,
    api_key: typeof body.api_key === "string" ? body.api_key : undefined,
    base_url: typeof body.base_url === "string" ? body.base_url : undefined,
    enabled: typeof body.enabled === "boolean" ? body.enabled : undefined
  });
  return NextResponse.json({ ok: true });
}
