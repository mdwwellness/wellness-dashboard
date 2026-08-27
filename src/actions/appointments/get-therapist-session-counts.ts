"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { withAuthErrorHandling } from "@/lib/server-action-error";
import { ApiResponse } from "@/type/api";

export type TherapistSessionCount = {
  doctorId: string;
  totalSessions: number;
  completedBookings: number;
};

export default async function getTherapistSessionCounts(): Promise<
  ApiResponse<TherapistSessionCount[]>
> {
  return withAuthErrorHandling(async () => {
    const response = await fetchWithAuth(
      `${base_url}/api/appointments/therapist-session-counts`,
      {
        method: "GET",
        headers: { accept: "application/json" },
      },
    );
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return {
        success: false,
        message: result.message ?? `Request failed with status ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Therapist session counts fetched successfully",
      data: result.data,
    };
  });
}
