import { describe, it, expect } from "vitest";
import { toPhoneDigits, isValidPhone, PHONE_MAX_DIGITS } from "./phone";

describe("toPhoneDigits", () => {
  it("keeps a clean 10-digit number as-is", () => {
    expect(toPhoneDigits("9876543210")).toBe("9876543210");
  });

  it("hard-caps at 10 digits, dropping the rest", () => {
    expect(toPhoneDigits("9876543210999")).toBe("9876543210");
    expect(toPhoneDigits("9876543210").length).toBe(PHONE_MAX_DIGITS);
  });

  it("strips spaces, dashes, plus, and letters", () => {
    expect(toPhoneDigits("+91 98765-43210")).toBe("9198765432"); // digits only, then capped
    expect(toPhoneDigits("98a76b54c32d10")).toBe("9876543210");
  });

  it("returns empty string for no digits", () => {
    expect(toPhoneDigits("")).toBe("");
    expect(toPhoneDigits("abc-!@#")).toBe("");
  });
});

describe("isValidPhone", () => {
  it("accepts exactly 10 digits (string or number)", () => {
    expect(isValidPhone("9876543210")).toBe(true);
    expect(isValidPhone(9876543210)).toBe(true);
  });

  it("rejects fewer or more than 10 digits, and empty/nullish", () => {
    expect(isValidPhone("98765")).toBe(false);
    expect(isValidPhone("98765432101")).toBe(false);
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone(undefined)).toBe(false);
    expect(isValidPhone(null)).toBe(false);
  });
});
