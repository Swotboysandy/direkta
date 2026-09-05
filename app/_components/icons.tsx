"use client";

/**
 * Icon system — Keyline, and only Keyline (brief §48).
 *
 * One barrel, one call signature (`<Film size={14} />`), so a file never
 * imports an icon library directly and the family can change here without a
 * hunt. Consistent 1.5px stroke, one optical size, corners that match the
 * interface.
 *
 * Eleven names used to come from HugeIcons because Keyline has no film
 * vocabulary — no clapperboard, aperture, film strip, sparkle or wand. A
 * second family reads as exactly that, though: the sidebar had three Keyline
 * glyphs and one HugeIcons sparkle sitting between them at a different weight.
 * So each of those now names the nearest Keyline concept rather than the
 * literal object — Record for rolling a take, Plug for connections, Toolbox
 * for skills — which is both one family and, mostly, a better label.
 *
 * Every icon renders with `currentColor`, so colour is set by the parent's
 * text colour.
 */

import * as K from "@keyline-icons/react";

export interface IconProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
  color?: string;
  title?: string;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
}

export type IconType = (props: IconProps) => React.ReactElement;

type KeylineIcon = React.ComponentType<{ size?: number | string } & React.SVGProps<SVGSVGElement>>;

function keyline(Icon: KeylineIcon): IconType {
  return function KeylineWrapped({ size = 16, color, style, strokeWidth: _sw, title, ...rest }: IconProps) {
    // Keyline draws its own stroke, so a caller's strokeWidth is dropped
    // rather than honoured: one weight across the whole interface.
    return <Icon size={size} style={color ? { color, ...style } : style} aria-hidden={title ? undefined : true} {...rest} />;
  };
}

/* ── Navigation and state ─────────────────────────────────────── */
export const ArrowRight = keyline(K.ArrowRight);
export const ArrowLeft = keyline(K.ArrowLeft);
export const ArrowDown = keyline(K.ArrowDown);
export const ChevronDown = keyline(K.ChevronDown);
export const ChevronUp = keyline(K.ChevronUp);
export const ChevronLeft = keyline(K.ChevronLeft);
export const ChevronRight = keyline(K.ChevronRight);
export const Check = keyline(K.Check);
export const CheckCircle = keyline(K.CircleCheck);
export const X = keyline(K.X);
export const Plus = keyline(K.Plus);
export const Menu = keyline(K.Menu);
export const Search = keyline(K.Search);
export const Settings = keyline(K.Settings);
export const AlertCircle = keyline(K.CircleAlert);
export const Lock = keyline(K.Lock);
export const Eye = keyline(K.Eye);
export const RefreshCw = keyline(K.RefreshCw);
export const RefreshCcw = keyline(K.RefreshCcw);
export const Upload = keyline(K.Upload);
export const Save = keyline(K.FileCheck);
export const Send = keyline(K.Forward);
export const Trash2 = keyline(K.Bin);
export const ZoomIn = keyline(K.Maximize);
export const Sun = keyline(K.Sun);
export const Moon = keyline(K.Moon);

/* ── Media and playback ───────────────────────────────────────── */
export const Play = keyline(K.Play);
export const Pause = keyline(K.Pause);
export const Heart = keyline(K.Heart);
export const Image = keyline(K.Image);
export const Music = keyline(K.MusicNote);

/* ── Structure ────────────────────────────────────────────────── */
export const LayoutDashboard = keyline(K.LayoutDashboard);
export const LayoutGrid = keyline(K.GridSquares);
export const Grid = keyline(K.Grid3x3);
export const Layers = keyline(K.Shapes);
export const Boxes = keyline(K.Package);
export const Folder = keyline(K.Folder);
export const Library = keyline(K.Images);
export const FileText = keyline(K.FileText);
export const ScrollText = keyline(K.FileText);
export const PenLine = keyline(K.PenLine);
export const Share2 = keyline(K.Share);
export const Users = keyline(K.Users);
export const ListChecks = keyline(K.ListCheck);

/* ── Film vocabulary Keyline does not have ────────────────────── */
/* The film vocabulary, named by what the control does rather than by the
   object the old icon drew. Keyline has no clapperboard or wand; it does have
   the idea behind each one. */
export const Sparkles = keyline(K.Lightbulb);     /* the AI does this for you; the plain bulb, so it is not
                                                     mistaken for the theme toggle's sun */
export const Wand2 = keyline(K.Record);           /* roll a take */
export const Film = keyline(K.SquarePlay);        /* a production, a shot on the board */
export const Clapperboard = keyline(K.Package);   /* the finished master */
export const Aperture = keyline(K.Camera);        /* camera settings */
export const Stamp = keyline(K.DoubleCheck);      /* approve, more than a tick */
export const Key = keyline(K.Plug);               /* keys and connections */
export const KeyRound = keyline(K.Plug);
export const Flag = keyline(K.Alert);             /* sent back, needs work */
export const BookOpen = keyline(K.Toolbox);       /* skills */
