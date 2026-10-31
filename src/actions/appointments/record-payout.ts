"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import type { ApiResponse } from "@/type/api";

/**
 * Mark a therapist's payout on a booking paid (`paid: true`) or undo it. The
 * server works out the amount; Admin / Super Admin only.
 */
export default async function recordPayout(
  appointmentId: string,
  doctorId: string,
  paid: boolean,
): Promise<ApiResponse<null>> {
  try {
    const response = await fetchWithAuth(`${base_url}/api/appointments/${appointmentId}/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId, paid }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, message: result.message ?? `Request failed with status ${response.status}` };
    }
    return { success: true, message: result.message ?? "Payout recorded", data: null };
  } catch (err) {
    console.error("[recordPayout]", err);
    return { success: false, message: "Network error, please try again" };
  }
}
