"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import type { ApiResponse } from "@/type/api";

/**
 * Ask the backend for this booking's public payment token, minting one if it
 * doesn't have it yet. Idempotent — a link already sent to a customer keeps
 * working, so an executive can safely hit "Request payment" twice.
 */
export default async function createPaymentLink(
  appointmentId: string,
): Promise<ApiResponse<{ payToken: string }>> {
  try {
    const response = await fetchWithAuth(
      `${base_url}/api/appointments/${appointmentId}/pay-link`,
      { method: "POST" },
    );

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return {
        success: false,
        message:
          result.message ?? `Request failed with status ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Payment link ready",
      data: result.data,
    };
  } catch (err) {
    console.error("[createPaymentLink]", err);
    return { success: false, message: "Network error, please try again" };
  }
}
