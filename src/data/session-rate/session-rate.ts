"use client";

/** Global session-rate table data layer — talks to /api/session-rates. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SessionRateTier } from "@/type/schema";
import getSessionRates, {
  type SessionRateCard,
} from "@/actions/session-rates/get-session-rates";
import updateSessionRates from "@/actions/session-rates/update-session-rates";

export function useGetSessionRates() {
  return useQuery({
    queryKey: ["session-rates"],
    queryFn: async (): Promise<SessionRateCard> => {
      const result = await getSessionRates();
      if (!result.success) throw new Error(result.message);
      return result.data ?? { tiers: [] };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateSessionRates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tiers: SessionRateTier[]) => {
      const result = await updateSessionRates(tiers);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      toast.success("Session rates saved");
      queryClient.invalidateQueries({ queryKey: ["session-rates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
