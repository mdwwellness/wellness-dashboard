"use client";

import { useState } from "react";
import { Check, Loader2, Plus, Stethoscope } from "lucide-react";
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
} from "@/data/appointment/appointment";
import type { slotBookingZodType } from "@/type/schema";
import { addonPrice } from "@/lib/service-pricing";

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
  // Therapist-recommended add-ons are charged the discounted price by default;
  // uncheck to charge the original (e.g. requested after the therapist left).
  const [applyDiscount, setApplyDiscount] = useState(true);

  const selected = services.find((s) => s.serviceId === serviceId);

  function handleSelect(id: string) {
    setServiceId(id);
    const svc = services.find((s) => s.serviceId === id);
    setAmount(String(addonPrice(svc, applyDiscount)));
  }

  function handleToggleDiscount(next: boolean) {
    setApplyDiscount(next);
    setAmount(String(addonPrice(selected, next)));
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
    <section className="rounded-lg border bg-muted/30 p-3 space-y-2.5">
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
              {services.map((s) => (
                <SelectItem key={s.serviceId} value={s.serviceId}>
                  {s.name} - ₹{addonPrice(s, applyDiscount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={applyDiscount}
              onChange={(e) => handleToggleDiscount(e.target.checked)}
            />
            Apply discount (therapist-recommended on the spot)
          </label>
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

