import { NextResponse } from "next/server";
import { locations } from "../../../../lib/db/repo";

export const dynamic = "force-dynamic";

/** The sibling of `PATCH /api/characters/{id}`, which already existed.
 *  Locations only ever had `plate` and `upload-plate`, so there was no way to
 *  hand a place an image it already owns — which is what "use this frame as a
 *  location reference" is (brief §35). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!locations.get(id)) return NextResponse.json({ error: "Location not found." }, { status: 404 });
  locations.update(id, {
    name: typeof body.name === "string" ? body.name : undefined,
    int_ext: body.int_ext,
    time_of_day: body.time_of_day,
    scene_count: typeof body.scene_count === "number" ? body.scene_count : undefined,
    soul_id_state: body.soul_id_state,
    soul_id_progress: typeof body.soul_id_progress === "number" ? body.soul_id_progress : undefined,
    refs: body.refs
  });
  return NextResponse.json({ location: locations.get(id) });
}
