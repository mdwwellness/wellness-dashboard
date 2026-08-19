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
  revenue: number;
  paymentReceived: boolean;
  therapistCut: number;
  companyCut: number;
  splitPercent: number;
  therapistPaid: boolean;
  rawAppointment: slotBookingZodType;
};

export type EarningsSummary = {
  totalRevenue: number;
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
    if (revenue <= 0 && a.status !== "completed" && !a.paymentReceived) continue;

    const overrideSplit = a.doctorId
      ? (therapistSplitMap.get(a.doctorId) ?? null)
      : null;
    const split = overrideSplit != null ? overrideSplit : globalSplit;

    const therapistCut = Math.round((revenue * split) / 100);
    const companyCut = revenue - therapistCut;

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
      revenue,
      paymentReceived: !!a.paymentReceived,
      therapistCut,
      companyCut,
      splitPercent: split,
      therapistPaid: !!a.therapistPaid,
      rawAppointment: a,
    });
  }

  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function computeEarningsSummary(rows: EarningRow[]): EarningsSummary {
  const paid = rows.filter((r) => r.paymentReceived);
  const pending = rows.filter((r) => !r.paymentReceived);

  const totalRevenue = paid.reduce((s, r) => s + r.revenue, 0);
  const totalTherapistPayout = paid.reduce((s, r) => s + r.therapistCut, 0);
  const totalCompanyEarnings = paid.reduce((s, r) => s + r.companyCut, 0);
  const totalPending = pending.reduce((s, r) => s + r.revenue, 0);
  const completedSessions = rows.reduce((s, r) => s + r.sessionsCompleted, 0);
  const avgPerSession =
    completedSessions > 0 ? Math.round(totalRevenue / completedSessions) : 0;

  const therapistPaidPayout = paid.filter(r => r.therapistPaid).reduce((s, r) => s + r.therapistCut, 0);
  const therapistUnpaidPayout = paid.filter(r => !r.therapistPaid).reduce((s, r) => s + r.therapistCut, 0);

  return {
    totalRevenue,
    totalTherapistPayout,
    totalCompanyEarnings,
    totalPending,
    completedSessions,
    avgPerSession,
    therapistPaidPayout,
    therapistUnpaidPayout,
  };
}
