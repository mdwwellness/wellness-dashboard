// Appointment detail — right-side drawer (controlled by the table's row click).
"use client";
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

type AppointmentDetailDrawerProps = {
  data: slotBookingZodType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AppointmentDetailDrawer = ({
  data,
  open,
  onOpenChange,
}: AppointmentDetailDrawerProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Appointment Details</SheetTitle>
          <SheetDescription>
            Change the respective fields and click update to save changes.
          </SheetDescription>
        </SheetHeader>
        {data ? (
          <div className="px-4 pb-6">
            <AppointmentDetailsPage
              data={data}
              onClose={() => onOpenChange(false)}
            />
            <RecommendService
              appointment={data}
              onDone={() => onOpenChange(false)}
            />
            <WorkChecklist appointment={data} />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

export default AppointmentDetailDrawer;
