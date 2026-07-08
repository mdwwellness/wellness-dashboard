import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Tidies a logged activity string for display: swaps em/en dashes for a
 * colon so entries like "Session 4 of 6 completed — schedule next visit"
 * read as "Session 4 of 6 completed: schedule next visit" — no stray dashes.
 */
export function tidyActivityText(text: string): string {
  return (text ?? "").replace(/\s*[—–]\s*/g, ": ")
}
