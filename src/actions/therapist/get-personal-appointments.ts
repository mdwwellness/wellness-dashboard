"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";

export default async function getPersonalAppointments(
  id: string,
): Promise<ApiResponse<any>> {
  const options: RequestInit = {
    method: "GET",
    headers: {
      accept: "application/json",
    },
    cache: "no-cache",
  };

  try {
    const response = await fetchWithAuth(
      `${base_url}/api/therapist/${id}`,
      options,
    );
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return {
        success: false,
        message:
          result.message ?? `Request failed with status ${response.status}`,
      };
    }
    const result = await response.json()
    return {
      success: true,
      message:  result.message||"Data fetched successfully",
      data: result.data,
    };
  } catch (error) {
    console.error("[get-appointment]",error);
    return {
      success: false,
     message: "Network error, please try again"
    };
  }
}
