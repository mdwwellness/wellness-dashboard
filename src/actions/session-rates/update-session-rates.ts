"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";
import type { SessionRateTier } from "@/type/schema";

export default async function updateSessionRates(
  tiers: SessionRateTier[],
): Promise<ApiResponse<{ tiers: SessionRateTier[] }>> {
  try {
    const response = await fetchWithAuth(`${base_url}/api/session-rates`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tiers }),
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
      message: result.message ?? "Session rates saved",
      data: result.data,
    };
  } catch (err) {
    console.error("[updateSessionRates]", err);
    return { success: false, message: "Network error, please try again" };
  }
}
