import { describe, it, expect } from "vitest";

import { toWhatsAppNumber, whatsAppLink } from "./whatsapp";

describe("toWhatsAppNumber", () => {
  it("adds the country code to a bare 10-digit local number", () => {
    // The bug this fixes: wa.me/6289940988 has no country to resolve against.
    expect(toWhatsAppNumber(6289940988)).toBe("916289940988");
    expect(toWhatsAppNumber("9876543210")).toBe("919876543210");
  });

  it("leaves an already-international number alone", () => {
    expect(toWhatsAppNumber("916289940988")).toBe("916289940988");
    expect(toWhatsAppNumber("+91 62899 40988")).toBe("916289940988");
  });

  it("drops the domestic trunk 0", () => {
    expect(toWhatsAppNumber("06289940988")).toBe("916289940988");
  });

  it("strips spaces, dashes and brackets", () => {
    expect(toWhatsAppNumber("+91 (628) 994-0988")).toBe("916289940988");
  });

  it("returns null when there's nothing dialable", () => {
    expect(toWhatsAppNumber(undefined)).toBeNull();
    expect(toWhatsAppNumber("")).toBeNull();
    expect(toWhatsAppNumber("12345")).toBeNull();
  });
});

describe("whatsAppLink", () => {
  it("builds a wa.me link with the message encoded", () => {
    expect(whatsAppLink(6289940988, "Hi there")).toBe(
      "https://wa.me/916289940988?text=Hi%20there",
    );
  });

  it("returns null rather than a link to nowhere", () => {
    expect(whatsAppLink("", "Hi")).toBeNull();
  });
});
