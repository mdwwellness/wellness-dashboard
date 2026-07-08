"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarPlus, Check, Loader2, Plus, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import {
  useAddAppointmentRecommendation,
  useConfirmAppointmentRecommendation,
  useSetAddonPaymentStatus,
  useUpdateAppointment,
} from "@/data/appointment/appointment";
import type { slotBookingZodType, ServiceType } from "@/type/schema";
import {
  getPackageProgressForAppointment,
  visitStatusLabel,
  type PackageProgress,
} from "@/lib/package-progress";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function PaymentBadge({
  paid,
  label,
}: {
  paid: boolean;
  label: string;
}) {
  return (
    <Badge
      variant={paid ? "default" : "outline"}
      className={
        paid
          ? "bg-emerald-600 text-white"
          : "border-amber-500 text-amber-700 dark:text-amber-400"
      }
    >
      {label}: {paid ? "Received" : "Pending"}
    </Badge>
  );
}

export function PackageVisitSection({
  appointment,
  progress,
}: {
  appointment: slotBookingZodType;
  services: ServiceType[];
  progress: PackageProgress;
}) {
  const { mutate: update, isPending } = useUpdateAppointment({ silent: true });
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("");

  const pct =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;
  const needsNextSlot =
    progress.completed > 0 &&
    progress.completed < progress.total &&
    appointment.status === "scheduled";

  // Map session number → date it was completed, parsed from the activity log
  // (the backend logs "Session N of M completed" / "Package complete" on each
  // completion). Used to show a per-session performed/pending breakdown.
  const sessionDates = useMemo(() => {
    const map = new Map<number, string>();
    for (const e of appointment.activityLog ?? []) {
      const action = e.action ?? "";
      const m = /Session (\d+) of/.exec(action);
      if (m) map.set(Number(m[1]), e.at);
      else if (/Package complete/i.test(action)) map.set(progress.total, e.at);
    }
    return map;
  }, [appointment.activityLog, progress.total]);

  function saveNextSlot() {
    if (!nextDate || !nextTime) {
      toast.error("Pick date and time for the next session");
      return;
    }
    update({
      ...appointment,
      slot: { date: nextDate, time: nextTime },
      status: "scheduled",
    });
    setNextDate("");
    setNextTime("");
    toast.success(`Session ${progress.currentSession} scheduled`);
  }

  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
            Package visit
          </p>
          <p className="text-sm font-semibold">{progress.packageName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Session {progress.currentSession} of {progress.total} ·{" "}
            {visitStatusLabel(appointment.status)}
          </p>
        </div>
        <Badge variant="outline" className="border-emerald-600 text-emerald-700 shrink-0">
          {progress.label}
        </Badge>
      </div>

      <div className="h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-900 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Per-session breakdown — what's performed vs what's left, in points. */}
      <div className="space-y-1 rounded-md border bg-background/60 p-2.5">
        <p className="text-xs font-medium">
          Sessions ({progress.completed} performed ·{" "}
          {Math.max(progress.total - progress.completed, 0)} left)
        </p>
        <ul className="space-y-1">
          {Array.from({ length: progress.total }, (_, i) => {
            const n = i + 1;
            const performed = n <= progress.completed;
            const date = sessionDates.get(n);
            return (
              <li key={n} className="flex items-center gap-2 text-xs">
                {performed ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <span className="h-3 w-3 rounded-full border border-muted-foreground/40 shrink-0" />
                )}
                <span className={performed ? "" : "text-muted-foreground"}>
                  Session {n} — {performed ? "performed" : "pending"}
                  {performed && date
                    ? ` · ${format(new Date(date), "yyyy-MM-dd")}`
                    : ""}
                </span>
              </li>
            );
          })}
        </ul>

        {(appointment.recommendedServices ?? []).length > 0 && (
          <>
            <p className="text-xs font-medium pt-1.5 mt-1.5 border-t">
              Add-on services
            </p>
            <ul className="space-y-1">
              {(appointment.recommendedServices ?? []).map((a, i) => {
                const confirmed = a.status === "confirmed";
                return (
                  <li
                    key={`${a.serviceId}-${a.recommendedAt}-${i}`}
                    className="flex items-center gap-2 text-xs"
                  >
                    {confirmed ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="h-3 w-3 rounded-full border border-muted-foreground/40 shrink-0" />
                    )}
                    <span className={confirmed ? "" : "text-muted-foreground"}>
                      {a.serviceName} —{" "}
                      {confirmed ? "confirmed" : "awaiting customer"}
                      {a.paymentCollected ? " · paid" : ""} ·{" "}
                      {formatINR(a.quotedPrice)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {appointment.slot?.date && (
        <p className="text-xs text-muted-foreground">
          Visit: {appointment.slot.date}
          {appointment.slot.time ? ` at ${appointment.slot.time}` : ""}
        </p>
      )}

      <PaymentBadge
        paid={!!appointment.paymentReceived}
        label="Package payment"
      />

      {needsNextSlot && (
        <div className="rounded-md border bg-background p-3 space-y-2">
          <p className="text-xs font-medium flex items-center gap-1">
            <CalendarPlus className="h-3.5 w-3.5" />
            Schedule session {progress.currentSession} (same row)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              aria-label="Next session date"
            />
            <Input
              type="time"
              value={nextTime}
              onChange={(e) => setNextTime(e.target.value)}
              aria-label="Next session time"
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={saveNextSlot}
          >
            Update visit date
          </Button>
        </div>
      )}
    </section>
  );
}

export function AddonsVisitSection({
  appointment,
}: {
  appointment: slotBookingZodType;
}) {
  const { data: services = [] } = useGetServices();
  const { mutate: addRecommendation, isPending } = useAddAppointmentRecommendation();
  const { mutate: confirmRecommendation, isPending: isConfirming } =
    useConfirmAppointmentRecommendation();
  const { mutate: setAddonPayment, isPending: isTogglingPayment } =
    useSetAddonPaymentStatus();

  const stacked = appointment.recommendedServices ?? [];
  const [showAddForm, setShowAddForm] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [amount, setAmount] = useState("");

  const selected = services.find((s) => s.serviceId === serviceId);

  function handleSelect(id: string) {
    setServiceId(id);
    const svc = services.find((s) => s.serviceId === id);
    setAmount(String(svc?.recommendedPrice ?? svc?.price ?? 0));
  }

  function handleAdd() {
    if (!appointment._id || !selected) return;
    const quotedPrice = Number(amount);
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
        },
      },
      {
        onSuccess: () => {
          setServiceId("");
          setAmount("");
          setShowAddForm(false);
        },
      },
    );
  }

  function handleConfirm(recServiceId: string, recommendedAt: string) {
    if (!appointment._id) return;
    confirmRecommendation({
      appointmentId: appointment._id,
      serviceId: recServiceId,
      recommendedAt,
    });
  }

  function toggleAddonPayment(
    recServiceId: string,
    recommendedAt: string,
    collected: boolean,
  ) {
    if (!appointment._id) return;
    setAddonPayment({
      appointmentId: appointment._id,
      serviceId: recServiceId,
      recommendedAt,
      collected,
    });
  }

  if (stacked.length === 0 && !showAddForm) {
    return (
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Recommend a service
        </Button>
      </div>
    );
  }

  return (
    <section className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Stethoscope className="h-4 w-4" />
          Recommended add-ons
        </h3>
        {!showAddForm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>

      {stacked.length > 0 && (
        <ul className="space-y-2">
          {stacked.map((rec, i) => {
            const isConfirmed = rec.status === "confirmed";
            return (
              <li
                key={`${rec.serviceId}-${rec.recommendedAt}-${i}`}
                className="rounded-md border bg-background p-3 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-sm">{rec.serviceName}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {formatINR(rec.quotedPrice)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant={isConfirmed ? "default" : "outline"}
                    className="text-[10px]"
                  >
                    {isConfirmed ? "Customer confirmed" : "Awaiting customer"}
                  </Badge>
                  {isConfirmed && (
                    <PaymentBadge
                      paid={!!rec.paymentCollected}
                      label="Add-on payment"
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
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
                  {isConfirmed && (
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rec.paymentCollected ?? false}
                        disabled={isTogglingPayment}
                        onChange={(e) =>
                          toggleAddonPayment(
                            rec.serviceId,
                            rec.recommendedAt,
                            e.target.checked,
                          )
                        }
                      />
                      Payment collected for this add-on
                    </label>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showAddForm && (
        <div className="space-y-2 border-t pt-3">
          <Select value={serviceId} onValueChange={handleSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pick a service" />
            </SelectTrigger>
            <SelectContent>
              {services
                .filter((s) => !s.isPackage)
                .map((s) => (
                  <SelectItem key={s.serviceId} value={s.serviceId}>
                    {s.name} — ₹{s.recommendedPrice ?? s.price}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount ₹"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={isPending || !serviceId}
            >
              Add to this visit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

export function VisitSections({
  appointment,
  allAppointments,
  services,
}: {
  appointment: slotBookingZodType;
  allAppointments: slotBookingZodType[];
  services: ServiceType[];
}) {
  const progress = getPackageProgressForAppointment(
    appointment,
    allAppointments,
    services,
  );

  return (
    <div className="space-y-4">
      {progress && (
        <PackageVisitSection
          appointment={appointment}
          services={services}
          progress={progress}
        />
      )}
      <AddonsVisitSection appointment={appointment} />
    </div>
  );
}
