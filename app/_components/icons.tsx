"use client";

/**
 * Icon system — Keyline first, HugeIcons for what Keyline lacks (brief §48).
 *
 * One barrel, one call signature (`<Film size={14} />`), so a file never
 * imports an icon library directly and the family can change here without a
 * hunt. Keyline is the primary set: consistent 1.5px stroke, one optical
 * size, corners that match the interface. It has no film vocabulary — no
 * clapperboard, aperture, film strip, sparkle or wand — so those few come
 * from HugeIcons at a stroke weight chosen to sit beside Keyline without
 * reading as a second family.
 *
 * Both render with `currentColor`, so colour is set by the parent's text
 * colour exactly as it was before.
 */

import * as K from "@keyline-icons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  MagicWand01Icon,
  Film01Icon,
  ClapperboardIcon,
  ApertureIcon,
  Stamp01Icon,
  Scissor01Icon,
  Key01Icon,
  Flag02Icon,
  BookOpen01Icon
} from "@hugeicons/core-free-icons";

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
    // Keyline draws its own stroke; a caller's strokeWidth is for the
    // HugeIcons fallbacks and is dropped here so both families stay uniform.
    return <Icon size={size} style={color ? { color, ...style } : style} aria-hidden={title ? undefined : true} {...rest} />;
  };
}

/* HugeIcons at 1.6 reads as the same weight as Keyline's 1.5 at these sizes. */
function huge(icon: unknown): IconType {
  return function HugeWrapped({ size = 16, strokeWidth = 1.6, color = "currentColor", ...rest }: IconProps) {
    return (
      <HugeiconsIcon
        icon={icon as Parameters<typeof HugeiconsIcon>[0]["icon"]}
        size={size}
        strokeWidth={strokeWidth}
        color={color}
        {...rest}
      />
    );
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
export const Sparkles = huge(SparklesIcon);
export const Wand2 = huge(MagicWand01Icon);
export const Film = huge(Film01Icon);
export const Clapperboard = huge(ClapperboardIcon);
export const Aperture = huge(ApertureIcon);
export const Stamp = huge(Stamp01Icon);
export const Scissors = huge(Scissor01Icon);
export const Key = huge(Key01Icon);
export const KeyRound = huge(Key01Icon);
export const Flag = huge(Flag02Icon);
export const BookOpen = huge(BookOpen01Icon);
