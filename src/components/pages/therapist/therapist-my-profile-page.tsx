"use client";

import { useAuthStore } from "@/providers/permission-provider";
import { useGetTherapistByUserId } from "@/data/therapist/therapist";
import { Loader2 } from "lucide-react";
import TherapistDetailsPage from "@/components/pages/therapist/therapist-details-page";

export default function TherapistMyProfilePage() {
  const { user } = useAuthStore();
  const userId = user?.id ?? "";

  const {
    data: therapist,
    isLoading,
    isError,
    error,
  } = useGetTherapistByUserId(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !therapist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-muted-foreground">
        <p>Could not load your profile.</p>
        <p className="text-sm">{error?.message ?? "Therapist record not found"}</p>
      </div>
    );
  }

  return (
    <TherapistDetailsPage
      data={therapist}
      onClose={() => {}}
      onRequestDelete={() => {}}
      isDeleting={false}
      hideDelete
      hideStatus
    />
  );
}
