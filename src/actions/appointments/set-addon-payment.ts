"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import type { ApiResponse } from "@/type/api";
import type { slotBookingZodType } from "@/type/schema";

export default async function setAddonPaymentStatus(
  appointmentId: string,
  values: { serviceId: string; recommendedAt: string; collected: boolean },
): Promise<ApiResponse<slotBookingZodType>> {
  try {
    const response = await fetchWithAuth(
      `${base_url}/api/appointments/${appointmentId}/recommendations/payment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
      message: result.message ?? "Add-on payment status updated",
      data: result.data as slotBookingZodType,
    };
  } catch (err) {
    console.error("[setAddonPaymentStatus]", err);
    return { success: false, message: "Network error, please try again" };
  }
}
