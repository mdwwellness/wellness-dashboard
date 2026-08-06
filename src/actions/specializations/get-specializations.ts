"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";

export type Specialization = {
  _id?: string;
  value: string;
  label: string;
};

export async function getSpecializations(): Promise<
  ApiResponse<Specialization[]>
> {
  try {
    const response = await fetchWithAuth(`${base_url}/api/specializations`, {
      method: "GET",
      cache: "no-cache",
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return {
        success: false,
        message: result.message ?? "Failed to fetch specializations",
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: "Specializations fetched successfully",
      data: result.data,
    };
  } catch (error) {
    console.error("[getSpecializations]", error);
    return { success: false, message: "Network error, please try again" };
  }
}
