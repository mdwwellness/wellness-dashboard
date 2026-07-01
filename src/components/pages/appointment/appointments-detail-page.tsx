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
import { RecommendService } from "./recommend-service";
import { WorkChecklist } from "./work-checklist";
import { PackageProgressCard } from "./package-progress-badge";
import { getPackageProgressForAppointment, getConfirmedAddonNames } from "@/lib/package-progress";
import { Badge } from "@/components/ui/badge";
import { useGetServices } from "@/data/service/service";
import { BookNextSessionBlock } from "./book-next-session";

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

  const packageProgress = useMemo(() => {
    if (!live) return null;
    return getPackageProgressForAppointment(live, allAppointments, services);
  }, [live, allAppointments, services]);

  const confirmedAddons = live ? getConfirmedAddonNames(live) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Appointment Details</SheetTitle>
          <SheetDescription>
            Change the respective fields and click update to save changes.
          </SheetDescription>
        </SheetHeader>
        {live ? (
          <div className="px-4 pb-6 space-y-4">
            {packageProgress && (
              <PackageProgressCard progress={packageProgress} />
            )}
            {confirmedAddons.length > 0 && (
              <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Confirmed add-ons on this visit
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {confirmedAddons.map((name) => (
                    <Badge key={name} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <AppointmentDetailsPage
              data={live}
              onClose={() => onOpenChange(false)}
            />
            <RecommendService appointment={live} />
            <WorkChecklist appointment={live} />
            <BookNextSessionBlock
              appointment={live}
              allAppointments={allAppointments}
              services={services}
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

export default AppointmentDetailDrawer;
