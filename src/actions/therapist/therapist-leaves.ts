"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";

export interface TherapistLeave {
  _id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export async function getTherapistLeaves(
  doctorId: string,
): Promise<{ success: boolean; data: TherapistLeave[]; message?: string }> {
  try {
    const response = await fetchWithAuth(
      `${base_url}/api/therapist-leaves/${doctorId}`,
      { method: "GET", headers: { accept: "application/json" }, cache: "no-cache" },
    );
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return { success: false, data: [], message: result.message ?? "Failed" };
    }
    const result = await response.json();
    return { success: true, data: result.data ?? [] };
  } catch {
    return { success: false, data: [], message: "Network error" };
  }
}

export async function createTherapistLeave(data: {
  doctorId: string;
  startDate: string;
  endDate?: string;
  reason?: string;
}): Promise<{ success: boolean; data?: TherapistLeave; message?: string }> {
  try {
    const response = await fetchWithAuth(
      `${base_url}/api/therapist-leaves`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return { success: false, message: result.message ?? "Failed" };
    }
    const result = await response.json();
    return { success: true, data: result.data };
  } catch {
    return { success: false, message: "Network error" };
  }
}

export async function deleteTherapistLeave(
  id: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetchWithAuth(
      `${base_url}/api/therapist-leaves/${id}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return { success: false, message: result.message ?? "Failed" };
    }
    return { success: true };
  } catch {
    return { success: false, message: "Network error" };
  }
}

export async function updateWeekOffDays(
  doctorId: string,
  weekOffDays: number[],
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetchWithAuth(
      `${base_url}/api/therapist-leaves/week-off/${doctorId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekOffDays }),
      },
    );
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return { success: false, message: result.message ?? "Failed" };
    }
    return { success: true };
  } catch {
    return { success: false, message: "Network error" };
  }
}
