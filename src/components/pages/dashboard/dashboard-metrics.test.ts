import { describe, it, expect } from "vitest";

import {
  deriveDashboardTotals,
  deriveTherapistPersonal,
} from "./dashboard-metrics";
import type { EnquiryType } from "@/type/schema";

const rec = (over: Partial<EnquiryType>): EnquiryType =>
  ({ name: "x", phonenumber: 1, ...over }) as EnquiryType;

describe("deriveDashboardTotals", () => {
  it("separates real appointments from raw enquiries by status", () => {
    const records = [
      rec({ status: "enquiry", phonenumber: 1 }),
      rec({ status: "scheduled", phonenumber: 2 }),
      rec({ status: "ongoing", phonenumber: 3 }),
      rec({ status: "completed", phonenumber: 4 }),
    ];
    const t = deriveDashboardTotals(
      records,
      [{ isActive: true }, { isActive: false }],
      5,
    );
    expect(t.totalEnquiries).toBe(1);
    expect(t.totalAppointments).toBe(3); // scheduled + ongoing + completed
    expect(t.completedAppointments).toBe(1);
    expect(t.totalTherapists).toBe(2);
    expect(t.activeTherapists).toBe(1);
    expect(t.totalServices).toBe(5);
  });

  it("treats a missing status as an enquiry", () => {
    const t = deriveDashboardTotals([rec({ phonenumber: 9 })], [], 0);
    expect(t.totalEnquiries).toBe(1);
    expect(t.totalAppointments).toBe(0);
  });

  it("sums received payments as revenue, ignoring unpaid and cancelled", () => {
    const records = [
      rec({ status: "ongoing", paymentReceived: true, paymentAmount: 1200 }),
      rec({ status: "completed", paymentReceived: true, paymentAmount: 500 }),
      rec({ status: "scheduled", paymentReceived: false, paymentAmount: 999 }), // unpaid → ignored
      rec({ status: "cancelled", paymentReceived: true, paymentAmount: 999 }), // cancelled → ignored
      rec({ status: "ongoing", paymentReceived: true, quotedPrice: 700 }), // no paymentAmount → falls back to quotedPrice
    ];
    const t = deriveDashboardTotals(records, [], 0);
    expect(t.totalRevenue).toBe(1200 + 500 + 700);
  });
});

describe("deriveTherapistPersonal", () => {
  it("counts recommendations from stacked add-ons and recommended bookings", () => {
    const records = [
      rec({ status: "scheduled", recommendedServices: [{}, {}] as never }),
      rec({ appointmentKind: "recommended" }),
    ];
    const p = deriveTherapistPersonal(records);
    expect(p.recommendations).toBe(3); // 2 add-ons + 1 recommended booking
    expect(p.openAssigned).toBe(1); // only the scheduled one
  });
});
