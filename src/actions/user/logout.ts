"use server";

import { base_url } from "@/constant";
import { cookies } from "next/headers";

export async function logoutAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  const accessToken = cookieStore.get("accessToken")?.value;

  // Fire-and-forget: best-effort tell the backend to clear its stored
  // refresh token. We don't care if this fails (expired/invalid tokens,
  // backend down, etc.) - the important part is clearing the cookies
  // client-side so the user is logged out regardless.
  if (refreshToken) {
    try {
      const parts: string[] = [];
      if (accessToken) parts.push(`accessToken=${accessToken}`);
      parts.push(`refreshToken=${refreshToken}`);

      await fetch(`${base_url}/api/users/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: parts.join("; "),
        },
        cache: "no-store",
      });
    } catch {
      // ignore - cookies will be deleted either way
    }
  }

  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");

  return { success: true };
}
