import { describe, expect, it } from "vitest";

import { bookingLedger } from "./booking-money";

describe("bookingLedger", () => {
  it("treats booking as paid when paymentReceived is true", () => {
    const { due, lines } = bookingLedger({
      quotedPrice: 500,
      paymentReceived: true,
    });
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
    });
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
    });
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
    });
    expect(due).toBe(0);
  });
});
