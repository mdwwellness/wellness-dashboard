"use server";
import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";
import type { ClinicSettings } from "./get-clinic-settings";

export default async function updateClinicSettings(
  bookingGapMinutes: number,
): Promise<ApiResponse<ClinicSettings>> {
  try {
    const response = await fetchWithAuth(`${base_url}/api/clinic-settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingGapMinutes }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return { success: false, message: result.message ?? `Request failed with status ${response.status}` };
    }
    const result = await response.json();
    return { success: true, message: result.message ?? "Saved", data: result.data as ClinicSettings };
  } catch (err) {
    console.error("[updateClinicSettings]", err);
    return { success: false, message: "Network error, please try again" };
  }
}
