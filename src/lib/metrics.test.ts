import { describe, it, expect } from "vitest";
import { isTodayISO, readCreatedISO, readUpdatedISO } from "./metrics";
import type { EnquiryType } from "@/type/schema";

const enquiry = (over: Partial<EnquiryType>): EnquiryType =>
  ({ name: "x", phonenumber: 1, ...over }) as EnquiryType;

describe("isTodayISO", () => {
  it("returns false for undefined", () => {
    expect(isTodayISO(undefined)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isTodayISO(null)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isTodayISO("")).toBe(false);
  });

  it("returns false for invalid date string", () => {
    expect(isTodayISO("not-a-date")).toBe(false);
  });

  it("returns true for today's date", () => {
    const today = new Date().toISOString();
    expect(isTodayISO(today)).toBe(true);
  });

  it("returns false for yesterday's date", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isTodayISO(yesterday.toISOString())).toBe(false);
  });

  it("returns false for tomorrow's date", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isTodayISO(tomorrow.toISOString())).toBe(false);
  });
});

describe("readCreatedISO", () => {
  it("returns createdAt from record", () => {
    const record = enquiry({
      createdAt: "2026-01-15T10:30:00.000Z",
    } as unknown as Partial<EnquiryType>);
    expect(readCreatedISO(record)).toBe("2026-01-15T10:30:00.000Z");
  });

  it("returns undefined when createdAt is missing", () => {
    const record = enquiry({});
    expect(readCreatedISO(record)).toBeUndefined();
  });
});

describe("readUpdatedISO", () => {
  it("returns updatedAt when present", () => {
    const record = enquiry({
      updatedAt: "2026-01-15T12:00:00.000Z",
      createdAt: "2026-01-15T10:30:00.000Z",
    } as unknown as Partial<EnquiryType>);
    expect(readUpdatedISO(record)).toBe("2026-01-15T12:00:00.000Z");
  });

  it("falls back to createdAt when updatedAt is missing", () => {
    const record = enquiry({
      createdAt: "2026-01-15T10:30:00.000Z",
    } as unknown as Partial<EnquiryType>);
    expect(readUpdatedISO(record)).toBe("2026-01-15T10:30:00.000Z");
  });

  it("returns undefined when both are missing", () => {
    const record = enquiry({});
    expect(readUpdatedISO(record)).toBeUndefined();
  });
});
