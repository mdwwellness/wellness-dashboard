/**
 * Phone-number input rules — the single source of truth so every phone field
 * behaves identically. Indian mobile numbers are 10 digits.
 */
export const PHONE_MAX_DIGITS = 10;

/** Strip everything but digits and hard-cap at 10 — you can't enter an 11th. */
export function toPhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, PHONE_MAX_DIGITS);
}

/** True when the value is a complete 10-digit phone number. */
export function isValidPhone(value: string | number | null | undefined): boolean {
  if (value == null) return false;
  return /^\d{10}$/.test(String(value));
}
