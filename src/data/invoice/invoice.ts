"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  InvoicePaymentStatus,
  PersistedInvoice,
  UpdateInvoiceInput,
  CreateInvoiceInput,
} from "@/type/invoice";
import { getAllInvoices } from "@/actions/invoices/get-all-invoices";
import updateInvoice from "@/actions/invoices/update-invoice";
import generateInvoicePdf from "@/actions/invoices/generate-invoice-pdf";
import createInvoice from "@/actions/invoices/create-invoice";

export function useGetInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async (): Promise<PersistedInvoice[]> => {
      const result = await getAllInvoices();
      if (!result.success) throw new Error(result.message);
      return (result.data ?? []) as PersistedInvoice[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { invoiceId: string; values: UpdateInvoiceInput }) => {
      const result = await updateInvoice(args.invoiceId, args.values);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Invoice updated");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGenerateInvoicePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      regenerate = false,
    }: {
      invoiceId: string;
      regenerate?: boolean;
    }) => {
      const result = await generateInvoicePdf(invoiceId, { regenerate });
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.regenerate ? "Invoice PDF regenerated" : "Invoice PDF generated");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CreateInvoiceInput) => {
      const result = await createInvoice(values);
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Invoice created");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

