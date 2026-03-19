"use server";
import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import { ApiResponse } from "@/type/api";

export const deleteUser = async (values: any): Promise<ApiResponse<any>> => {
  try {
    const response = await fetchWithAuth(
      `${base_url}/api/users/admin/register-user`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(values),
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
      message: result.message || "user deleted successfully",
      data: result.data,
    };
  } catch (error) {
    console.error("[deleteUser]", error);
    return {
      success: false,
      message: "network error",
    };
  }
};
