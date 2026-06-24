"use client";

import { useState } from "react";
import { Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetServices } from "@/data/service/service";
import { useBookAppointment } from "@/data/appointment/appointment";
import type { slotBookingZodType } from "@/type/schema";

/**
 * Therapist "Recommend a service" — books a NEW appointment of kind
 * "recommended" for the same patient/therapist at the service's recommended
 * (discounted) price. Booked on the spot once the customer agrees.
 */
export function RecommendService({
  appointment,
  onDone,
}: {
  appointment: slotBookingZodType;
  onDone: () => void;
}) {
  const { data: services = [] } = useGetServices();
  const { mutate: book, isPending } = useBookAppointment();

  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [amount, setAmount] = useState("");

  const selected = services.find((s) => s.serviceId === serviceId);

  function handleSelect(id: string) {
    setServiceId(id);
    const svc = services.find((s) => s.serviceId === id);
    const rec = svc?.recommendedPrice ?? svc?.price ?? 0;
    setAmount(String(rec));
  }

  function handleBook() {
    if (!selected) {
      toast.error("Pick a service to recommend");
      return;
    }
    const payload: slotBookingZodType = {
      name: appointment.name,
      phonenumber: appointment.phonenumber,
      email: appointment.email,
      location: appointment.location,
      doctor: appointment.doctor,
      doctorId: appointment.doctorId,
      category: selected.category,
      service: selected.name,
      appointmentKind: "recommended",
      recommendedFrom: appointment._id,
      quotedPrice: amount === "" ? undefined : Number(amount),
      status: "scheduled",
      slot: date ? { date, time } : undefined,
      note: `Recommended by therapist: ${selected.name} (${selected.serviceId})`,
    };
    book(payload, {
      onSuccess: () => {
        onDone();
      },
    });
  }

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Stethoscope className="h-4 w-4" />
          Recommend a service
        </h3>
        <p className="text-xs text-muted-foreground">
          Suggest an extra service for this patient — booked at the recommended
          price.
        </p>
      </div>

      <Select value={serviceId} onValueChange={handleSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Pick a service" />
        </SelectTrigger>
        <SelectContent>
          {services.map((s) => (
            <SelectItem key={s.serviceId} value={s.serviceId}>
              {s.name} — ₹{s.recommendedPrice ?? s.price}
              {s.recommendedPrice != null ? " (rec)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Recommended appointment date"
        />
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label="Recommended appointment time"
        />
        <Input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount ₹"
          aria-label="Quoted amount"
        />
      </div>

      <Button type="button" onClick={handleBook} disabled={isPending || !serviceId}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Booking…
          </>
        ) : (
          "Book recommendation"
        )}
      </Button>
    </div>
  );
}
