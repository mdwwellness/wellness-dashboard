"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { useUpdateAppointment } from "@/data/appointment/appointment";
import { useGetClinicSettings } from "@/data/clinic-settings/clinic-settings";
import { useAuthStore } from "@/providers/permission-provider";
import type { slotBookingZodType } from "@/type/schema";
import { TherapistAvailabilityGrid } from "@/components/pages/enquiries/therapist-availability-grid";
import { checkConflict, toMinutes } from "@/lib/booking-conflicts";
import { toDayKey } from "@/components/pages/enquiries/booking";

/**
 * Assign a therapist to a booking that has none.
 *
 * The panel flagged "No therapist" but gave no way to fix it - the only
 * assignment paths were the enquiry funnel and the booking modal. Reuses the
 * same availability grid and the same conflict check as both, so a slot booked
 * here can't collide with one booked there.
 *
 * Pay-first still applies: the server refuses to attach a therapist to an unpaid
 * booking, so this shows the reason instead of a grid that would fail on save.
 */
export function AssignTherapistCard({
  appointment,
  allAppointments,
}: {
  appointment: slotBookingZodType;
  allAppointments: slotBookingZodType[];
}) {
  const { user } = useAuthStore();
  const { mutate: update, isPending } = useUpdateAppointment();
  const { data: clinicSettings } = useGetClinicSettings();
  const gapMinutes = clinicSettings?.bookingGapMinutes ?? 60;

  const [date, setDate] = useState(
    toDayKey(appointment.slot?.date) || format(new Date(), "yyyy-MM-dd"),
  );
  const [durationMin, setDurationMin] = useState(60);

  if (!appointment.paymentReceived) {
    return (
      <div className="rounded-lg border border-amber-500/50 bg-amber-50/50 p-3 dark:bg-amber-950/20">
        <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-300">
          No therapist assigned
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Payment has to be recorded before a therapist can be assigned. Take it
          on the <strong>Money</strong> tab, then come back here.
        </p>
      </div>
    );
  }

  function assign(pick: { doctorId: string; doctor: string; startTime: string }) {
    const startMin = toMinutes(pick.startTime);
    const endMin = startMin + durationMin;
    const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(
      endMin % 60,
    ).padStart(2, "0")}`;

    const conflict = checkConflict(
      {
        doctorId: pick.doctorId,
        date,
        startTime: pick.startTime,
        durationMin,
      },
      allAppointments,
      gapMinutes,
      { excludeId: appointment._id },
    );
    if (conflict.status === "overlap") {
      toast.error(
        `${durationMin} min from ${pick.startTime} runs into ${conflict.with?.name}'s ${conflict.with?.time} visit - shorten it or pick another start.`,
      );
      return;
    }

    update({
      ...appointment,
      doctorId: pick.doctorId,
      doctor: pick.doctor,
      slot: { date, time: pick.startTime },
      therapyStartTime: pick.startTime,
      therapyEndTime: end,
      activityLog: [
        ...(appointment.activityLog ?? []),
        {
          at: new Date().toISOString(),
          userId: user?.id,
          name:
            `${user?.userfName ?? ""} ${user?.userlName ?? ""}`.trim() ||
            "Someone",
          action: `Assigned ${pick.doctor} - ${date} ${pick.startTime}-${end}`,
        },
      ],
    });
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div>
        <p className="text-[13px] font-semibold">Assign a therapist</p>
        <p className="text-[11px] text-muted-foreground">
          Pick a date, then a free slot. Busy and too-close slots are blocked.
        </p>
      </div>
      <Input
        type="date"
        className="h-8 w-full sm:w-44"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        aria-label="Visit date"
      />
      <TherapistAvailabilityGrid
        date={date}
        selectedDoctorId={appointment.doctorId}
        selectedStart={appointment.slot?.time}
        excludeRecordId={appointment._id}
        durationMin={durationMin}
        onDurationChange={setDurationMin}
        onPick={({ doctorId, doctor, startTime }) => {
          if (isPending) return;
          assign({ doctorId, doctor, startTime });
        }}
      />
    </div>
  );
}
