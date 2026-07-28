import { describe, it, expect } from "vitest";

import { deriveAnalytics } from "./analytics-metrics";
import type { EnquiryType } from "@/type/schema";

const rec = (over: Partial<EnquiryType>): EnquiryType =>
  ({ name: "x", phonenumber: 1, ...over }) as EnquiryType;

const NOW = new Date("2026-07-28T10:00:00.000Z");

describe("deriveAnalytics", () => {
  it("splits collected vs pending, and prices pending from quotedPrice", () => {
    const a = deriveAnalytics(
      [
        rec({ typeOfappointment: "appointment", paymentReceived: true, paymentAmount: 700 }),
        rec({ typeOfappointment: "consultation", paymentReceived: false, quotedPrice: 500 }),
        rec({ status: "cancelled", paymentReceived: true, paymentAmount: 999 }), // ignored
      ],
      NOW,
    );
    expect(a.collected).toBe(700);
    expect(a.pending).toBe(500);
    expect(a.pendingCount).toBe(1);
    expect(Math.round(a.collectedPct)).toBe(58); // 700 / 1200
  });

  it("builds the enquiry→booking→paid funnel", () => {
    const a = deriveAnalytics(
      [
        rec({ status: "enquiry" }), // enquiry only
        rec({ typeOfappointment: "appointment" }), // booked, unpaid
        rec({ typeOfappointment: "consultation", paymentReceived: true, paymentAmount: 500 }), // booked + paid
      ],
      NOW,
    );
    expect(a.pipeline).toEqual({ enquiries: 3, bookings: 2, paid: 1 });
    expect(Math.round(a.conversionPct)).toBe(33); // 1 paid / 3 enquiries
  });

  it("counts only untouched leads as needing first contact", () => {
    const a = deriveAnalytics(
      [
        rec({ status: "enquiry" }), // needs contact
        rec({ status: "enquiry", executiveReachedOut: true }), // reached
        rec({ status: "enquiry", reachAttempts: 1 }), // attempted
      ],
      NOW,
    );
    expect(a.needsFirstContact).toBe(1);
  });

  it("reports an honest empty state with no records", () => {
    const a = deriveAnalytics([], NOW);
    expect(a.hasData).toBe(false);
    expect(a.collectedPct).toBe(0);
    expect(a.revenueTrend).toHaveLength(6);
  });
});
