// Appointment detail — right-side drawer (controlled by the table's row click).
"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../ui/sheet";
import { slotBookingZodType } from "@/type/schema";
import AppointmentDetailsPage from "./appointments-details-page";
import { WorkChecklist } from "./work-checklist";
import { VisitSections } from "./visit-sections";
import { RecordIds } from "./record-ids";
import { useGetServices } from "@/data/service/service";
import { useGetAllTherapist } from "@/data/therapist/therapist";
import { getPackageProgressForAppointment } from "@/lib/package-progress";

type AppointmentDetailDrawerProps = {
  data: slotBookingZodType | null;
  allAppointments: slotBookingZodType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AppointmentDetailDrawer = ({
  data,
  allAppointments,
  open,
  onOpenChange,
}: AppointmentDetailDrawerProps) => {
  const { data: services = [] } = useGetServices();
  const { data: therapists = [] } = useGetAllTherapist();

  const live = useMemo(() => {
    if (!data?._id) return data;
    return (
      allAppointments.find((a) => a._id === data._id) ?? data
    );
  }, [data, allAppointments]);

  // Multi-session (catalogue package OR ad-hoc N-session) — the package block
  // owns the visit date/time and shows the session number, so the details form
  // hides its own date/time and labels the note with the current session.
  const progress = live
    ? getPackageProgressForAppointment(live, allAppointments, services)
    : null;
  const isMulti = !!progress;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{live?.name ?? "Appointment"}</SheetTitle>
          <SheetDescription>
            One visit row — package and add-ons update here. Invoice syncs
            automatically.
          </SheetDescription>
        </SheetHeader>
        {live ? (
          <div className="px-4 pb-6 space-y-4">
            <RecordIds
              appointment={live}
              therapistPhone={
                live.doctorId
                  ? (
                      therapists as { doctorId?: string; phonenumber?: string }[]
                    ).find((t) => t.doctorId === live.doctorId)?.phonenumber
                  : undefined
              }
            />
            <VisitSections
              appointment={live}
              allAppointments={allAppointments}
              services={services}
            />
            <AppointmentDetailsPage
              data={live}
              onClose={() => onOpenChange(false)}
              compact={isMulti}
              sessionLabel={
                progress
                  ? `Session ${progress.currentSession} of ${progress.total}`
                  : undefined
              }
            />
            <WorkChecklist appointment={live} />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

export default AppointmentDetailDrawer;
