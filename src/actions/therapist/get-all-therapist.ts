"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";

export async function getAllTherapist() {
  try {
    const response = await fetchWithAuth(`${base_url}/api/therapist`, {
      method: "GET",
      cache: "no-cache",
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      console.error("[getAllTherapist] API error:", response.status, result.message ?? "No message");
      return {
        success: false,
        message: result.message ?? `Request failed with status ${response.status}`,
      };
    }

    const result = await response.json();

    return {
      success: true,
      message: "Therapist fetched successfully",
      data: result.data,
    };
  } catch (error) {
    console.error("[getAllTherapist]", error);
    return {
      success: false,
      message: "Network error, please try again",
    };
  }
}
