"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

import { useCompleteSession, useUpdateAppointment } from "@/data/appointment/appointment";
import { useGetServices } from "@/data/service/service";
import { useAuthStore } from "@/providers/permission-provider";
import type { ActivityEntry, slotBookingZodType } from "@/type/schema";
import {
  getPackageProgressForAppointment,
  resolvePackageForAppointment,
} from "@/lib/package-progress";
import { tidyActivityText } from "@/lib/utils";

const CHECKLIST = [
  { key: "arrived", label: "Arrived" },
  { key: "performed", label: "Service performed" },
  { key: "completed", label: "This session completed" },
];

/**
 * Visit workflow only — payment status lives on package / add-on sections above.
 */
export function WorkChecklist({
  appointment,
}: {
  appointment: slotBookingZodType;
}) {
  const { user } = useAuthStore();
  const { data: services = [] } = useGetServices();
  const { mutate: update } = useUpdateAppointment({ silent: true });
  const { mutate: markSessionComplete, isPending: isCompleting } = useCompleteSession();
  const [draft, setDraft] = useState<slotBookingZodType>(appointment);

  useEffect(() => {
    setDraft(appointment);
  }, [appointment._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const done = new Set(draft.workChecklist ?? []);
  const actor =
    `${user?.userfName ?? ""} ${user?.userlName ?? ""}`.trim() || "Someone";
  const progress = getPackageProgressForAppointment(
    draft,
    [draft],
    services,
  );
  const hasPackage = !!resolvePackageForAppointment(draft, services);
  // Package is fully delivered — no more sessions may be completed.
  const packageDone =
    hasPackage && !!progress && progress.completed >= progress.total;

  function toggle(key: string, label: string, checked: boolean) {
    // Package session completion goes through the atomic complete-session
    // endpoint (server-side $inc), not a client-computed PUT — this is the
    // only path that can be double-fired by a rapid double-click or two open
    // tabs, so it must not rely on a client-read-then-write value.
    if (key === "completed" && checked && hasPackage && appointment._id) {
      // Ceiling: once all sessions are done, there is nothing left to complete.
      // (The backend also rejects this, but we block it in the UI so the box
      // can't even be ticked.)
      if (packageDone) return;
      markSessionComplete(appointment._id, {
        onSuccess: (result) => {
          if (result.data) setDraft(result.data as slotBookingZodType);
        },
      });
      return;
    }

    const next = new Set(done);
    if (checked) next.add(key);
    else next.delete(key);

    const entry: ActivityEntry = {
      at: new Date().toISOString(),
      userId: user?.id,
      name: actor,
      action: `${checked ? "Checked" : "Unchecked"}: ${label}`,
    };

    const patch: slotBookingZodType = {
      ...draft,
      workChecklist: [...next],
      activityLog: [...(draft.activityLog ?? []), entry],
    };

    if (key === "completed" && checked) {
      // No package on this row — plain completion, no session counter.
      patch.status = "completed";
      patch.completedAt = new Date().toISOString();
    } else if (key === "completed" && !checked) {
      if (hasPackage) {
        const sessionsDone = Math.max((draft.sessionsCompleted ?? 0) - 1, 0);
        patch.sessionsCompleted = sessionsDone;
        patch.sessionNumber = Math.max(sessionsDone + 1, 1);
        patch.status = sessionsDone > 0 ? "scheduled" : "ongoing";
        patch.completedAt = undefined;
      } else {
        patch.status = "ongoing";
        patch.completedAt = undefined;
      }
    } else if (key === "arrived" && checked) {
      patch.status = "ongoing";
    }

    setDraft(patch);
    update(patch);
  }

  const activity = [...(draft.activityLog ?? [])]
    .filter((e) => e.name && e.name !== "System")
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <h3 className="text-sm font-semibold">Visit checklist</h3>
      <p className="text-xs text-muted-foreground">
        Payment is tracked on the package and add-on sections above.
      </p>
      {packageDone && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30 px-3 py-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          Package complete — all {progress?.total} sessions done. No further
          visits to record.
        </div>
      )}
      <div className="space-y-2">
        {CHECKLIST.map((item) => {
          const lockCompleted = item.key === "completed" && packageDone;
          return (
            <label
              key={item.key}
              className={`flex items-center gap-2 text-sm ${
                lockCompleted ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                checked={done.has(item.key)}
                disabled={
                  item.key === "completed" && (isCompleting || packageDone)
                }
                onChange={(e) => toggle(item.key, item.label, e.target.checked)}
              />
              {item.label}
            </label>
          );
        })}
      </div>

      {activity.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-muted-foreground">
            Activity
          </h4>
          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
            {activity.map((e, i) => (
              <div key={i} className="border-l-2 border-muted pl-3 text-xs">
                <span className="text-muted-foreground">
                  {format(new Date(e.at), "yyyy-MM-dd HH:mm")}
                </span>
                {" · "}
                <span className="font-medium">{e.name}</span>{" - "}
                {tidyActivityText(e.action)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
