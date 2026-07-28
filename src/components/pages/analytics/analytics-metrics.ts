import { readCreatedISO } from "@/lib/metrics";
import type { EnquiryType } from "@/type/schema";

/**
 * Analytics for a SERVICE business, derived client-side from the appointments
 * list the app already fetches — same pattern as the dashboard/customers pages.
 * Everything here is a plain function so it can be unit-tested with arrays.
 *
 * ponytail: client-side derivation; when record counts outgrow a single fetch,
 * move this aggregation into a server endpoint (see analytics spec §4).
 */

const BOOKING_STATUSES = ["scheduled", "ongoing", "completed"];

const statusOf = (r: EnquiryType) => r.status ?? "enquiry";
const isCancelled = (r: EnquiryType) => statusOf(r) === "cancelled";

/** The money on a record — the amount actually taken, else the quoted price. */
const amountOf = (r: EnquiryType) => r.paymentAmount ?? r.quotedPrice ?? 0;

/** A confirmed booking: a booking type was chosen (pay-first funnel) or it has
 *  already moved into a booked status. Cancelled never counts. */
const isBooked = (r: EnquiryType) =>
  !isCancelled(r) &&
  (!!r.typeOfappointment || BOOKING_STATUSES.includes(statusOf(r)));

const isPaid = (r: EnquiryType) => !!r.paymentReceived && !isCancelled(r);

/** "YYYY-MM" for the timestamp that best represents when revenue landed. */
function monthKey(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const TYPE_LABELS: Record<string, string> = {
  consultation: "Online Consultation",
  appointment: "Home Visit",
};

export interface AnalyticsResult {
  // Zone A — business health
  revenueThisMonth: number;
  collected: number;
  pending: number;
  collectedPct: number; // 0–100
  bookingsThisMonth: number;
  conversionPct: number; // paid ÷ enquiries, 0–100
  pipeline: { enquiries: number; bookings: number; paid: number };
  serviceMix: { label: string; revenue: number }[]; // desc
  revenueTrend: { month: string; revenue: number; momPct: number | null }[]; // oldest→newest
  // Zone B — operational
  pendingCount: number;
  needsFirstContact: number;
  therapistLoad: { name: string; bookings: number }[]; // desc, this week
  hasData: boolean;
}

function startOfWeek(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday-start; good enough for a week bucket
  return d;
}

export function deriveAnalytics(
  records: EnquiryType[],
  now: Date = new Date(),
): AnalyticsResult {
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const live = records.filter((r) => !isCancelled(r));

  // Revenue timing: when payment landed, else when the record was created.
  const revenueMonth = (r: EnquiryType) =>
    monthKey(r.paymentReceivedAt ?? readCreatedISO(r));

  let collected = 0;
  let pending = 0;
  let revenueThisMonth = 0;
  let bookingsThisMonth = 0;
  const mixByLabel = new Map<string, number>();
  const trendByMonth = new Map<string, number>();

  for (const r of live) {
    const amt = amountOf(r);
    if (isPaid(r)) {
      collected += amt;
      const m = revenueMonth(r);
      if (m) trendByMonth.set(m, (trendByMonth.get(m) ?? 0) + amt);
      if (m === thisMonth) revenueThisMonth += amt;
      const label = TYPE_LABELS[r.typeOfappointment ?? ""] ?? "Other";
      mixByLabel.set(label, (mixByLabel.get(label) ?? 0) + amt);
    } else if (isBooked(r)) {
      pending += r.quotedPrice ?? 0;
    }
    if (isBooked(r) && monthKey(readCreatedISO(r)) === thisMonth) {
      bookingsThisMonth++;
    }
  }

  const enquiries = live.length;
  const bookings = live.filter(isBooked).length;
  const paid = live.filter(isPaid).length;

  const serviceMix = [...mixByLabel.entries()]
    .map(([label, revenue]) => ({ label, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // Last 6 months, oldest→newest, with month-over-month growth.
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const revenueTrend = months.map((month, i) => {
    const revenue = trendByMonth.get(month) ?? 0;
    const prev = i > 0 ? (trendByMonth.get(months[i - 1]) ?? 0) : 0;
    const momPct = i > 0 && prev > 0 ? ((revenue - prev) / prev) * 100 : null;
    return { month, revenue, momPct };
  });

  const needsFirstContact = live.filter(
    (r) =>
      statusOf(r) === "enquiry" &&
      !r.executiveReachedOut &&
      (r.reachAttempts ?? 0) === 0,
  ).length;

  // Therapist load this week — bookings with a therapist + slot this week.
  const weekStart = startOfWeek(now);
  const loadByName = new Map<string, number>();
  for (const r of live) {
    if (!r.doctorId && !r.doctor) continue;
    if (!r.slot?.date) continue;
    const d = new Date(r.slot.date);
    if (Number.isNaN(d.getTime()) || d < weekStart) continue;
    const name = r.doctor?.trim() || "Unnamed therapist";
    loadByName.set(name, (loadByName.get(name) ?? 0) + 1);
  }
  const therapistLoad = [...loadByName.entries()]
    .map(([name, bookings]) => ({ name, bookings }))
    .sort((a, b) => b.bookings - a.bookings);

  return {
    revenueThisMonth,
    collected,
    pending,
    collectedPct: collected + pending > 0 ? (collected / (collected + pending)) * 100 : 0,
    bookingsThisMonth,
    conversionPct: enquiries > 0 ? (paid / enquiries) * 100 : 0,
    pipeline: { enquiries, bookings, paid },
    serviceMix,
    revenueTrend,
    pendingCount: live.filter((r) => isBooked(r) && !isPaid(r)).length,
    needsFirstContact,
    therapistLoad,
    hasData: records.length > 0,
  };
}
