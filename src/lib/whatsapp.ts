/** Customers are Indian; numbers are stored as bare 10-digit locals. */
const COUNTRY_CODE = "91";

/**
 * Normalise a stored phone number to the international form wa.me expects:
 * country code + number, digits only, no "+", no spaces.
 *
 * wa.me silently misroutes a bare 10-digit number — it has no country to
 * resolve it against — so the code must always be present.
 */
export function toWhatsAppNumber(raw: unknown): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return null;

  // Already international (91XXXXXXXXXX).
  if (digits.length === 12 && digits.startsWith(COUNTRY_CODE)) return digits;
  // Local 10-digit.
  if (digits.length === 10) return COUNTRY_CODE + digits;
  // Trunk-prefixed local (0XXXXXXXXXX) — drop the 0, which is domestic-only.
  if (digits.length === 11 && digits.startsWith("0")) {
    return COUNTRY_CODE + digits.slice(1);
  }
  // Some other country code already on it — trust it as given.
  if (digits.length > 12) return digits;

  // Too short to dial: better to say so than to open a broken chat.
  return null;
}

/**
 * A wa.me deep link with the message pre-filled, or null when the number can't
 * be dialled. Callers should tell the user rather than opening a dead chat.
 */
export function whatsAppLink(raw: unknown, message: string): string | null {
  const number = toWhatsAppNumber(raw);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
