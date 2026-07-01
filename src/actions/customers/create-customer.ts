"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";
import type { CreateCustomerInput, PersistedCustomer } from "@/type/customer-record";

export default async function createCustomer(
  values: CreateCustomerInput,
): Promise<ApiResponse<PersistedCustomer>> {
  try {
    const response = await fetchWithAuth(`${base_url}/api/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

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
      message: result.message ?? "Customer created",
      data: result.data as PersistedCustomer,
    };
  } catch (err) {
    return { success: false, message: "Network error, please try again" };
  }
}

