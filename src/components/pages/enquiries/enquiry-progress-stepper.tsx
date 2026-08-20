"use client";

import { CheckCircle2, Circle, CircleDot, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnquiryType } from "@/type/schema";

type Step = {
  key: string;
  label: string;
  /** DOM id of the drawer section this step maps to (for click-to-scroll). */
  section: string;
  done: (r: EnquiryType) => boolean;
};

// Mirrors the client-approved funnel: reach out → confirm the booking →
// payment clears → assign a therapist. The enquiry's job ends there; what
// happens on the visit is Appointments work.
const STEPS: Step[] = [
  {
    key: "reached",
    label: "Reached",
    section: "enq-sec-reach",
    done: (r) => !!r.executiveReachedOut,
  },
  {
    key: "booked",
    label: "Booked",
    section: "enq-sec-booking",
    done: (r) => !!r.typeOfappointment,
  },
  {
    key: "paid",
    label: "Paid",
    section: "enq-sec-payment",
    done: (r) => !!r.paymentReceived,
  },
  {
    key: "assigned",
    label: "Assigned",
    section: "enq-sec-therapist",
    done: (r) => !!r.doctorId && !!r.slot?.time,
  },
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function EnquiryProgressStepper({ record }: { record: EnquiryType }) {
  const cancelled = record.status === "cancelled";
  const steps = STEPS;

  const rawDone = steps.map((s) => s.done(record));

  // In a sequential funnel, step i is completed only if it is satisfied AND all preceding steps are also completed.
  const doneFlags: boolean[] = [];
  let chainBroken = false;
  for (let i = 0; i < steps.length; i++) {
    if (!chainBroken && rawDone[i]) {
      doneFlags[i] = true;
    } else {
      doneFlags[i] = false;
      chainBroken = true;
    }
  }

  // Active current step is the first step in the sequence that is not yet completed
  const firstUnfinished = doneFlags.findIndex((d) => !d);
  const currentIndex = cancelled ? -1 : firstUnfinished === -1 ? steps.length : firstUnfinished;

  // Cancellation context, pulled from the activity log + reason note.
  const cancelEntry = record.activityLog
    ?.filter((e) => e.action.toLowerCase().includes("cancel"))
    .at(-1);
  const cancelWhen = cancelEntry?.at
    ? new Date(cancelEntry.at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-2">
      <div className={cn("flex items-start", cancelled && "opacity-40")}>
        {steps.map((step, i) => {
          const isDone = doneFlags[i];
          const isCurrent = !cancelled && i === currentIndex;
          return (
            <div key={step.key} className="flex items-start flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => scrollToSection(step.section)}
                className="flex flex-col items-center gap-1 w-16 shrink-0 cursor-pointer group"
                title={`Go to ${step.label}`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : isCurrent ? (
                  <CircleDot className="h-5 w-5 text-blue-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/50" />
                )}
                <span
                  className={cn(
                    "text-[10px] leading-tight text-center group-hover:text-foreground transition-colors",
                    isDone
                      ? "text-muted-foreground font-medium"
                      : isCurrent
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground/60",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mt-2.5",
                    isDone && doneFlags[i + 1] ? "bg-emerald-600" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {cancelled && (
        <div className="flex items-center gap-2 text-xs rounded-md px-2.5 py-1.5 text-red-700 bg-red-500/10 border border-red-500/30 dark:text-red-400">
          <Ban className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">Cancelled</span>
          {cancelWhen && <span className="opacity-80">· {cancelWhen}</span>}
          {record.statusNote && (
            <span className="truncate opacity-80">· {record.statusNote}</span>
          )}
        </div>
      )}
    </div>
  );
}
