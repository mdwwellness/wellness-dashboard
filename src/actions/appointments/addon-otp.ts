"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";

/**
 * Mint a consent code for one recommended add-on, returned so it can be sent to
 * the customer over WhatsApp. Confirming the add-on then requires that code.
 */
export async function sendAddonOtp(
  appointmentId: string,
  serviceId: string,
  recommendedAt: string,
) {
  const res = await fetchWithAuth(
    `${base_url}/api/appointments/${appointmentId}/recommendations/otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId, recommendedAt }),
    },
  );
  const body = await res.json().catch(() => ({}));
  return {
    success: res.ok,
    code: body?.code as string | undefined,
    message: body?.message as string | undefined,
  };
}
