import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Extract plain text from an uploaded PDF screenplay. The client sends a
 * multipart form with field `file`. Plain-text formats (.txt/.fountain/.fdx/.md)
 * are read client-side; only PDFs come here, because they're compressed binary
 * and need real text extraction (FileReader.readAsText yields garbage).
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buf = new Uint8Array(await file.arrayBuffer());

  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    const clean = (Array.isArray(text) ? text.join("\n\n") : text ?? "").trim();
    if (!clean) {
      return NextResponse.json(
        { error: "No selectable text found — this PDF looks like scanned images, not a text PDF." },
        { status: 422 }
      );
    }
    return NextResponse.json({ text: clean, chars: clean.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Could not read PDF: ${msg.slice(0, 200)}` }, { status: 500 });
  }
}
