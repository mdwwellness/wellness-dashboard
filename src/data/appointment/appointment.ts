"use client";

import addAppointments from "@/actions/appointments/book-appointment";
import deleteAppointment from "@/actions/appointments/delete-appointments";
import getAllAppointments from "@/actions/appointments/get-all-appointments";
import updateAppointment from "@/actions/appointments/update-appointment";
import { slotBookingZodType, UserType } from "@/type/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const appointmentsQueryOptions = (user: UserType) => ({
  queryKey: ["appointments", user], 
  queryFn: async () => {
    const result = await getAllAppointments(user);
    if (!result.success) throw new Error(result.message);
    return result.data;
  },
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchInterval: 5 * 60 * 1000,
  retry: 3,
});

export function useGetAllAppointments(user: UserType) {
  return useQuery(appointmentsQueryOptions(user));
}

export function useBookAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: slotBookingZodType) => {
      const result = await addAppointments(values);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (result) => {
      toast.success("Appointment booked", { description: result.message });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteAppointment(id);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (result) => {
      toast.success("Appointment cancelled", { description: result.message });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: slotBookingZodType) => {
      const result = await updateAppointment(values);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (result) => {
      toast.success("Appointment updated", { description: result.message });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}