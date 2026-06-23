import { getValidCodexToken } from "./token";

const WHAM_URL = "https://chatgpt.com/backend-api/wham/responses";
export const CODEX_DEFAULT_MODEL = "gpt-5.4-mini";

function buildHeaders(access_token: string, account_id: string | null): Record<string, string> {
  const h: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${access_token}`
  };
  if (account_id) h["ChatGPT-Account-Id"] = account_id;
  return h;
}

function buildBody(params: { system?: string; prompt: string; model?: string }) {
  return JSON.stringify({
    model: params.model || CODEX_DEFAULT_MODEL,
    instructions: params.system || "You are a helpful assistant.",
    input: [{ role: "user", content: params.prompt }],
    store: false,
    stream: true   // WHAM requires stream:true — non-streaming is not supported
  });
}

/** Parse a WHAM SSE stream and extract text delta chunks. */
async function readWhamStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload);
          // Responses API stream events
          if (event.type === "response.output_text.delta" && event.delta) {
            onChunk(event.delta);
          }
          // Fallback: chat-style chunk
          if (event.choices?.[0]?.delta?.content) {
            onChunk(event.choices[0].delta.content);
          }
        } catch {}
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** Non-streaming wrapper — streams internally, accumulates full text. */
export async function generateTextViaCodex(params: {
  system?: string;
  prompt: string;
  model?: string;
}): Promise<string> {
  const { access_token, account_id } = await getValidCodexToken();
  const res = await fetch(WHAM_URL, {
    method: "POST",
    headers: buildHeaders(access_token, account_id),
    body: buildBody(params)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Codex WHAM ${res.status}: ${err.slice(0, 300)}`);
  }
  let text = "";
  await readWhamStream(res.body!, (chunk) => { text += chunk; });
  return text;
}

/**
 * Async generator that yields string chunks — same shape as
 * Vercel AI SDK's streamText().textStream so the orchestrator can
 * use it without restructuring.
 */
export async function* streamCodexAsTextStream(params: {
  system?: string;
  prompt: string;
  model?: string;
}): AsyncGenerator<string> {
  const { access_token, account_id } = await getValidCodexToken();
  const res = await fetch(WHAM_URL, {
    method: "POST",
    headers: buildHeaders(access_token, account_id),
    body: buildBody(params)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Codex WHAM ${res.status}: ${err.slice(0, 300)}`);
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload);
          if (event.type === "response.output_text.delta" && event.delta) yield event.delta;
          if (event.choices?.[0]?.delta?.content) yield event.choices[0].delta.content;
        } catch {}
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Streaming call for the script/generate route.
 * Returns a ReadableStream<Uint8Array> of raw text chunks (plain text, not SSE).
 */
export async function streamTextViaCodex(params: {
  system?: string;
  prompt: string;
  model?: string;
}): Promise<ReadableStream<Uint8Array>> {
  const { access_token, account_id } = await getValidCodexToken();
  const res = await fetch(WHAM_URL, {
    method: "POST",
    headers: buildHeaders(access_token, account_id),
    body: buildBody(params)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Codex WHAM ${res.status}: ${err.slice(0, 300)}`);
  }

  const encoder = new TextEncoder();
  const srcBody = res.body!;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      readWhamStream(srcBody, (chunk) => {
        controller.enqueue(encoder.encode(chunk));
      }).then(() => controller.close()).catch((e) => controller.error(e));
    }
  });
}
