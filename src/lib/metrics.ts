import { isToday } from "date-fns";
import type { EnquiryType } from "@/type/schema";

/**
 * Shared metric helpers for the dashboard "today" cards and consolidated totals.
 * All metrics are derived client-side from data the pages already fetch.
 */

/** True if the given ISO/date string falls on the current local day. */
export function isTodayISO(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && isToday(d);
}

/**
 * createdAt / updatedAt are Mongoose-side timestamps not declared on EnquiryType,
 * so they're read via an `unknown` cast (same pattern used in the table columns).
 */
export function readCreatedISO(r: EnquiryType): string | undefined {
  return (r as unknown as { createdAt?: string }).createdAt;
}

export function readUpdatedISO(r: EnquiryType): string | undefined {
  const m = r as unknown as { updatedAt?: string; createdAt?: string };
  return m.updatedAt ?? m.createdAt;
}
