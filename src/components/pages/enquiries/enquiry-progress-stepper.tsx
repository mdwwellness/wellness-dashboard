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

const STEPS: Step[] = [
  {
    key: "reached",
    label: "Reached",
    section: "enq-sec-reach",
    done: (r) => !!r.executiveReachedOut,
  },
  {
    key: "consulted",
    label: "Consulted",
    section: "enq-sec-consult",
    done: (r) => !!r.consultationCompleted,
  },
  {
    key: "physio",
    label: "Physio set",
    section: "enq-sec-physio",
    done: (r) => !!r.physioAssignmentConfirmed,
  },
  {
    key: "paid",
    label: "Paid",
    section: "enq-sec-payment",
    done: (r) => !!r.paymentReceived,
  },
  {
    key: "completed",
    label: "Completed",
    section: "enq-sec-completion",
    done: (r) => r.status === "completed",
  },
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function EnquiryProgressStepper({ record }: { record: EnquiryType }) {
  const cancelled = record.status === "cancelled";

  const doneFlags = STEPS.map((s) => s.done(record));
  // Fill the bar up to the furthest completed step (monotonic, like the funnel).
  let lastDone = -1;
  doneFlags.forEach((d, i) => {
    if (d) lastDone = i;
  });
  const currentIndex = lastDone + 1; // the step in progress (or === length when complete)

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
        {STEPS.map((step, i) => {
          const isDone = i <= lastDone;
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
                      ? "text-muted-foreground"
                      : isCurrent
                        ? "text-foreground font-medium"
                        : "text-muted-foreground/60",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mt-2.5",
                    isDone ? "bg-emerald-600" : "bg-border",
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
