"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export default async function changePassword(
  values: ChangePasswordPayload,
): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithAuth(
      `${base_url}/api/users/change-password`,
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
      message: result.message || "Password updated successfully",
    };
  } catch (err) {
    console.error("[changePassword]", err);
    return { success: false, message: "Network error, please try again" };
  }
}
