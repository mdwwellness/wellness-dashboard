"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";

export default async function getAllUsers(): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithAuth(
      `${base_url}/api/users/getallusers`,
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
    console.log("result",result)
    return {
      success: true,
      message: result.message || "users fetched successfully",
      data: result.data,
    };
  } catch (error) {
    console.error("[getAllUsers]", error);
    return { success: false, message: "Network error, please try again" };
  }
}