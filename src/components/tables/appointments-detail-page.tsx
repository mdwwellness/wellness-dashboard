'use client'
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import { DoctorsformType, slotBookingZodType } from "@/type/schema";
import TherapistDetailsPage from "../pages/therapist-details-page";
import AppointmentDetailsPage from "../pages/appointments-details-page";

type AppointmentsDetailsDialogProps = {
    children: React.ReactNode;
    data: slotBookingZodType
}

const AppointmentsDetailsPage = ({
    children,
    data,
}: AppointmentsDetailsDialogProps) => {

    return (
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl h-[92vh] md:h-fit overflow-y-scroll" >
        <DialogTitle>Appointments Details</DialogTitle>
          <DialogDescription>
            To update with new details please change the respective fields and click on update details
          </DialogDescription>
          <AppointmentDetailsPage data={data} />
        </DialogContent>
      </Dialog>
    )
  }

export default AppointmentsDetailsPage