"use client";

import getAllUsers, { type StaffUser } from "@/actions/user/get-all-users";
import { useQuery } from "@tanstack/react-query";

export type { StaffUser };

const BACK_OFFICE_ROLES = new Set([
    "SUPER_ADMIN",
    "ADMIN",
    "STAFF",
    "CUSTOMER_CARE",
]);

export function useGetBackOfficeUsers() {
    return useQuery({
        queryKey: ["users", "back-office"],
        queryFn: async (): Promise<StaffUser[]> => {
            const result = await getAllUsers();
            if (!result.success) throw new Error(result.message);
            const all = result.data ?? [];
            return all.filter(
                (u) => u.isActive && BACK_OFFICE_ROLES.has(u.role),
            );
        },
        staleTime: 10 * 60 * 1000, // 10 min — staff list doesn't change often
        refetchOnWindowFocus: false,
    });
}
