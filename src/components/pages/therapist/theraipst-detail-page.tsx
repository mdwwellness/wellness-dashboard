// therapist-details-dialog.tsx
'use client'
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TherapistformType } from "@/type/schema";
import TherapistDetailsPage from "./therapist-details-page";

type TherapistDetailsDialogProps = {
  children: React.ReactNode;
  data: TherapistformType;
}

const TherapistDetailsDialog = ({ children, data }: TherapistDetailsDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[92vh] md:h-fit overflow-y-scroll">
        <DialogTitle>Therapist Details</DialogTitle>
        <DialogDescription>
          Update the fields below and click update to save changes.
        </DialogDescription>
        <TherapistDetailsPage
          data={data}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default TherapistDetailsDialog;