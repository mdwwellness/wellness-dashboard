"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  CalendarDays,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { EnquiryIntakeModal } from "@/components/pages/enquiries/enquiry-intake-modal";
import type { Customer } from "@/data/customer/customer";
import type { EnquiryType } from "@/type/schema";
import { AppointmentStatusBadge } from "@/components/status-badge";

interface CustomerDetailDrawerProps {
  customer: Customer | null;
  onClose: () => void;
}

const SEGMENT_LABEL: Record<string, string> = {
  new: "New customer",
  returning: "Returning customer",
  vip: "VIP",
};

const SEGMENT_CLASS: Record<string, string> = {
  new: "border-blue-600 text-blue-700 bg-blue-50",
  returning: "border-emerald-600 text-emerald-700 bg-emerald-50",
  vip: "border-amber-600 text-amber-800 bg-amber-100",
};

function formatTimeRange(r: { from?: string; to?: string } | undefined) {
  if (!r?.from || !r?.to) return null;
  const toAmPm = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h)) return hhmm;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  };
  return `${toAmPm(r.from)} – ${toAmPm(r.to)}`;
}

function BookingRow({ booking, index }: { booking: EnquiryType; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const status = booking.status ?? "enquiry";
  const createdAt = (booking as unknown as { createdAt?: string }).createdAt;

  const serviceFromNote = (() => {
    const note = booking.note ?? "";
    const m = note.match(/^\[Service:\s*([^\]]+)\]/);
    return m ? m[1].trim() : null;
  })();

  const preferred = formatTimeRange(booking.preferredReachOutTime);

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Summary row — always visible, click to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">
              {booking.enquiryId ?? `#${index + 1}`}
            </span>
            <AppointmentStatusBadge status={status} />
            {serviceFromNote && (
              <span className="text-xs text-muted-foreground">
                {serviceFromNote}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {createdAt
              ? `Booked ${formatDistanceToNow(new Date(createdAt), { addSuffix: true })}`
              : "—"}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t p-3 space-y-2 text-sm bg-muted/30">
          <DetailRow label="Service" value={serviceFromNote ?? booking.typeOfappointment ?? "—"} />
          <DetailRow label="Preferred time" value={preferred ?? "—"} />
          <DetailRow
            label="Consultation slot"
            value={
              booking.consultationSlot?.date
                ? `${booking.consultationSlot.date} ${booking.consultationSlot.time}`
                : "—"
            }
          />
          <DetailRow
            label="Consultation done"
            value={booking.consultationCompleted ? "Yes" : "—"}
          />
          <DetailRow
            label="Physio slot"
            value={
              booking.physioSlot?.date
                ? `${booking.physioSlot.date} ${booking.physioSlot.time}`
                : "—"
            }
          />
          <DetailRow label="Therapist" value={booking.doctor ?? "—"} />
          <DetailRow
            label="Assignment confirmed"
            value={booking.physioAssignmentConfirmed ? "Yes" : "—"}
          />
          <DetailRow
            label="Handled by"
            value={booking.reachedOutBy?.name ?? "—"}
          />
          {booking.note && (
            <div className="pt-1">
              <div className="text-xs text-muted-foreground">Notes</div>
              <p className="text-sm whitespace-pre-wrap mt-1">{booking.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export function CustomerDetailDrawer({
  customer,
  onClose,
}: CustomerDetailDrawerProps) {
  const open = customer !== null;
  if (!customer) {
    return (
      <Sheet open={false} onOpenChange={() => onClose()}>
        <SheetContent />
      </Sheet>
    );
  }

  const firstSeen = customer.firstBookingAt
    ? format(new Date(customer.firstBookingAt), "PP")
    : "—";

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            {customer.name}
            <Badge
              variant="outline"
              className={SEGMENT_CLASS[customer.segment]}
            >
              {SEGMENT_LABEL[customer.segment]}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            {customer.customer_id ? (
              <>
                Customer ID{" "}
                <span className="font-mono font-medium text-foreground">
                  {customer.customer_id}
                </span>
              </>
            ) : (
              "Full booking history for this customer."
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 space-y-6">
          {/* Contact card */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{customer.phonenumber}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{customer.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>Customer since {firstSeen}</span>
            </div>
          </section>

          <Separator />

          {/* Mini stats */}
          <section className="grid grid-cols-3 gap-2 text-center">
            <div className="border rounded-md p-3">
              <div className="text-2xl font-bold tabular-nums">
                {customer.totalBookings}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Active bookings
              </div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-2xl font-bold tabular-nums">
                {customer.bookings.filter((b) => b.status === "completed").length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Completed</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-2xl font-bold tabular-nums">
                {customer.bookings.filter((b) => b.status === "cancelled").length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Cancelled</div>
            </div>
          </section>

          <Separator />

          {/* Bookings list */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">
              Bookings ({customer.bookings.length})
            </h3>
            {customer.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="space-y-2">
                {customer.bookings.map((b, i) => (
                  <BookingRow key={b._id ?? i} booking={b} index={i} />
                ))}
              </div>
            )}
          </section>

          {/* Footer */}
          <Separator />
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <EnquiryIntakeModal
              prefill={{
                name: customer.name,
                phonenumber: customer.phonenumber,
                note: `[Returning customer] Follow-up booking`,
              }}
              triggerLabel="Book new session"
              triggerVariant="default"
              className="w-full sm:w-auto"
            />
            <SheetClose asChild>
              <Button variant="outline" className="w-full sm:w-auto sm:ml-auto">
                Close
              </Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
