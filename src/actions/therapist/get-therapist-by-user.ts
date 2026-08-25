"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";

export async function getTherapistByUserId(userId: string) {
  try {
    const response = await fetchWithAuth(`${base_url}/api/therapist/by-user/${userId}`, {
      method: "GET",
      cache: "no-cache",
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Failed to fetch therapist profile",
      };
    }

    const result = await response.json();

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("[getTherapistByUserId]", error);
    return {
      success: false,
      message: "Network error, please try again",
    };
  }
}
