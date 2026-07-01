"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import type { ApiResponse } from "@/type/api";

export default async function generateInvoicePdf(
  invoiceId: string,
  options?: { regenerate?: boolean },
): Promise<ApiResponse<{ pdf_url: string }>> {
  try {
    const params = options?.regenerate ? "?regenerate=true" : "";
    const response = await fetchWithAuth(
      `${base_url}/api/invoices/${invoiceId}/pdf${params}`,
      {
        method: "POST",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return {
        success: false,
        message: (result as any).message ?? `Request failed with status ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message ?? "PDF generated",
      data: result.data as { pdf_url: string },
    };
  } catch {
    return { success: false, message: "Network error, please try again" };
  }
}

