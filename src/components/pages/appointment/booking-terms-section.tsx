"use client";

import { useEffect, useState } from "react";
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
import { useUpdateAppointment } from "@/data/appointment/appointment";
import type { slotBookingZodType } from "@/type/schema";
import { bookingKindOf, bookingLabel } from "@/components/pages/enquiries/booking";

/**
 * The commercial terms of a booking - what was sold, for how much, and whether
 * it has been paid - editable after the fact.
 *
 * Everything else about a booking could be corrected from the drawer except
 * these, so a mistyped session count or a mis-recorded payment had nowhere to be
 * fixed.
 *
 * Saved behind an explicit button rather than on blur: every PUT re-derives the
 * invoice and re-uploads its PDF to UploadThing, so blur-saving these fields
 * would upload a PDF per keystroke. The clinical note auto-saves; this must not.
 */
export function BookingTermsSection({
  appointment,
}: {
  appointment: slotBookingZodType;
}) {
  const { mutate: update, isPending } = useUpdateAppointment();
  const isCourse = bookingKindOf(appointment) === "course";

  const [sessions, setSessions] = useState<number | undefined>(
    appointment.totalSessions,
  );
  const [price, setPrice] = useState<number | undefined>(appointment.quotedPrice);
  const [paid, setPaid] = useState(!!appointment.paymentReceived);
  const [amount, setAmount] = useState<number | undefined>(
    appointment.paymentAmount,
  );
  const [method, setMethod] = useState(appointment.paymentMethod ?? "");

  // Re-seed when the drawer switches to another booking.
  useEffect(() => {
    setSessions(appointment.totalSessions);
    setPrice(appointment.quotedPrice);
    setPaid(!!appointment.paymentReceived);
    setAmount(appointment.paymentAmount);
    setMethod(appointment.paymentMethod ?? "");
  }, [appointment._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const completed = appointment.sessionsCompleted ?? 0;

  function save() {
    if (!(price && price > 0)) {
      toast.error("A booking with no price never generates an invoice");
      return;
    }
    if (isCourse && sessions !== undefined && sessions < completed) {
      toast.error(
        `${completed} session${completed === 1 ? "" : "s"} already completed - the course can't be shorter than that`,
      );
      return;
    }
    update({
      ...appointment,
      ...(isCourse ? { totalSessions: sessions } : {}),
      quotedPrice: price,
      paymentReceived: paid,
      paymentAmount: paid ? (amount ?? price) : undefined,
      paymentMethod: paid
        ? (method as slotBookingZodType["paymentMethod"]) || undefined
        : undefined,
      paymentReceivedAt: paid
        ? (appointment.paymentReceivedAt ?? new Date().toISOString())
        : undefined,
    });
  }

  return (
    <section className="rounded-lg border p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Booking terms</h3>
        <span className="text-xs text-muted-foreground">
          {bookingLabel(appointment)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isCourse && (
          <div>
            <label className="text-xs text-muted-foreground">
              Total sessions
            </label>
            <Input
              type="number"
              min={Math.max(completed, 1)}
              value={sessions ?? ""}
              onChange={(e) =>
                setSessions(
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
            />
          </div>
        )}
        <div>
          <label className="text-xs text-muted-foreground">Price (₹)</label>
          <Input
            type="number"
            min={0}
            value={price ?? ""}
            onChange={(e) =>
              setPrice(e.target.value === "" ? undefined : Number(e.target.value))
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Amount paid (₹)</label>
          <Input
            type="number"
            min={0}
            disabled={!paid}
            placeholder={String(price ?? 0)}
            value={amount ?? ""}
            onChange={(e) =>
              setAmount(e.target.value === "" ? undefined : Number(e.target.value))
            }
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Method</label>
          <Select value={method} onValueChange={setMethod} disabled={!paid}>
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

      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
          />
          Payment received
        </label>
        <Button type="button" size="sm" disabled={isPending} onClick={save}>
          {isPending ? "Saving..." : "Save terms"}
        </Button>
      </div>
    </section>
  );
}
