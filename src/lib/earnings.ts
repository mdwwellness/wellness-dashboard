import type { slotBookingZodType } from "@/type/schema";

export type EarningRow = {
  appointmentId: string;
  enquiryId: string;
  date: string;
  customerName: string;
  therapistName: string;
  therapistId: string;
  service: string;
  sessionsCompleted: number;
  originalPrice: number;
  discountAmount: number;
  discountType: "fixed" | "percent" | null;
  discountCode: string | null;
  revenue: number;
  paymentReceived: boolean;
  therapistCut: number;
  companyCut: number;
  splitPercent: number;
  therapistPaid: boolean;
  /** Booking status for display: completed, ongoing, scheduled, etc. */
  status: string;
  rawAppointment: slotBookingZodType;
};

export type EarningsSummary = {
  totalRevenue: number;
  totalOriginalRevenue: number;
  totalDiscountGiven: number;
  totalTherapistPayout: number;
  totalCompanyEarnings: number;
  totalPending: number;
  completedSessions: number;
  avgPerSession: number;
  therapistPaidPayout: number;
  therapistUnpaidPayout: number;
};

/**
 * Derive earnings rows from completed (or paid) appointments.
 * therapistSplitMap: doctorId -> override split% (null = use global)
 */
export function buildEarningRows(
  appointments: slotBookingZodType[],
  globalSplit: number,
  therapistSplitMap: Map<string, number | null>,
): EarningRow[] {
  const rows: EarningRow[] = [];

  for (const a of appointments) {
    if (a.status === "cancelled") continue;

    const revenue = a.paymentAmount ?? a.quotedPrice ?? 0;

    const overrideSplit = a.doctorId
      ? (therapistSplitMap.get(a.doctorId) ?? null)
      : null;
    const split = overrideSplit != null ? overrideSplit : globalSplit;

    const therapistCut = Math.round((revenue * split) / 100);
    const companyCut = revenue - therapistCut;

    // Discount tracking: originalPrice is the list price before discount.
    // If not set, fall back to quotedPrice (which is the final price).
    const originalPrice = a.originalPrice ?? a.quotedPrice ?? revenue;
    const discountAmount = a.discountAmount ?? 0;
    const discountType = a.discountType ?? null;
    const discountCode = a.discountCode ?? null;

    const date =
      a.completedAt ??
      a.slot?.date ??
      (a as any).createdAt ??
      "";

    rows.push({
      appointmentId: a._id ?? "",
      enquiryId: a.enquiryId ?? "",
      date,
      customerName: a.name ?? "Unknown",
      therapistName: a.doctor ?? "Unassigned",
      therapistId: a.doctorId ?? "",
      service: a.service ?? a.typeOfappointment ?? "-",
      sessionsCompleted: a.sessionsCompleted ?? (a.status === "completed" ? 1 : 0),
      originalPrice,
      discountAmount,
      discountType,
      discountCode,
      revenue,
      paymentReceived: !!a.paymentReceived,
      therapistCut,
      companyCut,
      splitPercent: split,
      therapistPaid: !!a.therapistPaid,
      status: a.status ?? "scheduled",
      rawAppointment: a,
    });
  }

  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function computeEarningsSummary(rows: EarningRow[]): EarningsSummary {
  const paid = rows.filter((r) => r.paymentReceived);
  const pending = rows.filter((r) => !r.paymentReceived);

  const totalRevenue = paid.reduce((s, r) => s + r.revenue, 0);
  const totalOriginalRevenue = paid.reduce((s, r) => s + r.originalPrice, 0);
  const totalDiscountGiven = paid.reduce((s, r) => s + r.discountAmount, 0);
  const totalTherapistPayout = paid.reduce((s, r) => s + r.therapistCut, 0);
  const totalCompanyEarnings = paid.reduce((s, r) => s + r.companyCut, 0);
  const totalPending = pending.reduce((s, r) => s + r.revenue, 0);
  // Count sessions by rows, not by sessionsCompleted field (which defaults to 0
  // and doesn't reliably reflect completion for legacy/ad-hoc records).
  // Each row in the earnings table IS one session. Use all rows (not just paid)
  // so the KPI matches the session list table.
  const completedSessions = rows.length;
  const paidCount = paid.length;
  const avgPerSession =
    paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

  const therapistPaidPayout = paid.filter(r => r.therapistPaid).reduce((s, r) => s + r.therapistCut, 0);
  const therapistUnpaidPayout = paid.filter(r => !r.therapistPaid).reduce((s, r) => s + r.therapistCut, 0);

  return {
    totalRevenue,
    totalOriginalRevenue,
    totalDiscountGiven,
    totalTherapistPayout,
    totalCompanyEarnings,
    totalPending,
    completedSessions,
    avgPerSession,
    therapistPaidPayout,
    therapistUnpaidPayout,
  };
}
