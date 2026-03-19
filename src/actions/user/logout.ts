"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { cookies } from "next/headers";

export async function logoutAction() {
  const cookieStore = await cookies();

  try {
    await fetchWithAuth(`${base_url}/api/users/logout`, {
      method: "POST",
    });
  } catch (err: any) {
    console.log(err.message || "error logout");
  }

  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");

  return { success: true };
}
