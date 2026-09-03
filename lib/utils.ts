import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes, resolving conflicts in favour of the last one.
 *  shadcn, prompt-kit and AI SDK Elements all import this from `@/lib/utils`. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
