"use client";

import createEnquiry, {
  type CreateEnquiryInput,
} from "@/actions/enquiries/create-enquiry";
import getAllAppointments from "@/actions/appointments/get-all-appointments";
import type { EnquiryType, UserType } from "@/type/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const OPEN_STATUSES = new Set<NonNullable<EnquiryType["status"]>>([
  "enquiry",
  "scheduled",
  "ongoing",
]);

export const enquiriesQueryOptions = (user: UserType) => ({
  queryKey: ["enquiries", user] as const,
  queryFn: async (): Promise<EnquiryType[]> => {
    const result = await getAllAppointments(user);
    if (!result.success) throw new Error(result.message);
    return (result.data ?? []) as EnquiryType[];
  },
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
});

export function useGetAllEnquiries(user: UserType) {
  return useQuery(enquiriesQueryOptions(user));
}

export function findOpenEnquiryByPhone(
  records: EnquiryType[] | undefined,
  phonenumber: number,
): EnquiryType | undefined {
  if (!records) return undefined;
  return records.find(
    (r) =>
      r.phonenumber === phonenumber &&
      r.status !== undefined &&
      OPEN_STATUSES.has(r.status),
  );
}

export function useCreateEnquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CreateEnquiryInput) => {
      const result = await createEnquiry(values);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (result) => {
      toast.success("Enquiry created", { description: result.message });
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
