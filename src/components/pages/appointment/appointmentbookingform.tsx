"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  CirclePlus,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { slotBookingZodSchema } from "@/type/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBookAppointment, useGetAllAppointments } from "@/data/appointment/appointment";
import { TherapistAvailabilityGrid } from "@/components/pages/enquiries/therapist-availability-grid";
import { useGetServices } from "@/data/service/service";
import { useGetClinicSettings } from "@/data/clinic-settings/clinic-settings";
import { CustomerSearchField } from "@/components/pages/invoices/customer-search-field";
import { sessionRate, sessionTotal, addonPrice } from "@/lib/service-pricing";
import {
  checkConflict,
  toMinutes,
  type ConflictResult,
} from "@/lib/booking-conflicts";
import { useGetSessionRates } from "@/data/session-rate/session-rate";
import { useAuthStore } from "@/providers/permission-provider";
import { formatINR } from "@/components/pages/services/services-columns";

type StackedService = { serviceId: string; discount: boolean };

/** Assignable visit lengths, in minutes — same options and default as the
 * enquiry-side control (therapist-availability-grid.tsx / enquiry-detail-drawer.tsx). */
const DURATION_OPTIONS = [30, 60, 90, 120];

export default function AppointmentBookingForm() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // Session-only by default; flip on to attach (stack) services.
  const [attachServices, setAttachServices] = useState(false);
  const [stacked, setStacked] = useState<StackedService[]>([]);
  // Visit length that drives the therapy span (therapyStartTime/EndTime) and
  // the conflict check below — same control + default as the enquiry side.
  const [durationMin, setDurationMin] = useState(60);
  // A too-close candidate is staged here (with its already-built payload)
  // until the exec confirms the soft-warn dialog.
  const [pendingTooClose, setPendingTooClose] = useState<{
    payload: z.infer<typeof slotBookingZodSchema>;
    conflict: ConflictResult;
  } | null>(null);

  const mutation = useBookAppointment();
  const { data: services = [], isLoading: servicesLoading } = useGetServices();
  const { data: rateCard } = useGetSessionRates();

  // Appointments (reused from the list) power the per-therapist day load AND
  // the pre-submit conflict check in onSubmit below.
  const authUser = useAuthStore((s) => s.user);
  const { data: appointments = [] } = useGetAllAppointments({
    id: authUser?.id,
    role: authUser?.role,
    userEmail: authUser?.userEmail,
  });
  const { data: clinicSettings } = useGetClinicSettings();
  const gapMinutes = clinicSettings?.bookingGapMinutes ?? 60;

  const form = useForm<z.infer<typeof slotBookingZodSchema>>({
    resolver: zodResolver(slotBookingZodSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      location: "",
      service: "",
      customer_id: "",
      sessionNumber: undefined,
      quotedPrice: undefined,
      typeOfappointment: "appointment",
      slot: {
        date: format(new Date(), "yyyy-MM-dd"),
        time: "",
      },
      note: "",
      age: undefined,
      phonenumber: undefined,
      email: "",
      doctor: "",
      therapyEndTime: "",
      therapyStartTime: "",
      doctorId: "",
      status: "scheduled",
    },
  });

  const selectedDate = form.watch("slot.date");
  const sessions = form.watch("sessionNumber");
  const quotedPrice = form.watch("quotedPrice");
  const doctorId = form.watch("doctorId");
  const customerId = form.watch("customer_id");

  const tiers = rateCard?.tiers ?? [];
  const noTier = (sessions ?? 0) > 0 && sessionRate(tiers, sessions ?? 0) === 0;

  // Priced stacked services + running totals for the breakdown.
  const stackedPriced = stacked.map((row) => {
    const svc = services.find((s) => s.serviceId === row.serviceId);
    return { ...row, svc, price: svc ? addonPrice(svc, row.discount) : 0 };
  });
  const servicesTotal = stackedPriced.reduce((sum, r) => sum + r.price, 0);
  const grandTotal = (quotedPrice ?? 0) + servicesTotal;

  // Auto-fill the session price from the GLOBAL rate table × session count.
  function recomputePrice(nextSessions: number | undefined) {
    const total = sessionTotal(tiers, nextSessions ?? 0);
    form.setValue("quotedPrice", total > 0 ? total : undefined);
  }

  const toggleAttach = (on: boolean) => {
    setAttachServices(on);
    if (!on) setStacked([]);
    else if (stacked.length === 0) setStacked([{ serviceId: "", discount: false }]);
  };
  const addStacked = () =>
    setStacked((s) => [...s, { serviceId: "", discount: false }]);
  const removeStacked = (i: number) =>
    setStacked((s) => s.filter((_, idx) => idx !== i));
  const patchStacked = (i: number, patch: Partial<StackedService>) =>
    setStacked((s) => s.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  // Builds the final payload: stacked services (if any) + the therapy span
  // computed from the picked start time + durationMin, zero-padded exactly
  // like enquiry-detail-drawer.tsx's confirmAssignment.
  function buildPayload(
    values: z.infer<typeof slotBookingZodSchema>,
  ): z.infer<typeof slotBookingZodSchema> {
    const payload = { ...values };
    if (attachServices) {
      const now = new Date().toISOString();
      payload.recommendedServices = stacked
        .filter((r) => r.serviceId)
        .map((r) => {
          const svc = services.find((s) => s.serviceId === r.serviceId);
          return {
            serviceId: r.serviceId,
            serviceName: svc?.name ?? "",
            quotedPrice: svc ? addonPrice(svc, r.discount) : 0,
            status: "confirmed" as const,
            recommendedAt: now,
          };
        });
    }

    const startMin = toMinutes(values.slot?.time ?? "");
    if (!Number.isNaN(startMin)) {
      const endMin = startMin + durationMin;
      payload.therapyStartTime = values.slot?.time;
      payload.therapyEndTime = `${String(Math.floor(endMin / 60)).padStart(
        2,
        "0",
      )}:${String(endMin % 60).padStart(2, "0")}`;
    }
    return payload;
  }

  function submitBooking(payload: z.infer<typeof slotBookingZodSchema>) {
    mutation.mutate(payload, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        setAttachServices(false);
        setStacked([]);
        setDurationMin(60);
      },
    });
  }

  // Run the conflict check over the FULL candidate span, then gate the save:
  //   overlap   → blocked with a toast (never reaches the warn dialog),
  //   too-close → stage the payload and open the soft-warn dialog,
  //   ok        → submit straight through.
  // Mirrors enquiry-detail-drawer.tsx's attemptSave.
  function onSubmit(values: z.infer<typeof slotBookingZodSchema>) {
    const conflict = checkConflict(
      {
        doctorId: values.doctorId ?? "",
        date: values.slot?.date ?? "",
        startTime: values.slot?.time ?? "",
        durationMin,
      },
      appointments,
      gapMinutes,
    );

    if (conflict.status === "overlap") {
      toast.error(
        `${durationMin} min from ${values.slot?.time} runs into ${conflict.with?.name}'s ${conflict.with?.time} visit — shorten it or pick another start.`,
      );
      return;
    }

    const payload = buildPayload(values);
    if (conflict.status === "too-close") {
      setPendingTooClose({ payload, conflict });
      return;
    }
    submitBooking(payload);
  }

  function handleDialogChange(open: boolean) {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
      setAttachServices(false);
      setStacked([]);
      setDurationMin(60);
      setPendingTooClose(null);
    }
  }

  return (
    <>
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="flex justify-center items-center gap-1">
          <CirclePlus className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Book Appointment
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Book an Appointment</DialogTitle>
          <p className="text-sm text-muted-foreground">Pick a date, then a therapist — the list shows who&apos;s free that day.</p>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mt-5"
          >
            <div className="w-full space-y-5">
              <FormField
                control={form.control}
                name="typeOfappointment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of appointment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Appointment Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* date first — drives the therapist load */}
              <FormField
                control={form.control}
                name="slot.date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Select Date</FormLabel>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn("w-full sm:w-[240px] justify-start text-left font-normal")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                            setIsCalendarOpen(false);
                          }}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Therapist & time — the shared availability grid (rows =
                  therapists, columns = slots; includes the duration control and
                  specialization search). Locked until payment is marked, so a
                  therapist is never picked before the money is clear. */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Therapist &amp; time</label>
                {form.watch("paymentReceived") ? (
                  <TherapistAvailabilityGrid
                    date={selectedDate}
                    selectedDoctorId={doctorId}
                    selectedStart={form.watch("slot.time")}
                    durationMin={durationMin}
                    onDurationChange={setDurationMin}
                    onPick={({ doctorId, doctor, startTime }) => {
                      form.setValue("doctor", doctor);
                      form.setValue("doctorId", doctorId);
                      form.setValue("slot.time", startTime, {
                        shouldValidate: true,
                      });
                    }}
                  />
                ) : (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    Mark the payment received (right) to choose a therapist and slot.
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Note..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-full space-y-4">
              <CustomerSearchField
                value={{
                  customer_name: form.watch("name") ?? "",
                  customer_phone: form.watch("phonenumber"),
                  email: form.watch("email") ?? "",
                  address: form.watch("location") ?? "",
                }}
                onChange={(sel) => {
                  form.setValue("name", sel.customer_name, {
                    shouldValidate: true,
                  });
                  form.setValue("customer_id", sel.customer_id ?? "");
                  // Only prefill the rest when an existing customer is picked,
                  // so typing a brand-new name never wipes entered details.
                  if (sel.customer_id) {
                    form.setValue("location", sel.address ?? "");
                    form.setValue("email", sel.email ?? "");
                    if (typeof sel.customer_phone === "number") {
                      form.setValue("phonenumber", sel.customer_phone, {
                        shouldValidate: true,
                      });
                    }
                  }
                }}
              />

              {/* Read-only IDs — auto-filled, not editable */}
              <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Therapist ID</span>
                  <span className="font-mono">{doctorId || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer ID</span>
                  <span className="font-mono">{customerId || "— (new customer)"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking ID</span>
                  <span className="font-mono text-muted-foreground">assigned on save</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer location</FormLabel>
                    <FormControl><Input placeholder="Customer's location" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sessionNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of sessions</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 6"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const n =
                            e.target.value === ""
                              ? undefined
                              : e.target.valueAsNumber;
                          field.onChange(n);
                          recomputePrice(n);
                        }}
                      />
                    </FormControl>
                    {noTier && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        No rate tier covers {sessions} sessions — set one in Services → Session rates, or enter the price manually.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quotedPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session price (₹) — auto from the rate table</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Auto-filled from sessions × tier rate"
                        {...field}
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

              {/* Payment — the gate for the therapist grid (same rule as the
                  Enquiry funnel; the server backs it via createBooking). */}
              <div className="rounded-md border p-3 space-y-3">
                <p className="text-sm font-medium">Payment</p>
                <p className="text-xs text-muted-foreground">
                  Payment must be clear before a therapist is assigned.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Amount (₹)</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={form.watch("paymentAmount") ?? grandTotal ?? ""}
                      onChange={(e) =>
                        form.setValue(
                          "paymentAmount",
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Method</label>
                    <Select
                      value={form.watch("paymentMethod") ?? ""}
                      onValueChange={(v) =>
                        form.setValue(
                          "paymentMethod",
                          v as z.infer<typeof slotBookingZodSchema>["paymentMethod"],
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.watch("paymentReceived") ?? false}
                    onChange={(e) => {
                      const on = e.target.checked;
                      form.setValue("paymentReceived", on);
                      form.setValue(
                        "paymentReceivedAt",
                        on ? new Date().toISOString() : undefined,
                      );
                      if (on && form.watch("paymentAmount") == null) {
                        form.setValue("paymentAmount", grandTotal);
                      }
                    }}
                  />
                  Payment received
                </label>
              </div>

              {/* Session-only by default; attach + stack services on top */}
              <div className="rounded-md border p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachServices}
                    onChange={(e) => toggleAttach(e.target.checked)}
                  />
                  Add service(s) to this booking
                </label>

                {attachServices && (
                  <div className="space-y-2">
                    {stacked.map((row, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Select
                          value={row.serviceId}
                          onValueChange={(v) => patchStacked(i, { serviceId: v })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pick a service" />
                          </SelectTrigger>
                          <SelectContent>
                            {servicesLoading ? (
                              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading…
                              </div>
                            ) : (
                              services.map((s) => (
                                <SelectItem key={s.serviceId} value={s.serviceId}>
                                  {s.name} — ₹{addonPrice(s, row.discount)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={row.discount}
                            onChange={(e) =>
                              patchStacked(i, { discount: e.target.checked })
                            }
                          />
                          disc
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStacked(i)}
                          aria-label={`Remove service ${i + 1}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addStacked}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add service
                    </Button>
                  </div>
                )}
              </div>

              {/* Live price breakdown when services are stacked on the session */}
              {attachServices && stackedPriced.some((r) => r.svc) && (
                <div className="rounded-md border p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Session ×{sessions ?? 0}</span>
                    <span className="tabular-nums">{formatINR(quotedPrice ?? 0)}</span>
                  </div>
                  {stackedPriced
                    .filter((r) => r.svc)
                    .map((r, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-muted-foreground"
                      >
                        <span>
                          {r.svc?.name}
                          {r.discount ? " (disc)" : ""}
                        </span>
                        <span className="tabular-nums">+ {formatINR(r.price)}</span>
                      </div>
                    ))}
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total</span>
                    <span className="tabular-nums">{formatINR(grandTotal)}</span>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Age"
                        {...field}
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
                name="phonenumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <PhoneInput {...field} placeholder="10-digit mobile number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Booking...
                  </span>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Soft-warn when the start is within the booking gap of another visit.
        Overlap never reaches here — it's blocked with a toast in onSubmit.
        Rendered as a sibling of Dialog (not nested in DialogContent) so it
        isn't caught in the Dialog overlay's pointer-events trap — same
        pattern as enquiry-detail-drawer.tsx. */}
    <AlertDialog
      open={pendingTooClose !== null}
      onOpenChange={(o) => {
        if (!o) setPendingTooClose(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Within the booking gap</AlertDialogTitle>
          <AlertDialogDescription>
            This start is within {gapMinutes} min of{" "}
            {pendingTooClose?.conflict.with?.name}&apos;s{" "}
            {pendingTooClose?.conflict.with?.time} visit. Book anyway?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingTooClose(null)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              const p = pendingTooClose;
              setPendingTooClose(null);
              if (p) submitBooking(p.payload);
            }}
          >
            Book anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
