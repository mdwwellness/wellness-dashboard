"use client";

import { useState } from "react";
import { Check, Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetServices } from "@/data/service/service";
import {
  useAddAppointmentRecommendation,
  useConfirmAppointmentRecommendation,
} from "@/data/appointment/appointment";
import type { slotBookingZodType } from "@/type/schema";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

/**
 * Therapist "Recommend a service" — stacks an add-on on the current visit.
 * Staff confirms once the customer agrees (MVP; WhatsApp consent comes later).
 */
export function RecommendService({
  appointment,
}: {
  appointment: slotBookingZodType;
  onDone?: () => void;
}) {
  const { data: services = [] } = useGetServices();
  const { mutate: addRecommendation, isPending } = useAddAppointmentRecommendation();
  const { mutate: confirmRecommendation, isPending: isConfirming } =
    useConfirmAppointmentRecommendation();

  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [amount, setAmount] = useState("");

  const selected = services.find((s) => s.serviceId === serviceId);
  const stacked = appointment.recommendedServices ?? [];

  function handleSelect(id: string) {
    setServiceId(id);
    const svc = services.find((s) => s.serviceId === id);
    const rec = svc?.recommendedPrice ?? svc?.price ?? 0;
    setAmount(String(rec));
  }

  function handleBook() {
    if (!appointment._id) {
      toast.error("Appointment ID missing");
      return;
    }
    if (!selected) {
      toast.error("Pick a service to recommend");
      return;
    }
    const quotedPrice = amount === "" ? 0 : Number(amount);
    if (!Number.isFinite(quotedPrice) || quotedPrice < 0) {
      toast.error("Enter a valid amount");
      return;
    }

    addRecommendation(
      {
        appointmentId: appointment._id,
        values: {
          serviceId: selected.serviceId,
          serviceName: selected.name,
          category: selected.category,
          quotedPrice,
          slot: date ? { date, time } : undefined,
        },
      },
      {
        onSuccess: () => {
          setServiceId("");
          setDate("");
          setTime("");
          setAmount("");
        },
      },
    );
  }

  function handleConfirm(serviceId: string, recommendedAt: string) {
    if (!appointment._id) return;
    confirmRecommendation({
      appointmentId: appointment._id,
      serviceId,
      recommendedAt,
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
          Stacks on this visit — confirm once the customer agrees. Only
          confirmed add-ons are billed on the invoice.
        </p>
      </div>

      {stacked.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Add-ons on this visit ({stacked.length})
          </p>
          <ul className="space-y-2">
            {stacked.map((rec, i) => {
              const isConfirmed = rec.status === "confirmed";
              return (
                <li
                  key={`${rec.serviceId}-${rec.recommendedAt}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm border rounded-md p-2 bg-background"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium">{rec.serviceName}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant={isConfirmed ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {isConfirmed ? "Confirmed" : "Pending customer"}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {formatINR(rec.quotedPrice)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.slot?.date && (
                      <span className="text-xs text-muted-foreground">
                        {rec.slot.date}
                        {rec.slot.time ? ` ${rec.slot.time}` : ""}
                      </span>
                    )}
                    {rec.status === "pending" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isConfirming}
                        onClick={() =>
                          handleConfirm(rec.serviceId, rec.recommendedAt)
                        }
                      >
                        {isConfirming ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Customer confirmed
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
            Adding…
          </>
        ) : (
          "Add to this visit"
        )}
      </Button>
    </div>
  );
}
