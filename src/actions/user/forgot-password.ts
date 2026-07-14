"use server";

import { base_url } from "@/constant";
import { ApiResponse } from "@/type/api";

export const forgotPassword = async (
  userEmail: string,
): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${base_url}/api/users/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail }),
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
    return { success: true, message: body.message || "Reset code sent" };
  } catch (error) {
    console.error("[forgotPassword]", error);
    return { success: false, message: "Network error, please try again" };
  }
};
