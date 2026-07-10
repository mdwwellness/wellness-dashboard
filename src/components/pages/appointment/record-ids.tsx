"use client";

import type { slotBookingZodType } from "@/type/schema";
import { AppointmentStatusBadge } from "@/components/status-badge";

/**
 * Compact reference block shown consistently on the appointment drawer, the
 * enquiry drawer, and (as columns) the table — so every booking surfaces the
 * same IDs and status no matter where you look at it.
 */

function IdCell({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-xs">{value || "—"}</span>
    </div>
  );
}

export function RecordIds({ appointment }: { appointment: slotBookingZodType }) {
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-2 rounded-md border bg-muted/30 px-3 py-2.5">
      <IdCell label="Booking ID" value={appointment.enquiryId} />
      <IdCell label="Customer ID" value={appointment.customer_id} />
      <IdCell label="Therapist ID" value={appointment.doctorId} />
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Status
        </span>
        <AppointmentStatusBadge
          status={appointment.status}
          className="text-[11px]"
        />
      </div>
    </div>
  );
}
