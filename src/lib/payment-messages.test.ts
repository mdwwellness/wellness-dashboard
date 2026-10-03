import { describe, it, expect } from "vitest";
import { paymentRequestMessage } from "./payment-messages";
import { formatINR } from "@/components/pages/services/services-columns";

const base = { name: "Asha", bookingId: "ENQ-0081", payUrl: "https://x.test/pay/t" };

describe("paymentRequestMessage", () => {
  it("prices a single item once", () => {
    const msg = paymentRequestMessage({ ...base, item: "Home visit", amount: 1600 });
    expect(msg).toContain(`Home visit - ${formatINR(1600)}\n`);
    expect(msg.split(formatINR(1600)).length - 1).toBe(1);
  });

  it("a single due line reads the same as a plain item", () => {
    const msg = paymentRequestMessage({
      ...base,
      item: "Home visit",
      lines: [{ label: "Home visit", amount: 1600 }],
      amount: 1600,
    });
    expect(msg.split(formatINR(1600)).length - 1).toBe(1);
  });

  it("lists several due lines with their prices and a total", () => {
    const msg = paymentRequestMessage({
      ...base,
      item: "Home visit",
      lines: [
        { label: "Home visit", amount: 1600 },
        { label: "Massage", amount: 800 },
      ],
      amount: 2400,
    });
    expect(msg).toContain(
      `Home visit - ${formatINR(1600)}\nMassage - ${formatINR(800)}\nTotal - ${formatINR(2400)}\n`,
    );
  });
});
