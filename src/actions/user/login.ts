"use server";

import { base_url } from "@/constant";
import { ApiResponse } from "@/type/api";
import { cookies } from "next/headers";

export const Login = async (values: any): Promise<ApiResponse<{ user: any }>> => {
  try {
    const response = await fetch(`${base_url}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
      cache: "no-store",
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: body.message ?? `Request failed with status ${response.status}`,
      };
    }

    const cookieStore = await cookies();
    const rawCookies = response.headers.getSetCookie();

    rawCookies.forEach((cookieString) => {
      const [nameValue] = cookieString.split("; ");
      const eqIndex = nameValue.indexOf("=");
      const name = nameValue.substring(0, eqIndex);
      const value = nameValue.substring(eqIndex + 1);

      if (name === "accessToken") {
        cookieStore.set("accessToken", value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 15 * 60,
        });
      }

      if (name === "refreshToken") {
        cookieStore.set("refreshToken", value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });
      }
    });

    return {
      success: true,
      message: body.message || "Login successful",
      data: { user: body.user },
    };
  } catch (error: any) {
    console.error("[Login]", error);
    return { success: false, message: "Network error, please try again" };
  }
};