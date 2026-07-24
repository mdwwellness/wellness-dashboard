"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import getClinicSettings, { type ClinicSettings } from "@/actions/clinic-settings/get-clinic-settings";
import updateClinicSettings from "@/actions/clinic-settings/update-clinic-settings";

const DEFAULT: ClinicSettings = { bookingGapMinutes: 60 };

export function useGetClinicSettings() {
  return useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async (): Promise<ClinicSettings> => {
      const result = await getClinicSettings();
      if (!result.success) throw new Error(result.message);
      return result.data ?? DEFAULT;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateClinicSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingGapMinutes: number) => {
      const result = await updateClinicSettings(bookingGapMinutes);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Booking gap saved");
      queryClient.invalidateQueries({ queryKey: ["clinic-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
