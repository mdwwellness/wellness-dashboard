"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CirclePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

import { findOpenEnquiryByPhone, useCreateEnquiry } from "@/data/enquiry/enquiry";
import type { EnquiryType } from "@/type/schema";

const intakeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phonenumber: z
    .number({ error: "Phone is required" })
    .refine((n) => String(n).length >= 10, "Phone must be at least 10 digits"),
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
  existingRecords: EnquiryType[] | undefined;
  onDuplicateFound: (record: EnquiryType) => void;
}

export function EnquiryIntakeModal({
  existingRecords,
  onDuplicateFound,
}: EnquiryIntakeModalProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateEnquiry();

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phonenumber: undefined as unknown as number,
      preferredReachOutTime: { from: "", to: "" },
      note: "",
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) form.reset();
  }

  function onSubmit(values: IntakeFormValues) {
    const dup = findOpenEnquiryByPhone(existingRecords, values.phonenumber);
    if (dup) {
      toast.error("This phone already has an open enquiry", {
        description: `Opening "${dup.name}" instead.`,
      });
      setOpen(false);
      form.reset();
      onDuplicateFound(dup);
      return;
    }

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
        <Button className="flex items-center gap-1">
          <CirclePlus className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            New Enquiry
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
                      type="number"
                      placeholder="10-digit phone"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Preferred reach-out time</FormLabel>
              <div className="grid grid-cols-2 gap-3">
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
