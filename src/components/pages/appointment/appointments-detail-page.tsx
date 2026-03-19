// appointments-details-dialog.tsx
'use client'
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { slotBookingZodType } from "@/type/schema";
import AppointmentDetailsPage from "./appointments-details-page";

type AppointmentsDetailsDialogProps = {
  children: React.ReactNode;
  data: slotBookingZodType;
}

const AppointmentsDetailsDialog = ({ children, data }: AppointmentsDetailsDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[92vh] md:h-fit overflow-y-scroll">
        <DialogTitle>Appointment Details</DialogTitle>
        <DialogDescription>
          Change the respective fields and click update to save changes.
        </DialogDescription>
        <AppointmentDetailsPage
          data={data}
          onClose={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}

export default AppointmentsDetailsDialog;