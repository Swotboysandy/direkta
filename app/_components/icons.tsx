"use client";

/**
 * Icon system — HugeIcons under a lucide-compatible surface.
 *
 * Each export is a thin wrapper around <HugeiconsIcon> that keeps the same
 * name and call signature the app already used for lucide-react (`<Film
 * size={14} />`), so swapping a file over is a one-line import change. Stroke
 * colour inherits via `currentColor`, matching lucide's behaviour.
 */

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Tick02Icon,
  CheckmarkCircle02Icon,
  SparklesIcon,
  MagicWand01Icon,
  Film01Icon,
  Cancel01Icon,
  Upload01Icon,
  File01Icon,
  Flag02Icon,
  RefreshIcon,
  ViewIcon,
  Layers01Icon,
  GridIcon,
  DashboardSquare01Icon,
  DashboardSquare02Icon,
  Stamp01Icon,
  ZoomInAreaIcon,
  PlayIcon,
  PauseIcon,
  Delete02Icon,
  Add01Icon,
  ClapperboardIcon,
  Folder01Icon,
  LibraryIcon,
  Edit02Icon,
  Share08Icon,
  Image01Icon,
  SquareLock01Icon,
  Key01Icon,
  Notebook01Icon,
  BookOpen01Icon,
  UserMultiple02Icon,
  ApertureIcon,
  Scissor01Icon,
  TaskDone01Icon,
  SentIcon,
  FloppyDiskIcon,
  Settings01Icon,
  Alert01Icon,
  Menu01Icon,
  Search01Icon,
  Sun03Icon,
  Moon02Icon
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

/* HugeIcons' free set is a 1.8–2px stroke family; 1.8 reads closest to the
   lucide weight the layout was tuned against. */
function make(icon: unknown): IconType {
  return function Icon({ size = 16, strokeWidth = 1.8, color = "currentColor", ...rest }: IconProps) {
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

export const ArrowRight = make(ArrowRight01Icon);
export const ArrowLeft = make(ArrowLeft01Icon);
export const ArrowDown = make(ArrowDown01Icon);
export const ChevronDown = make(ArrowDown01Icon);
export const ChevronUp = make(ArrowUp01Icon);
export const ChevronLeft = make(ArrowLeft01Icon);
export const ChevronRight = make(ArrowRight01Icon);
export const Check = make(Tick02Icon);
export const CheckCircle = make(CheckmarkCircle02Icon);
export const Sparkles = make(SparklesIcon);
export const Wand2 = make(MagicWand01Icon);
export const Film = make(Film01Icon);
export const X = make(Cancel01Icon);
export const Upload = make(Upload01Icon);
export const FileText = make(File01Icon);
export const Flag = make(Flag02Icon);
export const RefreshCw = make(RefreshIcon);
export const RefreshCcw = make(RefreshIcon);
export const Eye = make(ViewIcon);
export const Layers = make(Layers01Icon);
export const LayoutGrid = make(GridIcon);
export const LayoutDashboard = make(DashboardSquare01Icon);
export const Grid = make(GridIcon);
export const Stamp = make(Stamp01Icon);
export const ZoomIn = make(ZoomInAreaIcon);
export const Play = make(PlayIcon);
export const Pause = make(PauseIcon);
export const Trash2 = make(Delete02Icon);
export const Plus = make(Add01Icon);
export const Boxes = make(DashboardSquare02Icon);
export const Clapperboard = make(ClapperboardIcon);
export const Folder = make(Folder01Icon);
export const Library = make(LibraryIcon);
export const PenLine = make(Edit02Icon);
export const Share2 = make(Share08Icon);
export const Image = make(Image01Icon);
export const Lock = make(SquareLock01Icon);
export const Key = make(Key01Icon);
export const KeyRound = make(Key01Icon);
export const ScrollText = make(Notebook01Icon);
export const BookOpen = make(BookOpen01Icon);
export const Users = make(UserMultiple02Icon);
export const Aperture = make(ApertureIcon);
export const Scissors = make(Scissor01Icon);
export const ListChecks = make(TaskDone01Icon);
export const Send = make(SentIcon);
export const Save = make(FloppyDiskIcon);
export const Settings = make(Settings01Icon);
export const AlertCircle = make(Alert01Icon);
export const Menu = make(Menu01Icon);
export const Search = make(Search01Icon);
export const Sun = make(Sun03Icon);
export const Moon = make(Moon02Icon);
