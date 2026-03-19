"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";

export default async function deleteTherapist(id: string):Promise<ApiResponse<any>>{
  const options: RequestInit = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
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
      message: result.message||"therapist deleted successfully",
    };
  } catch (err) {
    console.error("[deleteTherapist]", err); 
    return { success: false, message: "Network error, please try again" };
  }
}
