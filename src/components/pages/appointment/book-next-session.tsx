"use client";

import { useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBookAppointment } from "@/data/appointment/appointment";
import type { slotBookingZodType } from "@/type/schema";
import {
  canBookNextSession,
  getPackageProgressForAppointment,
  resolveNextSessionNumber,
  type PackageProgress,
} from "@/lib/package-progress";
import type { ServiceType } from "@/type/schema";

type BookNextSessionProps = {
  appointment: slotBookingZodType;
  allAppointments: slotBookingZodType[];
  services: ServiceType[];
  progress: PackageProgress;
};

/**
 * After a package session is completed, staff schedules the next visit.
 * Pre-fills customer, package, and therapist from the current record.
 */
export function BookNextSession({
  appointment,
  allAppointments,
  services,
  progress,
}: BookNextSessionProps) {
  const { mutate: book, isPending } = useBookAppointment();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (!canBookNextSession(progress)) return null;
  if (appointment.status !== "completed") return null;

  const nextNum = resolveNextSessionNumber(appointment, allAppointments, services);
  const originId = appointment.packageOriginId ?? appointment._id;

  function handleBook() {
    if (!date || !time) {
      toast.error("Pick date and time for the next session");
      return;
    }

    const payload: slotBookingZodType = {
      name: appointment.name,
      phonenumber: appointment.phonenumber,
      email: appointment.email,
      age: appointment.age,
      location: appointment.location,
      category: appointment.category,
      service: appointment.service,
      note: appointment.note,
      doctor: appointment.doctor,
      doctorId: appointment.doctorId,
      packageServiceId: appointment.packageServiceId,
      packageOriginId: originId,
      sessionNumber: nextNum,
      typeOfappointment: "appointment",
      appointmentKind: "new",
      status: "scheduled",
      slot: { date, time },
    };

    book(payload, {
      onSuccess: () => {
        setDate("");
        setTime("");
      },
    });
  }

  return (
    <div className="mt-4 space-y-3 border-t pt-4 rounded-md border-emerald-200 bg-emerald-50/30 p-3">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
          <CalendarPlus className="h-4 w-4" />
          Schedule session {nextNum} of {progress.total}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {progress.completed} of {progress.total} completed — book the next
          home visit for {appointment.name}.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Next session date"
        />
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label="Next session time"
        />
      </div>
      <Button
        type="button"
        onClick={handleBook}
        disabled={isPending}
        className="w-full sm:w-auto"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Booking…
          </>
        ) : (
          `Book session ${nextNum}`
        )}
      </Button>
    </div>
  );
}

export function BookNextSessionBlock({
  appointment,
  allAppointments,
  services,
}: {
  appointment: slotBookingZodType;
  allAppointments: slotBookingZodType[];
  services: ServiceType[];
}) {
  const progress = getPackageProgressForAppointment(
    appointment,
    allAppointments,
    services,
  );
  if (!progress || !canBookNextSession(progress)) return null;
  if (appointment.status !== "completed") return null;

  return (
    <BookNextSession
      appointment={appointment}
      allAppointments={allAppointments}
      services={services}
      progress={progress}
    />
  );
}
