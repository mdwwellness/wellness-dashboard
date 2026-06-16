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
    // Hide enquiry-stage records — they live on /dashboard/enquiries.
    const records = (result.data ?? []) as slotBookingZodType[];
    return records.filter((r) => r.status !== "enquiry");
  },
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchInterval: 5 * 60 * 1000,
  retry: 3,
});

export function useGetAllAppointments(user: UserType) {
  return useQuery(appointmentsQueryOptions(user));
}

// Appointments and enquiries are the same backend collection, so any
// mutation must invalidate both query keys — otherwise edits made from
// the enquiries drawer won't refresh the enquiries page (and vice versa).
function invalidateAppointmentAndEnquiryQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["appointments"] });
  queryClient.invalidateQueries({ queryKey: ["enquiries"] });
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
      invalidateAppointmentAndEnquiryQueries(queryClient);
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
      invalidateAppointmentAndEnquiryQueries(queryClient);
    },
  });
}

export function useUpdateAppointment(opts?: { silent?: boolean }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: slotBookingZodType) => {
      const result = await updateAppointment(values);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (result) => {
      // Auto-save callers (e.g. the enquiry drawer) pass silent:true and show
      // an inline "Saved" indicator instead of a toast on every blur/toggle.
      if (!opts?.silent) {
        toast.success("Appointment updated", { description: result.message });
      }
      invalidateAppointmentAndEnquiryQueries(queryClient);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Update failed");
    },
  });
}