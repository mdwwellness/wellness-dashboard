"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/actions/customers/get-customers";
import type { PersistedCustomer } from "@/type/customer-record";

export function useSearchCustomers(search: string, enabled = true) {
  const q = search.trim();

  return useQuery({
    queryKey: ["customers", "search", q] as const,
    queryFn: async (): Promise<PersistedCustomer[]> => {
      const result = await getCustomers(q || undefined);
      if (!result.success) throw new Error(result.message);
      return result.data ?? [];
    },
    enabled,
    staleTime: 30_000,
  });
}
