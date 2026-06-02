"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import type { ApiResponse } from "@/type/api";
import type { EnquiryType } from "@/type/schema";

export type CreateEnquiryInput = Pick<
  EnquiryType,
  "name" | "phonenumber" | "preferredReachOutTime" | "note"
>;

export default async function createEnquiry(
  values: CreateEnquiryInput,
): Promise<ApiResponse<EnquiryType>> {
  try {
    const payload: Partial<EnquiryType> = {
      ...values,
      status: "enquiry",
      executiveReachedOut: false,
      consultationCompleted: false,
      physioAssignmentConfirmed: false,
    };

    const response = await fetchWithAuth(`${base_url}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      message: result.message || "Enquiry created successfully",
      data: result.data,
    };
  } catch (err) {
    console.error("[createEnquiry]", err);
    return { success: false, message: "Network error, please try again" };
  }
}
