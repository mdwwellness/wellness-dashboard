"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import type { ApiResponse } from "@/type/api";
import type { UpdateInvoiceInput } from "@/type/invoice";

export default async function updateInvoice(
  invoiceId: string,
  values: UpdateInvoiceInput,
): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithAuth(`${base_url}/api/invoices/${invoiceId}`, {
      method: "PATCH",
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
      message: result.message ?? "Invoice updated",
      data: result.data,
    };
  } catch (err) {
    return { success: false, message: "Network error, please try again" };
  }
}

