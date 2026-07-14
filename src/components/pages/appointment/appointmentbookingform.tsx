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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { slotBookingZodSchema, TherapistformType } from "@/type/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBookAppointment, useGetAllAppointments } from "@/data/appointment/appointment";
import { useGetAllTherapist } from "@/data/therapist/therapist";
import { useGetServices } from "@/data/service/service";
import { CustomerSearchField } from "@/components/pages/invoices/customer-search-field";
import { sessionRate, sessionTotal, addonPrice } from "@/lib/service-pricing";
import { useGetSessionRates } from "@/data/session-rate/session-rate";
import { useAuthStore } from "@/providers/permission-provider";
import { formatINR } from "@/components/pages/services/services-columns";

type GenderType = "All" | "Male" | "Female";
type StackedService = { serviceId: string; discount: boolean };

export default function AppointmentBookingForm() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState<GenderType>("All");
  // Session-only by default; flip on to attach (stack) services.
  const [attachServices, setAttachServices] = useState(false);
  const [stacked, setStacked] = useState<StackedService[]>([]);

  const mutation = useBookAppointment();
  const { data: doctorsData, isLoading, isError, refetch } = useGetAllTherapist();
  const { data: services = [], isLoading: servicesLoading } = useGetServices();
  const { data: rateCard } = useGetSessionRates();

  // Appointments (reused from the list) power the per-therapist day load.
  const authUser = useAuthStore((s) => s.user);
  const { data: appointments = [] } = useGetAllAppointments({
    id: authUser?.id,
    role: authUser?.role,
    userEmail: authUser?.userEmail,
  });

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

  // Therapist load: active (non-cancelled) bookings per therapist on the picked date.
  const bookingsByDoctor = useMemo(() => {
    const map = new Map<string, number>();
    if (!selectedDate) return map;
    for (const a of appointments) {
      if (a.status === "cancelled" || !a.doctorId) continue;
      if (a.slot?.date !== selectedDate) continue;
      map.set(a.doctorId, (map.get(a.doctorId) ?? 0) + 1);
    }
    return map;
  }, [appointments, selectedDate]);

  // Filter by gender, annotate with day load, sort most-available first.
  const doctorsSorted = useMemo(() => {
    const base = ((doctorsData ?? []) as TherapistformType[]).filter(
      (d) =>
        selectedGender === "All" ||
        d.gender?.toLowerCase() === selectedGender.toLowerCase(),
    );
    return base
      .map((doctor) => ({
        doctor,
        count: bookingsByDoctor.get(doctor.doctorId ?? "") ?? 0,
      }))
      .sort((a, b) => a.count - b.count);
  }, [doctorsData, selectedGender, bookingsByDoctor]);

  // Priced stacked services + running totals for the breakdown.
  const stackedPriced = stacked.map((row) => {
    const svc = services.find((s) => s.serviceId === row.serviceId);
    return { ...row, svc, price: svc ? addonPrice(svc, row.discount) : 0 };
  });
  const servicesTotal = stackedPriced.reduce((sum, r) => sum + r.price, 0);
  const grandTotal = (quotedPrice ?? 0) + servicesTotal;

  function handleGenderChange(gender: GenderType) {
    setSelectedGender(gender);
    form.setValue("doctor", "");
    form.setValue("doctorId", "");
  }

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

  function onSubmit(values: z.infer<typeof slotBookingZodSchema>) {
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
    mutation.mutate(payload, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        setSelectedGender("All");
        setAttachServices(false);
        setStacked([]);
      },
    });
  }

  function handleDialogChange(open: boolean) {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
      setSelectedGender("All");
      setAttachServices(false);
      setStacked([]);
    }
  }

  return (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* gender filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Therapist Gender</label>
                  <Select
                    value={selectedGender}
                    onValueChange={(v: GenderType) => handleGenderChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Genders</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
              </div>

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

              {/* therapist — shows each one's load on the picked date, freest first */}
              <FormField
                control={form.control}
                name="doctor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Therapist</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(selectedName) => {
                        const selected = doctorsSorted.find(
                          ({ doctor }) => doctor.name === selectedName,
                        )?.doctor;
                        form.setValue("doctor", selected?.name ?? "");
                        form.setValue("doctorId", selected?.doctorId ?? "");
                        field.onChange(selected?.name ?? "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Therapist" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoading ? (
                          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading therapists...
                          </div>
                        ) : isError ? (
                          <div className="flex flex-col gap-2 p-3">
                            <p className="text-sm text-destructive">Failed to load therapists</p>
                            <button
                              type="button"
                              onClick={() => refetch()}
                              className="text-xs text-muted-foreground underline text-left"
                            >
                              Try again
                            </button>
                          </div>
                        ) : doctorsSorted.length > 0 ? (
                          doctorsSorted.map(({ doctor, count }) => (
                            <SelectItem key={doctor.doctorId} value={doctor.name}>
                              {doctor.name}
                              {selectedDate ? (
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {count} booked
                                </span>
                              ) : null}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-muted-foreground">
                            No therapists found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* time */}
              <FormField
                control={form.control}
                name="slot.time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["9:30", "10:30", "11:30", "12:30", "13:30", "14:30",
                          "15:30", "16:30", "17:30", "18:30", "19:30", "20:30"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <Input
                        type="tel"
                        inputMode="numeric"
                        placeholder="10-digit mobile number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^\d]/g, "");
                          field.onChange(
                            digits === "" ? undefined : Number(digits),
                          );
                        }}
                      />
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
  );
}
