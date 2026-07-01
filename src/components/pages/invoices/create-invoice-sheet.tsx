"use client";

import { useMemo, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CirclePlus, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCreateInvoice } from "@/data/invoice/invoice";
import type { InvoiceType } from "@/type/invoice";
import {
  CustomerSearchField,
  type CustomerSelection,
} from "./customer-search-field";

const INVOICE_TYPES: { value: InvoiceType; label: string }[] = [
  { value: "online_consultation", label: "Online consultation" },
  { value: "therapy_session", label: "Therapy session" },
  { value: "package_purchase", label: "Package purchase" },
  { value: "therapy_addon_standalone", label: "Therapy add-on" },
];

const formSchema = z.object({
  invoice_type: z.enum([
    "online_consultation",
    "therapy_session",
    "package_purchase",
    "therapy_addon_standalone",
  ]),
  customer_id: z.string().optional(),
  customer_name: z.string().min(2, "Name is required"),
  customer_phone: z
    .number({ error: "Phone is required" })
    .refine((n) => String(n).length >= 10, "Phone must be at least 10 digits"),
  customer_email: z.string().optional(),
  customer_address: z.string().optional(),
  enquiry_id: z.string().optional(),
  therapist_name: z.string().optional(),
  advance_paid: z.number().min(0).optional(),
  payment_status: z.enum(["paid", "pending"]).optional(),
  line_items: z
    .array(
      z.object({
        description: z.string().min(1, "Description required"),
        price: z.number().min(0, "Price must be 0 or more"),
      }),
    )
    .min(1, "Add at least one line item"),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  invoice_type: "online_consultation",
  customer_id: "",
  customer_name: "",
  customer_phone: undefined as unknown as number,
  customer_email: "",
  customer_address: "",
  enquiry_id: "",
  therapist_name: "",
  advance_paid: 0,
  payment_status: "pending",
  line_items: [{ description: "Online Consultation", price: 500 }],
};

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

export function CreateInvoiceSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (invoiceId: string) => void;
}) {
  const mutation = useCreateInvoice();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items",
  });

  const lineItems = useWatch({ control: form.control, name: "line_items" });
  const advancePaid = useWatch({ control: form.control, name: "advance_paid" }) ?? 0;

  const subtotal = useMemo(
    () =>
      (lineItems ?? []).reduce(
        (sum, li) => sum + (Number(li?.price) || 0),
        0,
      ),
    [lineItems],
  );
  const balanceDue = subtotal - (Number(advancePaid) || 0);

  function handleCustomerChange(sel: CustomerSelection) {
    form.setValue("customer_id", sel.customer_id ?? "");
    form.setValue("customer_name", sel.customer_name);
    if (sel.customer_phone) form.setValue("customer_phone", sel.customer_phone);
    form.setValue("customer_email", sel.email ?? "");
    form.setValue("customer_address", sel.address ?? "");
  }

  function onSubmit(values: FormValues) {
    mutation.mutate(
      {
        invoice_type: values.invoice_type,
        customer_id: values.customer_id || undefined,
        customer_name: values.customer_name,
        customer_phone: values.customer_phone,
        enquiry_id: values.enquiry_id || undefined,
        therapist_name: values.therapist_name || undefined,
        line_items: values.line_items,
        advance_paid: values.advance_paid,
        payment_status: values.payment_status,
      },
      {
        onSuccess: (data) => {
          onOpenChange(false);
          form.reset(defaultValues);
          if (data?.invoice_id) onCreated?.(data.invoice_id);
        },
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl overflow-y-auto p-0"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background px-6 py-4">
          <div>
            <SheetHeader className="p-0 text-left">
              <SheetTitle>Add an invoice</SheetTitle>
              <SheetDescription>
                Create a new invoice — search a customer or enter details below.
              </SheetDescription>
            </SheetHeader>
          </div>
          <Button
            type="submit"
            form="create-invoice-form"
            disabled={mutation.isPending}
            className="shrink-0"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Add invoice"
            )}
          </Button>
        </div>

        <Form {...form}>
          <form
            id="create-invoice-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 lg:grid-cols-5 gap-0 min-h-0"
          >
            {/* Left — details */}
            <div className="lg:col-span-3 space-y-6 p-6 border-b lg:border-b-0 lg:border-r">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Invoice details</h3>
                <FormField
                  control={form.control}
                  name="invoice_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INVOICE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Customer details</h3>
                <CustomerSearchField
                  value={{
                    customer_id: form.watch("customer_id"),
                    customer_name: form.watch("customer_name"),
                    customer_phone: form.watch("customer_phone"),
                    email: form.watch("customer_email"),
                    address: form.watch("customer_address"),
                  }}
                  onChange={handleCustomerChange}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="customer_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10-digit mobile"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? undefined
                                  : e.target.valueAsNumber,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customer_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="customer@mail.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="customer_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City / address</FormLabel>
                      <FormControl>
                        <Input placeholder="Location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Line items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ description: "", price: 0 })}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add row
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`line_items.${index}.description`}
                      render={({ field: f }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Description" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`line_items.${index}.price`}
                      render={({ field: f }) => (
                        <FormItem className="w-28">
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="₹"
                              value={f.value ?? ""}
                              onChange={(e) =>
                                f.onChange(
                                  e.target.value === ""
                                    ? 0
                                    : e.target.valueAsNumber,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="enquiry_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enquiry ID (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ENQ-0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="therapist_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Therapist (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Therapist name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>
            </div>

            {/* Right — summary */}
            <div className="lg:col-span-2 p-6 bg-muted/30 space-y-4">
              <h3 className="text-sm font-semibold">Invoice summary</h3>

              <div className="rounded-lg border bg-background p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatINR(subtotal)}
                  </span>
                </div>

                <FormField
                  control={form.control}
                  name="advance_paid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">
                        Advance paid
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : e.target.valueAsNumber,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="flex justify-between font-medium">
                  <span>Balance due</span>
                  <span className="font-mono tabular-nums">
                    {formatINR(balanceDue)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Final total</span>
                  <span className="font-mono tabular-nums">
                    {formatINR(subtotal)}
                  </span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export function CreateInvoiceTrigger({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <Button className="gap-2" onClick={onOpen}>
      <CirclePlus className="h-4 w-4" />
      Add invoice
    </Button>
  );
}
