import { describe, it, expect } from "vitest";
import { toMinutes, checkConflict } from "./booking-conflicts";
import type { EnquiryType } from "@/type/schema";

const visit = (over: Partial<EnquiryType>): EnquiryType =>
  ({ name: "x", phonenumber: 1, doctorId: "DOC-1", status: "ongoing", ...over }) as EnquiryType;

// Asha booked 2026-07-20, 10:30–12:00 (explicit span).
const asha = visit({
  name: "Ravi", doctorId: "DOC-1",
  slot: { date: "2026-07-20T00:00:00.000Z", time: "10:30" },
  therapyStartTime: "10:30", therapyEndTime: "12:00",
});
const cand = (over: Partial<CandidateArg> = {}): CandidateArg => ({
  doctorId: "DOC-1", date: "2026-07-20", startTime: "11:30", durationMin: 60, ...over,
});
type CandidateArg = { doctorId: string; date: string; startTime: string; durationMin: number };

describe("toMinutes", () => {
  it("parses HH:MM", () => {
    expect(toMinutes("14:30")).toBe(870);
    expect(toMinutes("9:30")).toBe(570);
    expect(Number.isNaN(toMinutes("bad"))).toBe(true);
  });
});

describe("checkConflict", () => {
  it("overlap: candidate span intersects an existing visit", () => {
    expect(checkConflict(cand({ startTime: "11:30", durationMin: 60 }), [asha], 60).status).toBe("overlap");
  });
  it("overlap from a free start whose duration runs into a later visit", () => {
    // start 09:30 free, but 120min → 11:30, overlapping Asha's 10:30 start.
    expect(checkConflict(cand({ startTime: "9:30", durationMin: 120 }), [asha], 60).status).toBe("overlap");
  });
  it("too-close: within the gap but not overlapping", () => {
    // starts 12:30, Asha ends 12:00 → 30-min gap < 60.
    expect(checkConflict(cand({ startTime: "12:30", durationMin: 60 }), [asha], 60).status).toBe("too-close");
  });
  it("touching counts as too-close (gap 0)", () => {
    expect(checkConflict(cand({ startTime: "12:00", durationMin: 60 }), [asha], 60).status).toBe("too-close");
  });
  it("exactly one gap away is ok", () => {
    // Asha ends 12:00, gap 60 → start 13:00 is fine.
    expect(checkConflict(cand({ startTime: "13:00", durationMin: 60 }), [asha], 60).status).toBe("ok");
  });
  it("a legacy point-booking counts as a 60-min span", () => {
    const legacy = visit({ slot: { date: "2026-07-20T00:00:00.000Z", time: "10:30" } }); // no end
    expect(checkConflict(cand({ startTime: "11:00", durationMin: 60 }), [legacy], 60).status).toBe("overlap");
  });
  it("different doctor never conflicts", () => {
    expect(checkConflict(cand({ doctorId: "DOC-2" }), [asha], 60).status).toBe("ok");
  });
  it("different day never conflicts", () => {
    expect(checkConflict(cand({ date: "2026-07-21" }), [asha], 60).status).toBe("ok");
  });
  it("cancelled visits are ignored", () => {
    expect(checkConflict(cand({ startTime: "11:30" }), [visit({ ...asha, status: "cancelled" })], 60).status).toBe("ok");
  });
  it("excludes the record being edited", () => {
    const withId = visit({ ...asha, _id: "self" });
    expect(checkConflict(cand({ startTime: "11:30" }), [withId], 60, { excludeId: "self" }).status).toBe("ok");
  });
});
