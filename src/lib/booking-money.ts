import type { slotBookingZodType } from "@/type/schema";
import { bookingLabel } from "@/components/pages/enquiries/booking";

export type LedgerLine = {
  key: string;
  label: string;
  meta: string;
  amount: number;
  /** paid | due | awaiting the customer's confirmation */
  state: "paid" | "due" | "pending";
};

/**
 * Everything sold on this booking, as one list with a running total.
 *
 * The booking fee and its add-ons used to be shown in two different places (and
 * the add-ons twice over), so nobody could answer "what does this customer
 * actually owe?" without adding it up by hand. One list, one total, one place.
 */
export function bookingLedger(a: slotBookingZodType): {
  lines: LedgerLine[];
  due: number;
  paid: number;
} {
  const lines: LedgerLine[] = [];

  const fee = a.quotedPrice ?? 0;
  if (fee > 0) {
    lines.push({
      key: "booking",
      label: bookingLabel(a),
      meta: a.paymentReceived ? "Paid" : "Unpaid",
      amount: fee,
      state: a.paymentReceived ? "paid" : "due",
    });
  }

  for (const r of a.recommendedServices ?? []) {
    const confirmed = r.status === "confirmed";
    lines.push({
      key: `${r.serviceId}-${r.recommendedAt}`,
      label: r.serviceName,
      meta: !confirmed
        ? "Awaiting customer"
        : r.paymentCollected
          ? "Paid"
          : "Confirmed - unpaid",
      amount: r.quotedPrice ?? 0,
      state: !confirmed ? "pending" : r.paymentCollected ? "paid" : "due",
    });
  }

  const sum = (s: LedgerLine["state"]) =>
    lines.filter((l) => l.state === s).reduce((t, l) => t + l.amount, 0);

  // "Pending" add-ons are not owed yet - the customer hasn't agreed to them.
  return { lines, due: sum("due"), paid: sum("paid") };
}
