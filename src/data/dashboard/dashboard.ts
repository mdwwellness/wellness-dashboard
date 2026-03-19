"use client";
import getAnalyticsData from "@/actions/get-analytics";
import { useQuery } from "@tanstack/react-query";

export function useGetAnalyticsData() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const result = await getAnalyticsData();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
