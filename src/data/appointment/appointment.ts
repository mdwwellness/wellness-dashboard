"use client";

import addAppointments from "@/actions/appointments/book-appointment";
import addAppointmentRecommendation, {
  type AddRecommendationInput,
} from "@/actions/appointments/add-appointment-recommendation";
import confirmAppointmentRecommendation from "@/actions/appointments/confirm-appointment-recommendation";
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
    return records.filter(
      (r) => r.status !== "enquiry" && r.appointmentKind !== "recommended",
    );
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

function patchAppointmentInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  appointmentId: string,
  patch: slotBookingZodType,
) {
  queryClient.setQueriesData<slotBookingZodType[]>(
    { queryKey: ["appointments"] },
    (old) => {
      if (!old) return old;
      return old.map((a) => (a._id === appointmentId ? { ...a, ...patch } : a));
    },
  );
}

export function useAddAppointmentRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      values,
    }: {
      appointmentId: string;
      values: AddRecommendationInput;
    }) => {
      const result = await addAppointmentRecommendation(appointmentId, values);
      if (!result.success) throw new Error(result.message);
      return { ...result, appointmentId };
    },
    onSuccess: (result) => {
      if (result.data && result.appointmentId) {
        patchAppointmentInCache(queryClient, result.appointmentId, result.data);
      }
      toast.success("Add-on stacked on visit", { description: result.message });
      invalidateAppointmentAndEnquiryQueries(queryClient);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useConfirmAppointmentRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      serviceId,
      recommendedAt,
    }: {
      appointmentId: string;
      serviceId: string;
      recommendedAt: string;
    }) => {
      const result = await confirmAppointmentRecommendation(appointmentId, {
        serviceId,
        recommendedAt,
      });
      if (!result.success) throw new Error(result.message);
      return { ...result, appointmentId };
    },
    onSuccess: (result) => {
      if (result.data && result.appointmentId) {
        patchAppointmentInCache(queryClient, result.appointmentId, result.data);
      }
      toast.success("Add-on confirmed", { description: result.message });
      invalidateAppointmentAndEnquiryQueries(queryClient);
    },
    onError: (err: Error) => toast.error(err.message),
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