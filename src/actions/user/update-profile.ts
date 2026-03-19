"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";

export default async function updateProfile(
  values: any,
): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithAuth(
      `${base_url}/api/users/complete-profile`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
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
      message: result.message || "profile updated successfully",
    };
  } catch (err) {
    console.error("[updateTherapist]", err);
    return { success: false, message: "Network error, please try again" };
  }
}
