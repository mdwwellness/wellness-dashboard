"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";
import type { PersistedCustomer } from "@/type/customer-record";

export async function getCustomers(q?: string): Promise<ApiResponse<PersistedCustomer[]>> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);

  try {
    const url = `${base_url}/api/customers${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetchWithAuth(url, { method: "GET", cache: "no-store" });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return {
        success: false,
        message: result.message ?? `Request failed with status ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message ?? "Customers fetched successfully",
      data: (result.data ?? []) as PersistedCustomer[],
    };
  } catch (err) {
    return { success: false, message: "Network error, please try again" };
  }
}

