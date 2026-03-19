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
      return {
        success: false,
        message: "Failed to fetch therapist",
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
