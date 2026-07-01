"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import type { ApiResponse } from "@/type/api";
import type { CreateInvoiceInput, PersistedInvoice } from "@/type/invoice";

export default async function createInvoice(
  values: CreateInvoiceInput,
): Promise<ApiResponse<PersistedInvoice>> {
  try {
    const response = await fetchWithAuth(`${base_url}/api/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return {
        success: false,
        message: (result as { message?: string }).message ?? `Request failed with status ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message ?? "Invoice created",
      data: result.data as PersistedInvoice,
    };
  } catch {
    return { success: false, message: "Network error, please try again" };
  }
}
