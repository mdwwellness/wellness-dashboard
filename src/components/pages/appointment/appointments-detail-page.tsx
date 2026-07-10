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
import { resolvePackageForAppointment } from "@/lib/package-progress";

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

  const live = useMemo(() => {
    if (!data?._id) return data;
    return (
      allAppointments.find((a) => a._id === data._id) ?? data
    );
  }, [data, allAppointments]);

  const hasPackage = live
    ? !!resolvePackageForAppointment(live, services)
    : false;

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
            <RecordIds appointment={live} />
            <VisitSections
              appointment={live}
              allAppointments={allAppointments}
              services={services}
            />
            <AppointmentDetailsPage
              data={live}
              onClose={() => onOpenChange(false)}
              compact={hasPackage}
            />
            <WorkChecklist appointment={live} />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

export default AppointmentDetailDrawer;
