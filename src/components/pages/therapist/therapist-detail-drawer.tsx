"use client";

import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteTherapist } from "@/data/therapist/therapist";
import type { TherapistformType } from "@/type/schema";
import TherapistDetailsPage from "./therapist-details-page";

interface TherapistDetailDrawerProps {
  therapist: TherapistformType | null;
  onClose: () => void;
}

export function TherapistDetailDrawer({
  therapist,
  onClose,
}: TherapistDetailDrawerProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteTherapist();

  const open = therapist !== null;

  function handleDelete() {
    if (!therapist?.doctorId) return;
    deleteMutate(therapist.doctorId, {
      onSuccess: () => {
        setConfirmDelete(false);
        onClose();
      },
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
        <SheetContent className="w-full sm:max-w-2xl p-0 gap-0 flex flex-col">
          {/* accessible label — visible header lives inside the form */}
          <SheetTitle className="sr-only">Therapist details</SheetTitle>
          <SheetDescription className="sr-only">
            Update the therapist&apos;s profile, specialization and certificates.
          </SheetDescription>
          {therapist && (
            <TherapistDetailsPage
              key={therapist.doctorId}
              data={therapist}
              onClose={onClose}
              onRequestDelete={() => setConfirmDelete(true)}
              isDeleting={isDeleting}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* AlertDialog OUTSIDE the Sheet to avoid the nested-overlay double-tap bug */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete therapist?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. {therapist?.name} will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
