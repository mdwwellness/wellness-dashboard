import { BRAND } from "@/lib/brand";
import { formatINR } from "@/components/pages/services/services-columns";

/**
 * The two customer-facing payment WhatsApp memos, shared by the Enquiry drawer
 * and the Book-Appointment modal so both send the exact same wording. Tone is
 * deliberate: name the clinic, quote the booking + item + amount, never invent
 * urgency, never ask for a credential - that's what separates it from a scam text.
 */

/**
 * "Please pay" - includes the /pay link the customer scans. Pass `lines` when
 * several things are due (booking + add-ons): each is listed with its price and
 * `amount` becomes the total. Otherwise it's one `item` at `amount`.
 */
export function paymentRequestMessage(o: {
  name?: string;
  bookingId?: string;
  item: string;
  amount: number;
  payUrl: string;
  lines?: { label: string; amount: number }[];
}): string {
  const what =
    o.lines && o.lines.length > 1
      ? o.lines.map((l) => `${l.label} - ${formatINR(l.amount)}`).join("\n") +
        `\nTotal - ${formatINR(o.amount)}`
      : `${o.item} - ${formatINR(o.amount)}`;
  return (
    `Hi ${o.name ?? ""} - this is ${BRAND.name}, following up on our call.\n\n` +
    `Booking ${o.bookingId ?? ""}\n` +
    `${what}\n\n` +
    `View the details and pay here:\n${o.payUrl}\n\n` +
    `We'll confirm your therapist and visit time once the payment clears. ` +
    `Any questions, just reply here.`
  );
}

/** "Payment received" - the receipt sent after the money lands. */
export function paymentConfirmedMessage(o: {
  name?: string;
  amount?: number;
  method?: string;
  receivedAt: string;
  visitLabel?: string;
}): string {
  const amt = o.amount ? ` ${formatINR(o.amount)}` : "";
  const method = o.method ? ` (${o.method})` : "";
  const visit = o.visitLabel ? `\n${o.visitLabel}` : "";
  return (
    `Hi ${o.name ?? ""},\n\nPayment received${amt}${method}.\n` +
    `Received on: ${new Date(o.receivedAt).toLocaleString()}${visit}\n\nThanks!`
  );
}
