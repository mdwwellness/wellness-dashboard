import { describe, it, expect } from "vitest";

import { diffInvoice } from "./invoice-diff";
import type { PersistedInvoice } from "@/type/invoice";

const base = {
  invoice_id: "INV-0001",
  customer_name: "Priya Sharma",
  therapist_name: "Asha Rao",
  session_number: "1",
  package_name: "",
  payment_status: "paid",
  line_items: [
    { description: "Home Visit Consultation", price: 1200 },
    { description: "Hot pack", price: 300 },
  ],
} as unknown as PersistedInvoice;

const withItems = (items: { description: string; price: number }[]) =>
  ({ ...base, line_items: items }) as unknown as PersistedInvoice;

describe("diffInvoice", () => {
  it("reports nothing when nothing changed", () => {
    // Drives the silent save — a paid invoice opened and closed unchanged must
    // not prompt, or the warning gets trained away.
    expect(diffInvoice(base, { ...base })).toEqual([]);
  });

  it("ignores a string/number mismatch on price", () => {
    // The inputs hand back strings; the API hands back numbers. Comparing raw
    // would fire the dialog on a no-op save.
    const after = withItems([
      { description: "Home Visit Consultation", price: "1200" as unknown as number },
      { description: "Hot pack", price: 300 },
    ]);
    expect(diffInvoice(base, after)).toEqual([]);
  });

  it("ignores whitespace-only description edits", () => {
    const after = withItems([
      { description: "Home Visit Consultation  ", price: 1200 },
      { description: "Hot pack", price: 300 },
    ]);
    expect(diffInvoice(base, after)).toEqual([]);
  });

  it("reports a re-priced line item against its own name", () => {
    const after = withItems([
      { description: "Home Visit Consultation", price: 800 },
      { description: "Hot pack", price: 300 },
    ]);
    expect(diffInvoice(base, after)).toEqual([
      { label: "Home Visit Consultation", from: "₹1,200", to: "₹800" },
    ]);
  });

  it("reports a removed line without claiming the rest changed", () => {
    const after = withItems([{ description: "Home Visit Consultation", price: 1200 }]);
    expect(diffInvoice(base, after)).toEqual([
      { label: "Removed", from: "Hot pack — ₹300", to: "" },
    ]);
  });

  it("reports an added line", () => {
    const after = withItems([
      ...base.line_items,
      { description: "Taping", price: 250 },
    ]);
    expect(diffInvoice(base, after)).toEqual([
      { label: "Added", from: "", to: "Taping — ₹250" },
    ]);
  });

  it("reports a rename and a re-price together as one line", () => {
    const after = withItems([
      { description: "Home Visit (extended)", price: 1500 },
      { description: "Hot pack", price: 300 },
    ]);
    expect(diffInvoice(base, after)).toEqual([
      {
        label: "Line item",
        from: "Home Visit Consultation — ₹1,200",
        to: "Home Visit (extended) — ₹1,500",
      },
    ]);
  });

  it("reports each editable non-money field", () => {
    const after = {
      ...base,
      therapist_name: "Rohan",
      session_number: "2",
      package_name: "6-session course",
    } as unknown as PersistedInvoice;
    expect(diffInvoice(base, after)).toEqual([
      { label: "Therapist", from: "Asha Rao", to: "Rohan" },
      { label: "Session", from: "1", to: "2" },
      { label: "Package", from: "—", to: "6-session course" },
    ]);
  });

  it("reports un-marking payment", () => {
    const after = { ...base, payment_status: "pending" } as unknown as PersistedInvoice;
    expect(diffInvoice(base, after)).toEqual([
      { label: "Payment", from: "Paid", to: "Pending" },
    ]);
  });

  it("collects money and facts together, money first", () => {
    const after = {
      ...base,
      therapist_name: "Rohan",
      line_items: [
        { description: "Home Visit Consultation", price: 800 },
        { description: "Hot pack", price: 300 },
      ],
    } as unknown as PersistedInvoice;
    expect(diffInvoice(base, after)).toEqual([
      { label: "Home Visit Consultation", from: "₹1,200", to: "₹800" },
      { label: "Therapist", from: "Asha Rao", to: "Rohan" },
    ]);
  });
});
