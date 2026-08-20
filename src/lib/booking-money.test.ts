import { describe, expect, it } from "vitest";

import { bookingLedger } from "./booking-money";

describe("bookingLedger", () => {
  it("treats booking as paid when paymentReceived is true", () => {
    const { due, lines } = bookingLedger({
      quotedPrice: 500,
      paymentReceived: true,
    } as any);
    expect(due).toBe(0);
    expect(lines[0].state).toBe("paid");
  });

  it("includes confirmed unpaid add-ons in due after booking is paid", () => {
    const { due, lines } = bookingLedger({
      quotedPrice: 500,
      paymentReceived: true,
      typeOfappointment: "consultation",
      recommendedServices: [
        {
          serviceId: "s1",
          serviceName: "Accupuncture",
          quotedPrice: 1500,
          status: "confirmed",
          recommendedAt: "2026-08-05T10:00:00.000Z",
          paymentCollected: false,
        },
      ],
    } as any);
    expect(due).toBe(1500);
    expect(lines.find((l) => l.label === "Accupuncture")?.state).toBe("due");
    expect(lines.find((l) => l.key === "booking")?.state).toBe("paid");
  });

  it("excludes pending add-ons from due", () => {
    const { due } = bookingLedger({
      quotedPrice: 500,
      paymentReceived: false,
      recommendedServices: [
        {
          serviceId: "s1",
          serviceName: "Massage",
          quotedPrice: 800,
          status: "pending",
          recommendedAt: "2026-08-05T10:00:00.000Z",
        },
      ],
    } as any);
    expect(due).toBe(500);
  });

  it("returns zero due when booking and add-ons are all paid", () => {
    const { due } = bookingLedger({
      quotedPrice: 500,
      paymentReceived: true,
      recommendedServices: [
        {
          serviceId: "s1",
          serviceName: "Accupuncture",
          quotedPrice: 1500,
          status: "confirmed",
          recommendedAt: "2026-08-05T10:00:00.000Z",
          paymentCollected: true,
        },
      ],
    } as any);
    expect(due).toBe(0);
  });

  it("uses quotedPrice as line total for multi-session add-ons", () => {
    const { due, lines } = bookingLedger({
      quotedPrice: 700,
      paymentReceived: true,
      recommendedServices: [
        {
          serviceId: "s1",
          serviceName: "Home Visit Consultation",
          quotedPrice: 3000,
          sessions: 5,
          status: "confirmed",
          recommendedAt: "2026-08-05T10:00:00.000Z",
          paymentCollected: false,
        },
      ],
    } as any);
    expect(due).toBe(3000);
    expect(lines.find((l) => l.label === "Home Visit Consultation")?.amount).toBe(
      3000,
    );
  });
});
