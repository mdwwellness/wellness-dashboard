"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CirclePlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useCreateEnquiry } from "@/data/enquiry/enquiry";

const intakeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phonenumber: z
    .number({ error: "Phone is required" })
    .refine((n) => String(n).length === 10, "Phone must be exactly 10 digits"),
  preferredReachOutTime: z
    .object({
      from: z.string().min(1, "Start time is required"),
      to: z.string().min(1, "End time is required"),
    })
    .refine((v) => v.from < v.to, {
      message: "End time must be after start time",
      path: ["to"],
    }),
  note: z.string().optional(),
});

type IntakeFormValues = z.infer<typeof intakeFormSchema>;

interface EnquiryIntakeModalProps {
  /** Pre-fill fields — used from the Customers drawer for follow-up bookings. */
  prefill?: Partial<IntakeFormValues>;
  triggerLabel?: string;
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function EnquiryIntakeModal({
  prefill,
  triggerLabel = "New Enquiry",
  triggerVariant = "default",
  className,
}: EnquiryIntakeModalProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateEnquiry();

  const emptyValues: IntakeFormValues = {
    name: "",
    phonenumber: undefined as unknown as number,
    preferredReachOutTime: { from: "", to: "" },
    note: "",
  };

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeFormSchema),
    mode: "onChange",
    defaultValues: emptyValues,
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && prefill) {
      form.reset({ ...emptyValues, ...prefill });
    }
    if (!next) form.reset(emptyValues);
  }

  function onSubmit(values: IntakeFormValues) {
    createMutation.mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          className={`flex items-center gap-1 ${className ?? ""}`}
        >
          <CirclePlus className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {triggerLabel}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New enquiry</DialogTitle>
          <DialogDescription>
            Log an inbound lead. You can fill in slots and the assigned
            therapist later from the detail drawer.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phonenumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit phone"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        // Keep only digits, hard-cap at 10 — you can't type an 11th.
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        field.onChange(digits === "" ? undefined : Number(digits));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Preferred reach-out time</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="preferredReachOutTime.from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        From
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredReachOutTime.to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        To
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                When does the client want to be reached? Browser will show
                AM/PM based on your locale.
              </p>
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What did the lead say?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Read-only IDs — assigned server-side on save */}
            <div className="rounded-md border bg-muted/30 p-2.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enquiry ID</span>
                <span className="font-mono text-muted-foreground">
                  assigned on save
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer ID</span>
                <span className="font-mono text-muted-foreground">
                  linked by phone on save
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </span>
              ) : (
                "Create enquiry"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
