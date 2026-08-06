"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";

export type AddSpecializationInput = {
  value: string;
  label: string;
};

export default async function addSpecialization(
  values: AddSpecializationInput,
): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithAuth(`${base_url}/api/specializations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

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
      message: result.message ?? "Specialization added",
      data: result.data,
    };
  } catch (err) {
    console.error("[addSpecialization]", err);
    return { success: false, message: "Network error, please try again" };
  }
}
