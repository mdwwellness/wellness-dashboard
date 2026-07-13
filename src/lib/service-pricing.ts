/**
 * Session pricing (T31).
 *
 * The GLOBAL session-rate table holds a dynamic list of tiers ([from, to]
 * sessions → ₹/session). Booking a course of N sessions is charged the rate of
 * the tier that contains N, × N. Tiers are fully user-defined — no fixed bands.
 *
 * The add-on prices (original / discounted) are a separate concern — see
 * `addonPrice` below / the recommended-service flow.
 */

/** A tier in the global session-rate table: [from, to] sessions → ₹/session. */
export type RateTier = { from: number; to: number | null; rate: number };

/** Per-session rate for a course of `sessions` sessions, from the tier table. */
export function sessionRate(tiers: RateTier[], sessions: number): number {
  if (sessions <= 0) return 0;
  const tier = tiers.find(
    (t) => sessions >= t.from && (t.to == null || sessions <= t.to),
  );
  return tier ? (tier.rate ?? 0) : 0;
}

/** Total price for booking `sessions` sessions = tier rate × count. */
export function sessionTotal(
  tiers: RateTier[] | undefined,
  sessions: number,
): number {
  if (!tiers || sessions <= 0) return 0;
  return sessionRate(tiers, sessions) * sessions;
}

/** Fields needed to price a service as an add-on (with legacy fallbacks). */
export type AddonPricedService = {
  originalPrice?: number;
  discountedPrice?: number;
  /** Deprecated fallbacks for services not yet migrated. */
  price?: number;
  recommendedPrice?: number;
};

/**
 * Add-on price: the discounted price when the therapist applies the discount
 * (recommended on the spot), otherwise the original price. Falls back to the
 * deprecated price / recommendedPrice for un-migrated services.
 */
export function addonPrice(
  service: AddonPricedService | undefined,
  applyDiscount: boolean,
): number {
  if (!service) return 0;
  const original = service.originalPrice ?? service.price ?? 0;
  const discounted =
    service.discountedPrice ?? service.recommendedPrice ?? original;
  return applyDiscount ? discounted : original;
}
