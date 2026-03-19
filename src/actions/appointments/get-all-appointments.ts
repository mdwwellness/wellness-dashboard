"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";
import { UserType } from "@/type/schema";

export default async function getAllAppointments(user: UserType): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithAuth(
      `${base_url}/api/appointments?role=${user?.role}&id=${user?.id}&email=${user?.userEmail}`,
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
      message: result.message || "Appointments fetched successfully",
      data: result.data,
    };
  } catch (error) {
    console.error("[getAllAppointments]", error);
    return { success: false, message: "Network error, please try again" };
  }
}