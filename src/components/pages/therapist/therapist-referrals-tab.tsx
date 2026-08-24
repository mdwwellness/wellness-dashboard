"use client";

import { UserPlus } from "lucide-react";

interface TherapistReferralsTabProps {
  doctorId: string;
}

export function TherapistReferralsTab({ doctorId }: TherapistReferralsTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <UserPlus className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold">Referral tracking coming soon</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
        This tab will list every customer who booked via this therapist&apos;s
        referral link, along with the booking status and any referral rewards.
      </p>
    </div>
  );
}
