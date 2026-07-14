"use server";

import { base_url } from "@/constant";
import { ApiResponse } from "@/type/api";

export const resetPassword = async (values: {
  userEmail: string;
  otp: string;
  newPassword: string;
}): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${base_url}/api/users/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message:
          body.message ?? `Request failed with status ${response.status}`,
      };
    }
    return { success: true, message: body.message || "Password reset" };
  } catch (error) {
    console.error("[resetPassword]", error);
    return { success: false, message: "Network error, please try again" };
  }
};
