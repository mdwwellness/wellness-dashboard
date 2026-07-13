"use client";

/**
 * Services data layer — talks to the real backend (/api/services).
 *
 * Hook signatures and the ["services"] query key match the previous mock store,
 * so the Services page / drawer / add-form did not need any changes.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ServiceFormType, ServiceType } from "@/type/schema";
import { getAllServices } from "@/actions/services/get-all-services";
import addService from "@/actions/services/add-service";
import updateService from "@/actions/services/update-service";
import deleteService from "@/actions/services/delete-service";

export function useGetServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async (): Promise<ServiceType[]> => {
      const result = await getAllServices();
      if (!result.success) throw new Error(result.message);
      return (result.data ?? []) as ServiceType[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAddService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ServiceFormType) => {
      const result = await addService(values);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Service added");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (service: ServiceType) => {
      const result = await updateService(service);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      toast.success("Service updated");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serviceId: string) => {
      const result = await deleteService(serviceId);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      toast.success("Service deleted");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Derived stats for the KPI cards ──────────────────────────────────────────
export function computeServiceStats(services: ServiceType[]) {
  const totalServices = services.length;
  const prices = services.map((s) => s.originalPrice ?? 0).filter((p) => p > 0);
  const avgPrice = prices.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : 0;
  const withDiscount = services.filter(
    (s) =>
      (s.originalPrice ?? 0) > 0 &&
      (s.discountedPrice ?? 0) > 0 &&
      (s.discountedPrice as number) < (s.originalPrice as number),
  ).length;
  return { totalServices, avgPrice, withDiscount };
}
