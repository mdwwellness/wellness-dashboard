"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

import { useUpdateAppointment } from "@/data/appointment/appointment";
import { useAuthStore } from "@/providers/permission-provider";
import type { ActivityEntry, slotBookingZodType } from "@/type/schema";

const CHECKLIST = [
  { key: "arrived", label: "Arrived" },
  { key: "performed", label: "Service performed" },
  { key: "payment", label: "Payment collected" },
  { key: "completed", label: "Work completed" },
];

/**
 * Therapist "work done" checklist at the bottom of the appointment drawer.
 * Ticking "Work completed" marks the appointment Completed. Every tick is
 * recorded in the shared activityLog (same format as the enquiry drawer).
 */
export function WorkChecklist({
  appointment,
}: {
  appointment: slotBookingZodType;
}) {
  const { user } = useAuthStore();
  const { mutate: update } = useUpdateAppointment({ silent: true });
  const [draft, setDraft] = useState<slotBookingZodType>(appointment);

  // Resync when a different appointment opens in the drawer.
  useEffect(() => {
    setDraft(appointment);
  }, [appointment._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const done = new Set(draft.workChecklist ?? []);
  const actor =
    `${user?.userfName ?? ""} ${user?.userlName ?? ""}`.trim() || "Someone";

  function toggle(key: string, label: string, checked: boolean) {
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

    if (key === "completed") {
      patch.status = checked ? "completed" : "ongoing";
      patch.completedAt = checked ? new Date().toISOString() : undefined;
    }

    setDraft(patch);
    update(patch);
  }

  const activity = [...(draft.activityLog ?? [])]
    .filter((e) => e.name && e.name !== "System")
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <h3 className="text-sm font-semibold">Work checklist</h3>
      <div className="space-y-2">
        {CHECKLIST.map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={done.has(item.key)}
              onChange={(e) => toggle(item.key, item.label, e.target.checked)}
            />
            {item.label}
            {item.key === "completed" && (
              <span className="text-xs text-muted-foreground">
                (marks appointment completed)
              </span>
            )}
          </label>
        ))}
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
                <span className="font-medium">{e.name}</span> — {e.action}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
