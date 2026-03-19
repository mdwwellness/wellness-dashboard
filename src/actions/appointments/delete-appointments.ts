"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";

export default async function deleteAppointment(id: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithAuth(`${base_url}/api/appointments/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
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
      message: result.message || "Appointment deleted successfully",
    };
  } catch (err) {
    console.error("[deleteAppointment]", err);
    return { success: false, message: "Network error, please try again" };
  }
}