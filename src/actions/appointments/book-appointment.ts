"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";
import { slotBookingZodType } from "@/type/schema";

export default async function addAppointments(values: slotBookingZodType): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithAuth(`${base_url}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

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
      message: result.message || "Appointment added successfully",
    };
  } catch (err) {
    console.error("[addAppointments]", err);
    return { success: false, message: "Network error, please try again" };
  }
}