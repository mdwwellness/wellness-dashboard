"use client";

import { useQuery } from "@tanstack/react-query";
import getAllAppointments from "@/actions/appointments/get-all-appointments";
import type { EnquiryType, UserType } from "@/type/schema";
import { isTodayISO, readCreatedISO } from "@/lib/metrics";

/**
 * A customer is derived client-side from the appointments collection by
 * grouping records by phonenumber. The MOST RECENT name/email/location
 * for that phone wins for display purposes.
 */
export type CustomerSegment = "new" | "returning" | "vip";

export interface Customer {
  phonenumber: number;
  name: string;
  email?: string;
  location?: string;
  bookings: EnquiryType[];     // sorted newest-first
  totalBookings: number;       // excluding cancelled
  totalAll: number;            // including cancelled (for "all-time" stats if needed)
  firstBookingAt?: string;     // ISO from earliest createdAt
  lastBookingAt?: string;      // ISO from latest createdAt
  segment: CustomerSegment;
}

function readTimestamp(r: EnquiryType, key: "createdAt" | "updatedAt"): number {
  const ts = (r as unknown as Record<string, string | undefined>)[key];
  if (!ts) return 0;
  const t = new Date(ts).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function segmentFor(activeCount: number): CustomerSegment {
  if (activeCount >= 5) return "vip";
  if (activeCount >= 2) return "returning";
  return "new";
}

/**
 * Group a flat list of appointment records into Customer aggregates.
 * Exported so the page can recompute KPIs from the same source.
 */
export function deriveCustomers(records: EnquiryType[]): Customer[] {
  const buckets = new Map<number, EnquiryType[]>();
  for (const r of records) {
    if (!r.phonenumber) continue;
    const list = buckets.get(r.phonenumber) ?? [];
    list.push(r);
    buckets.set(r.phonenumber, list);
  }

  const out: Customer[] = [];
  for (const [phonenumber, list] of buckets.entries()) {
    // Sort newest-first by createdAt
    const sorted = [...list].sort(
      (a, b) => readTimestamp(b, "createdAt") - readTimestamp(a, "createdAt"),
    );
    const latest = sorted[0];
    const totalAll = sorted.length;
    const activeBookings = sorted.filter((r) => r.status !== "cancelled");
    const totalBookings = activeBookings.length;

    out.push({
      phonenumber,
      name: latest.name ?? "Unnamed",
      email: latest.email || undefined,
      location: latest.location || undefined,
      bookings: sorted,
      totalBookings,
      totalAll,
      firstBookingAt: sorted[sorted.length - 1]
        ? new Date(readTimestamp(sorted[sorted.length - 1], "createdAt")).toISOString()
        : undefined,
      lastBookingAt: latest
        ? new Date(readTimestamp(latest, "createdAt")).toISOString()
        : undefined,
      segment: segmentFor(totalBookings),
    });
  }

  // Sort customers by their most recent booking
  out.sort((a, b) => {
    const aT = a.lastBookingAt ? new Date(a.lastBookingAt).getTime() : 0;
    const bT = b.lastBookingAt ? new Date(b.lastBookingAt).getTime() : 0;
    return bT - aT;
  });

  return out;
}

export interface CustomerStats {
  totalCustomers: number;
  totalBookings: number;
  bookingsThisMonth: number;
  returningCustomers: number;
}

/** KPI cards — all derived client-side from grouped customers. */
export function computeCustomerStats(customers: Customer[]): CustomerStats {
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).getTime();

  let bookingsThisMonth = 0;
  for (const c of customers) {
    for (const b of c.bookings) {
      if (b.status === "cancelled") continue;
      const ts = readTimestamp(b, "createdAt");
      if (ts >= monthStart) bookingsThisMonth++;
    }
  }

  return {
    totalCustomers: customers.length,
    totalBookings: customers.reduce((sum, c) => sum + c.totalBookings, 0),
    bookingsThisMonth,
    returningCustomers: customers.filter((c) => c.totalBookings >= 2).length,
  };
}

export interface CustomerTodayStats {
  newCustomersToday: number;
  bookingsToday: number;
  returningToday: number;
}

/** "Today" KPI cards for the Customers page — derived from grouped customers. */
export function computeCustomerTodayStats(
  customers: Customer[],
): CustomerTodayStats {
  let newCustomersToday = 0;
  let bookingsToday = 0;
  let returningToday = 0;
  for (const c of customers) {
    if (isTodayISO(c.firstBookingAt)) newCustomersToday++;
    // An existing customer (first booking before today) who booked again today.
    if (isTodayISO(c.lastBookingAt) && !isTodayISO(c.firstBookingAt)) {
      returningToday++;
    }
    for (const b of c.bookings) {
      if (b.status === "cancelled") continue;
      if (isTodayISO(readCreatedISO(b))) bookingsToday++;
    }
  }
  return { newCustomersToday, bookingsToday, returningToday };
}

export function useGetCustomers(user: UserType) {
  return useQuery({
    queryKey: ["customers", user] as const,
    queryFn: async (): Promise<Customer[]> => {
      const result = await getAllAppointments(user);
      if (!result.success) throw new Error(result.message);
      const records = (result.data ?? []) as EnquiryType[];
      return deriveCustomers(records);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
