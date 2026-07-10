import { isToday } from "date-fns";

import { deriveCustomers } from "@/data/customer/customer";
import { isFollowUp } from "@/components/pages/enquiries/stage";
import { isTodayISO } from "@/lib/metrics";
import type { EnquiryType } from "@/type/schema";

// Statuses that count as a real booked appointment (vs a raw enquiry/lead).
const APPOINTMENT_STATUSES = ["scheduled", "ongoing", "completed"];

const statusOf = (r: EnquiryType) => r.status ?? "enquiry";

/**
 * Back-office dashboard totals, derived purely from the lists the app already
 * fetches. Kept as a plain function (no hooks) so it can be unit-tested in
 * isolation — feed it arrays, assert the counts.
 */
export function deriveDashboardTotals(
  records: EnquiryType[],
  therapists: { isActive?: boolean }[],
  serviceCount: number,
) {
  return {
    totalTherapists: therapists.length,
    activeTherapists: therapists.filter((t) => t.isActive).length,
    totalCustomers: deriveCustomers(records).length,
    totalEnquiries: records.filter((r) => statusOf(r) === "enquiry").length,
    totalAppointments: records.filter((r) =>
      APPOINTMENT_STATUSES.includes(statusOf(r)),
    ).length,
    completedAppointments: records.filter((r) => statusOf(r) === "completed")
      .length,
    totalServices: serviceCount,
    openFollowUps: records.filter(isFollowUp).length,
  };
}

/** A therapist's personal numbers, from their own (server-filtered) records. */
export function deriveTherapistPersonal(records: EnquiryType[]) {
  return {
    todaySessions: records.filter((r) => {
      const d = r.slot?.date ? new Date(r.slot.date) : null;
      return d && !Number.isNaN(d.getTime()) && isToday(d);
    }).length,
    completedToday: records.filter((r) => isTodayISO(r.completedAt)).length,
    recommendations: records.reduce(
      (sum, r) =>
        sum +
        (r.recommendedServices?.length ?? 0) +
        (r.appointmentKind === "recommended" ? 1 : 0),
      0,
    ),
    openAssigned: records.filter((r) =>
      ["scheduled", "ongoing"].includes(r.status ?? ""),
    ).length,
  };
}
