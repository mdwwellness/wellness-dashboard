import { describe, it, expect } from "vitest";

import { sessionRate, sessionTotal, addonPrice } from "./service-pricing";

const tiers = [
  { from: 1, to: 5, rate: 600 },
  { from: 6, to: 10, rate: 450 },
  { from: 11, to: null, rate: 400 },
];

describe("sessionRate", () => {
  it("picks the tier that contains the session count", () => {
    expect(sessionRate(tiers, 1)).toBe(600);
    expect(sessionRate(tiers, 5)).toBe(600);
    expect(sessionRate(tiers, 6)).toBe(450);
    expect(sessionRate(tiers, 10)).toBe(450);
  });
  it("uses an open-ended tier (to: null) for counts above it", () => {
    expect(sessionRate(tiers, 12)).toBe(400);
    expect(sessionRate(tiers, 99)).toBe(400);
  });
  it("returns 0 for non-positive counts or no matching tier", () => {
    expect(sessionRate(tiers, 0)).toBe(0);
    expect(sessionRate([{ from: 1, to: 5, rate: 600 }], 7)).toBe(0);
  });
});

describe("sessionTotal", () => {
  it("multiplies the tier rate by the session count", () => {
    expect(sessionTotal(tiers, 3)).toBe(1800); // 3 × 600
    expect(sessionTotal(tiers, 7)).toBe(3150); // 7 × 450
    expect(sessionTotal(tiers, 12)).toBe(4800); // 12 × 400
  });
  it("returns 0 with no tiers or no sessions", () => {
    expect(sessionTotal(undefined, 5)).toBe(0);
    expect(sessionTotal([], 5)).toBe(0);
    expect(sessionTotal(tiers, 0)).toBe(0);
  });
});

describe("addonPrice", () => {
  const s = { originalPrice: 600, discountedPrice: 450 };
  it("charges discounted when the discount is applied", () => {
    expect(addonPrice(s, true)).toBe(450);
  });
  it("charges original when the discount is off", () => {
    expect(addonPrice(s, false)).toBe(600);
  });
  it("falls back to legacy price / recommendedPrice", () => {
    expect(addonPrice({ price: 500, recommendedPrice: 400 }, true)).toBe(400);
    expect(addonPrice({ price: 500, recommendedPrice: 400 }, false)).toBe(500);
  });
  it("returns 0 for no service", () => {
    expect(addonPrice(undefined, true)).toBe(0);
  });
});
