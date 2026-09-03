"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PromptInput, PromptInputTextarea, PromptInputActions } from "./ui/prompt-input";
import { useAsync } from "../_hooks/useAsync";
import { ArrowRight, X, Sparkles } from "./icons";
import { cn } from "@/lib/utils";

/** An item from GET /api/projects/:id/assets. */
interface AssetItem {
  id: string;
  kind: "image" | "video" | "character" | "location" | "prop";
  url: string | null;
  title: string;
  subtitle: string | null;
  mentionable: boolean;
  ref_kind: "image" | "video" | null;
}

export interface ComposerSubmission {
  text: string;
  /** Attachments, in the order they were added — the order they are wired to
   *  H3's reference channels, so <Picture 1> is the first chip. */
  refs: Array<{ id: string; title: string; url: string; refKind: "image" | "video" }>;
}

interface Props {
  projectId: string;
  onSubmit: (value: ComposerSubmission) => void | Promise<void>;
  busy?: boolean;
  placeholder?: string;
  /** A prompt handed over from the agent's suggestions. */
  seed?: string | null;
  /** Called once the seed has been taken, so the same card can be used again. */
  onSeedConsumed?: () => void;
}

const KIND_LABEL: Record<AssetItem["kind"], string> = {
  character: "Character",
  location: "Location",
  prop: "Prop",
  image: "Frame",
  video: "Clip"
};

/**
 * The prompt bar.
 *
 * Typing `@` opens a picker of everything in the project — characters,
 * locations, props, and previously generated frames and clips. Choosing one
 * writes its name into the prompt and attaches it as a reference.
 *
 * The attachment is the point. Each item already knows which MiniMax H3
 * channel it belongs on (`ref_kind`, decided once in the assets route), so a
 * chip added here arrives at the generator as `ref_images` or `ref_videos`
 * without anything in between having to guess. That is what makes a character
 * stay the same character between shots.
 *
 * The chips are shown above the input rather than rendered inline inside the
 * text. True inline tokens need a contenteditable surface, and swapping the
 * textarea for one costs the browser's own undo, spellcheck and IME handling;
 * this keeps those and still shows every attachment with its thumbnail.
 */
export function Composer({ projectId, onSubmit, busy = false, placeholder, seed, onSeedConsumed }: Props) {
  const [text, setText] = useState("");
  const [refs, setRefs] = useState<ComposerSubmission["refs"]>([]);
  const [mention, setMention] = useState<{ query: string; at: number } | null>(null);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  // The picker reads the same route the canvas does, filtered to what can
  // actually be referenced.
  const assets = useAsync<AssetItem[]>(
    mention ? `/api/projects/${projectId}/assets?limit=100` : null,
    (body) => (body.items ?? []).filter((a: AssetItem) => a.mentionable && a.url)
  );

  const matches = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    const all = assets.data ?? [];
    return (q ? all.filter((a) => a.title.toLowerCase().includes(q)) : all).slice(0, 8);
  }, [mention, assets.data]);

  useEffect(() => setHighlight(0), [mention?.query]);

  // Taking a suggestion replaces the draft and puts the caret at the end, so
  // it can be edited immediately rather than being a fixed block of text.
  useEffect(() => {
    if (!seed) return;
    setText(seed);
    onSeedConsumed?.();
    const el = rootRef.current?.querySelector("textarea");
    el?.focus();
    requestAnimationFrame(() => el?.setSelectionRange(seed.length, seed.length));
  }, [seed, onSeedConsumed]);

  /** Find an unterminated `@word` immediately before the caret. */
  const detectMention = useCallback((value: string, caret: number) => {
    const upto = value.slice(0, caret);
    const at = upto.lastIndexOf("@");
    if (at === -1) return null;
    // Only a fresh token counts: `@` must start the string or follow whitespace,
    // and the run after it must not contain any.
    if (at > 0 && !/\s/.test(upto[at - 1])) return null;
    const query = upto.slice(at + 1);
    if (/\s/.test(query)) return null;
    return { query, at };
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setText(value);
      const el = rootRef.current?.querySelector("textarea");
      setMention(detectMention(value, el?.selectionStart ?? value.length));
    },
    [detectMention]
  );

  const attach = useCallback(
    (item: AssetItem) => {
      if (!mention || !item.url || !item.ref_kind) return;
      // Replace the "@query" the user was typing with the item's real name, so
      // the prompt reads as a sentence rather than carrying a raw handle.
      setText((prev) => {
        const before = prev.slice(0, mention.at);
        const after = prev.slice(mention.at + 1 + mention.query.length);
        return `${before}${item.title}${after}`;
      });
      setRefs((prev) =>
        prev.some((r) => r.id === item.id)
          ? prev
          : [...prev, { id: item.id, title: item.title, url: item.url!, refKind: item.ref_kind! }]
      );
      setMention(null);
    },
    [mention]
  );

  const detach = useCallback((id: string) => {
    setRefs((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    void onSubmit({ text: trimmed, refs });
    setText("");
    setRefs([]);
    setMention(null);
  }, [text, refs, busy, onSubmit]);

  // The picker owns the arrow keys and Enter while it is open, so Enter picks a
  // suggestion instead of submitting a half-typed prompt.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!mention || matches.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % matches.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + matches.length) % matches.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        attach(matches[highlight]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setMention(null);
      }
    },
    [mention, matches, highlight, attach]
  );

  return (
    <div className="composer" ref={rootRef} onKeyDownCapture={onKeyDown}>
      {mention && (
        <div className="composer-picker" role="listbox" aria-label="Attach a reference">
          {assets.status === "loading" && <div className="composer-picker-note">Looking…</div>}
          {assets.status === "error" && <div className="composer-picker-note">{assets.error}</div>}
          {assets.status !== "loading" && matches.length === 0 && (
            <div className="composer-picker-note">
              {mention.query ? `Nothing matching “${mention.query}”.` : "Nothing to reference yet."}
            </div>
          )}
          {matches.map((m, i) => (
            <button
              key={m.id}
              role="option"
              aria-selected={i === highlight}
              className={cn("composer-picker-row", i === highlight && "is-active")}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => attach(m)}
            >
              <span
                className="composer-picker-thumb"
                style={m.url ? { backgroundImage: `url("${m.url}")` } : undefined}
              />
              <span className="composer-picker-name">{m.title}</span>
              <span className="composer-picker-kind">{KIND_LABEL[m.kind]}</span>
            </button>
          ))}
        </div>
      )}

      {refs.length > 0 && (
        <div className="composer-refs">
          {refs.map((r) => (
            <span key={r.id} className="composer-chip" data-kind={r.refKind}>
              <span className="composer-chip-thumb" style={{ backgroundImage: `url("${r.url}")` }} />
              <span className="composer-chip-name">{r.title}</span>
              <button
                className="composer-chip-x"
                aria-label={`Remove ${r.title}`}
                onClick={() => detach(r.id)}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <PromptInput
        value={text}
        onValueChange={handleChange}
        onSubmit={submit}
        isLoading={busy}
        className="composer-input"
      >
        <PromptInputTextarea
          placeholder={placeholder ?? "What do you want to create?  Type @ to reference a character, place or shot."}
          disableAutosize={false}
        />
        <PromptInputActions className="composer-actions">
          <span className="composer-actions-right">
            {refs.length > 0 && (
              <span className="composer-count" title="References attached to this prompt">
                <Sparkles size={12} />
                {refs.length}
              </span>
            )}
            <button
              className="composer-send"
              onClick={submit}
              disabled={busy || !text.trim()}
              aria-label="Generate"
            >
              <ArrowRight size={15} />
            </button>
          </span>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}
