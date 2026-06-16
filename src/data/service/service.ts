"use client";

/**
 * ⚠️ STUB DATA LAYER — in-session mock only.
 *
 * Services are NOT yet persisted anywhere. This module keeps a module-level
 * array as a fake "DB" so the Services page is fully clickable (add/edit/delete
 * all work) for UI/UX review. Everything resets on page refresh.
 *
 * When the backend is ready (see scripts/SERVICES_BACKEND_PATCH.md), replace the
 * bodies of the four hooks below with real server actions + fetch calls. The
 * hook signatures and query key (["services"]) are designed to stay identical,
 * so the page components won't need to change.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ServiceFormType, ServiceType } from "@/type/schema";

// ── Fake in-memory store ─────────────────────────────────────────────────────
let SERVICES: ServiceType[] = [
  {
    _id: "seed-1",
    serviceId: "SRV-0001",
    name: "Initial Physiotherapy Consultation",
    description: "45-min assessment with a licensed physiotherapist.",
    price: 800,
    category: "Consultation",
    hsnCode: "999319",
  },
  {
    _id: "seed-2",
    serviceId: "SRV-0002",
    name: "Deep Tissue Massage (60 min)",
    description: "Full-body deep tissue massage session.",
    price: 1500,
    category: "Massage Therapy",
    hsnCode: "999722",
  },
  {
    _id: "seed-3",
    serviceId: "SRV-0003",
    name: "Personalized Diet Plan",
    description: "One-month customized nutrition plan with follow-up.",
    price: 2500,
    category: "Diet & Nutrition",
    hsnCode: "999319",
  },
];

let counter = SERVICES.length;

/** Mimics the backend atomic counter: SRV-0001, SRV-0002, … */
function nextServiceId(): string {
  counter += 1;
  return `SRV-${String(counter).padStart(4, "0")}`;
}

// Simulate a tiny network delay so loading states are visible.
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// ── Hooks ────────────────────────────────────────────────────────────────────
export function useGetServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async (): Promise<ServiceType[]> => {
      await delay();
      // return a copy so callers can't mutate the store directly
      return [...SERVICES];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAddService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ServiceFormType): Promise<ServiceType> => {
      await delay();
      const created: ServiceType = {
        ...values,
        _id: `local-${nextServiceId()}`,
        serviceId: `SRV-${String(counter).padStart(4, "0")}`,
      };
      SERVICES = [created, ...SERVICES];
      return created;
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
    mutationFn: async (service: ServiceType): Promise<ServiceType> => {
      await delay();
      SERVICES = SERVICES.map((s) =>
        s.serviceId === service.serviceId ? { ...s, ...service } : s,
      );
      return service;
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
    mutationFn: async (serviceId: string): Promise<void> => {
      await delay();
      SERVICES = SERVICES.filter((s) => s.serviceId !== serviceId);
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
  const categories = new Set(services.map((s) => s.category)).size;
  const prices = services.map((s) => s.price).filter((p) => p > 0);
  const avgPrice = prices.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : 0;
  return { totalServices, categories, avgPrice };
}
