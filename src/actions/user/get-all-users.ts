"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import type { ApiResponse } from "@/type/api";

export type StaffUser = {
    _id: string;
    userfName: string;
    userlName: string;
    userEmail: string;
    role: string;
    isActive: boolean;
};

export default async function getAllUsers(): Promise<ApiResponse<StaffUser[]>> {
    try {
        const response = await fetchWithAuth(`${base_url}/api/users/getallusers`, {
            method: "GET",
            headers: { accept: "application/json" },
        });
        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            return {
                success: false,
                message: result.message ?? `Request failed with status ${response.status}`,
            };
        }
        const result = await response.json();
        // Backend shape: { success, data: { users: [...] } } — flatten to data: [...]
        return {
            success: true,
            message: result.message ?? "Users fetched successfully",
            data: result.data?.users ?? [],
        };
    } catch (err) {
        console.error("[getAllUsers]", err);
        return { success: false, message: "Network error, please try again" };
    }
}
