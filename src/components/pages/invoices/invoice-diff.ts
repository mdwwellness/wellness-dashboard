import type { InvoiceLineItem, PersistedInvoice } from "@/type/invoice";

/** One human-readable change between two versions of an invoice. */
export type InvoiceChange = {
  /** What changed, e.g. "Therapist" or the line item's description. */
  label: string;
  /** Previous value, already formatted. Empty string when the row is new. */
  from: string;
  /** New value, already formatted. Empty string when the row was removed. */
  to: string;
};

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

/** Line item prices arrive as numbers from the API but as strings from the
 *  inputs — compare them as numbers or `1200` vs `"1200"` reads as a change. */
const price = (li: InvoiceLineItem) => Number(li?.price) || 0;
const desc = (li: InvoiceLineItem) => String(li?.description ?? "").trim();

const text = (v: unknown) => String(v ?? "").trim();

function diffLineItems(
  before: InvoiceLineItem[],
  after: InvoiceLineItem[],
): InvoiceChange[] {
  const changes: InvoiceChange[] = [];

  // Line items carry no id, so they're compared by position. Length changes are
  // reported as added/removed rather than letting every later row shift and
  // read as "everything changed".
  const shared = Math.min(before.length, after.length);
  for (let i = 0; i < shared; i++) {
    const b = before[i];
    const a = after[i];
    const renamed = desc(b) !== desc(a);
    const repriced = price(b) !== price(a);
    if (!renamed && !repriced) continue;

    if (renamed && repriced) {
      changes.push({
        label: "Line item",
        from: `${desc(b)} — ${inr(price(b))}`,
        to: `${desc(a)} — ${inr(price(a))}`,
      });
    } else if (repriced) {
      changes.push({
        label: desc(a) || "Line item",
        from: inr(price(b)),
        to: inr(price(a)),
      });
    } else {
      changes.push({ label: "Line item", from: desc(b), to: desc(a) });
    }
  }

  for (let i = shared; i < before.length; i++) {
    changes.push({
      label: "Removed",
      from: `${desc(before[i]) || "Item"} — ${inr(price(before[i]))}`,
      to: "",
    });
  }
  for (let i = shared; i < after.length; i++) {
    changes.push({
      label: "Added",
      from: "",
      to: `${desc(after[i]) || "Item"} — ${inr(price(after[i]))}`,
    });
  }

  return changes;
}

/**
 * Every difference between two versions of an invoice, in the order a person
 * would read them: money first, then the facts around it.
 *
 * Only covers what `UpdateInvoiceInput` can actually write — diffing fields the
 * drawer can't edit would report changes nobody made.
 *
 * An empty result means nothing moved, which is what lets the drawer save a
 * paid invoice silently instead of prompting over a no-op.
 */
export function diffInvoice(
  before: PersistedInvoice,
  after: PersistedInvoice,
): InvoiceChange[] {
  const changes: InvoiceChange[] = [
    ...diffLineItems(before.line_items ?? [], after.line_items ?? []),
  ];

  const scalars: [string, string, string][] = [
    ["Therapist", text(before.therapist_name), text(after.therapist_name)],
    ["Session", text(before.session_number), text(after.session_number)],
    ["Package", text(before.package_name), text(after.package_name)],
  ];
  for (const [label, from, to] of scalars) {
    if (from !== to) changes.push({ label, from: from || "—", to: to || "—" });
  }

  if (before.payment_status !== after.payment_status) {
    const label = (s: string) => (s === "paid" ? "Paid" : "Pending");
    changes.push({
      label: "Payment",
      from: label(before.payment_status),
      to: label(after.payment_status),
    });
  }

  return changes;
}
