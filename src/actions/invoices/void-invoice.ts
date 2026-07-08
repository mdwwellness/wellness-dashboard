"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import type { ApiResponse } from "@/type/api";

export default async function voidInvoice(
  invoiceId: string,
  reason: string,
): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithAuth(
      `${base_url}/api/invoices/${invoiceId}/void`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      },
    );

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
      message: result.message ?? "Invoice voided",
      data: result.data,
    };
  } catch (err) {
    return { success: false, message: "Network error, please try again" };
  }
}
