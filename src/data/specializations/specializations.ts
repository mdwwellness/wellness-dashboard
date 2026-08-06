"use client";

import addSpecialization, {
  AddSpecializationInput,
} from "@/actions/specializations/add-specialization";
import {
  getSpecializations,
  Specialization,
} from "@/actions/specializations/get-specializations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useGetSpecializations() {
  return useQuery({
    queryKey: ["specializations"],
    queryFn: async (): Promise<Specialization[]> => {
      const result = await getSpecializations();
      if (!result.success) throw new Error(result.message);
      return (result.data ?? []) as Specialization[];
    },
    refetchOnWindowFocus: false,
  });
}

export function useAddSpecialization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: AddSpecializationInput) => {
      const result = await addSpecialization(values);
      if (!result.success) throw new Error(result.message);
      return result.data as Specialization;
    },
    onSuccess: () => {
      toast.success("Specialization added");
      queryClient.invalidateQueries({ queryKey: ["specializations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
