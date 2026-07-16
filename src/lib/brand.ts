/**
 * Public-facing brand + payee details for the customer payment page.
 *
 * Mirrors the BRAND block used on invoice PDFs (WellnessBackend/lib/invoicePdf.ts)
 * so a customer sees the same identity on the payment page and on the receipt
 * that follows. That consistency is the point: an unfamiliar name on a payment
 * request is exactly what makes people (rightly) suspect a scam.
 */
export const BRAND = {
  name: "MDW Wellness",
  tagline: "Home Healthcare & Physiotherapy",
  legalName: "My Dawai Wala Healthcare Services",
  website: "wellness.mydawaiwala.com",
  email: "contact@mydawaiwala.com",
  phone: "+91 92309 76362",
  primary: "#018bc4",
};

/**
 * The clinic's UPI payee details. Without these the page still shows the
 * booking and the amount, and tells the customer to call — it never shows a
 * broken pay button.
 */
export const UPI = {
  vpa: process.env.NEXT_PUBLIC_UPI_VPA?.trim() || "",
  payeeName:
    process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || BRAND.legalName,
};

/**
 * The origin customer-facing links must use — the domain the customer knows
 * from the website and their invoices.
 *
 * NOT window.location.origin: that's whatever the *executive's* browser is on,
 * which is localhost in dev and could be a preview URL in staging. A payment
 * link to an unfamiliar domain is the single loudest phishing signal there is,
 * so this is a trust control, not a config nicety.
 */
export function publicOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  return typeof window === "undefined" ? "" : window.location.origin;
}

/**
 * A UPI deep link. Opens the customer's own UPI app with payee and amount
 * pre-filled — they confirm the real payee name inside their bank's app, which
 * is what makes this trustworthy rather than a link asking for card details.
 */
export function upiLink(amount: number, reference: string): string | null {
  if (!UPI.vpa) return null;
  const params = new URLSearchParams({
    pa: UPI.vpa,
    pn: UPI.payeeName,
    am: String(amount),
    cu: "INR",
    tn: `${BRAND.name} ${reference}`,
    tr: reference,
  });
  return `upi://pay?${params.toString()}`;
}
