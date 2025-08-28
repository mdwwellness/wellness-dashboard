'use client'
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import { DoctorsformType } from "@/type/schema";
import TherapistDetailsPage from "../pages/therapist-details-page";

type TherapistDetailsDialogProps = {
    children: React.ReactNode;
    data: DoctorsformType
}

const TherapistDetailsActionPage = ({
    children,
    data,
}: TherapistDetailsDialogProps) => {

    return (
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-xl h-[92vh] md:h-fit overflow-y-scroll" >
        <DialogTitle>Theraipst Details</DialogTitle>
          <DialogDescription>
            To update with new details please change the respective fields and click on update details
          </DialogDescription>
          <TherapistDetailsPage data={data} />
        </DialogContent>
      </Dialog>
    )
  }

export default TherapistDetailsActionPage