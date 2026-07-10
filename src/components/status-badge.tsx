"use client";

import { Badge } from "@/components/ui/badge";

// Single source of truth for the appointment / enquiry lifecycle status badge.
// Used by the appointment drawer, enquiry drawer, appointments table, customer
// drawer, and dashboard — so the badge looks and reads identically everywhere.

const STATUS_LABEL: Record<string, string> = {
  enquiry: "Enquiry",
  scheduled: "Scheduled",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_CLASS: Record<string, string> = {
  enquiry: "border-slate-400 text-slate-500",
  scheduled: "border-yellow-600 text-yellow-600",
  ongoing: "border-blue-600 text-blue-600",
  completed: "border-green-600 text-green-600",
};

export function AppointmentStatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  const s = status ?? "enquiry";
  if (s === "cancelled") {
    return (
      <Badge variant="destructive" className={className}>
        Cancelled
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={`${STATUS_CLASS[s] ?? ""} ${className ?? ""}`.trim()}
    >
      {STATUS_LABEL[s] ?? s}
    </Badge>
  );
}
