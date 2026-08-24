"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useGetPersonalAppointments } from "@/data/therapist/therapist";
import { useGetClinicSettings } from "@/data/clinic-settings/clinic-settings";
import { buildEarningRows, computeEarningsSummary } from "@/lib/earnings";
import type { slotBookingZodType } from "@/type/schema";

interface TherapistEarningsTabProps {
  doctorId: string;
}

export function TherapistEarningsTab({ doctorId }: TherapistEarningsTabProps) {
  const { data: appointments = [], isLoading } =
    useGetPersonalAppointments(doctorId);
  const { data: settings } = useGetClinicSettings();

  const globalSplit = settings?.therapistSplitPercent ?? 60;

  const rows = useMemo(() => {
    const list: slotBookingZodType[] = Array.isArray(appointments)
      ? appointments
      : [];
    return buildEarningRows(list, globalSplit, new Map());
  }, [appointments, globalSplit]);

  const summary = useMemo(() => computeEarningsSummary(rows), [rows]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading earnings...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No completed sessions yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total sessions" value={summary.completedSessions} />
        <StatCard
          label="Total revenue"
          value={`₹${summary.totalRevenue.toLocaleString()}`}
        />
        <StatCard
          label="Therapist earned"
          value={`₹${summary.totalTherapistPayout.toLocaleString()}`}
        />
        <StatCard
          label="Paid out"
          value={`₹${summary.therapistPaidPayout.toLocaleString()}`}
          accent="emerald"
        />
        <StatCard
          label="Pending payout"
          value={`₹${summary.therapistUnpaidPayout.toLocaleString()}`}
          accent="amber"
        />
        <StatCard
          label="Avg / session"
          value={`₹${summary.avgPerSession.toLocaleString()}`}
        />
      </div>

      {/* Session list */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Session history
        </h4>
        <div className="divide-y rounded-md border">
          {rows.map((row) => (
            <div
              key={row.appointmentId}
              className="flex items-center justify-between px-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{row.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {row.service}
                  {row.date
                    ? ` · ${new Date(row.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                    : ""}
                </p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="font-medium">₹{row.therapistCut.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {row.splitPercent}% split
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "emerald" | "amber";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "amber"
        ? "text-amber-600"
        : "text-foreground";

  return (
    <div className="rounded-md border px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}
