"use server";
import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";
import { TherapistformType } from "@/type/schema";

export default async function addTherapist(
  values: TherapistformType,
): Promise<ApiResponse<any>> {
  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  };
  try {
    const response = await fetchWithAuth(`${base_url}/api/therapist`, options);
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
      message: result.message ?? "Data posted successfully",
      data: result.data,
    };
  } catch (err) {
    console.error("[addDoctor]", err);
    return { success: false, message: "Something went wrong" };
  }
}
