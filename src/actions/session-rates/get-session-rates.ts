"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";
import type { SessionRateTier } from "@/type/schema";

export type SessionRateCard = { tiers: SessionRateTier[] };

export default async function getSessionRates(): Promise<
  ApiResponse<SessionRateCard>
> {
  try {
    const response = await fetchWithAuth(`${base_url}/api/session-rates`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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
      message: result.message ?? "OK",
      data: result.data as SessionRateCard,
    };
  } catch (err) {
    console.error("[getSessionRates]", err);
    return { success: false, message: "Network error, please try again" };
  }
}
