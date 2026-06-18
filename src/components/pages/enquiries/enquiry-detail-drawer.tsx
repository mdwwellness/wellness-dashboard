"use client";

import { useEffect, useMemo, useState } from "react";
import { format, startOfToday } from "date-fns";
import { CalendarIcon, Check, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import {
  useDeleteAppointment,
  useUpdateAppointment,
} from "@/data/appointment/appointment";
import { useGetAllTherapist } from "@/data/therapist/therapist";
import { useGetBackOfficeUsers } from "@/data/user/user-list";
import { useAuthStore } from "@/providers/permission-provider";
import type {
  ActivityEntry,
  EnquiryType,
  TherapistformType,
} from "@/type/schema";
import { EnquiryStatusBadge } from "./enquiry-status-badge";
import { EnquiryProgressStepper } from "./enquiry-progress-stepper";

const STATUS_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  scheduled: "Scheduled",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface EnquiryDetailDrawerProps {
  record: EnquiryType | null;
  onClose: () => void;
}

export function EnquiryDetailDrawer({
  record,
  onClose,
}: EnquiryDetailDrawerProps) {
  const open = record !== null;
  // Auto-save is silent (inline indicator), so suppress the per-save toast.
  const { mutate: update, isPending: isUpdating } = useUpdateAppointment({
    silent: true,
  });
  const { mutate: del, isPending: isDeleting } = useDeleteAppointment();
  const { data: therapists } = useGetAllTherapist();
  const { data: users } = useGetBackOfficeUsers();

  // Local edit buffer keeps the form responsive without writing every keystroke.
  // Re-syncs to the latest record prop whenever the parent re-renders with
  // fresh data (e.g. after a server update). Unsaved local edits are lost on
  // re-sync — acceptable for MVP because saves happen on every blur and toggle.
  const [draft, setDraft] = useState<EnquiryType | null>(record);
  useEffect(() => {
    setDraft(record);
  }, [record]);

  // ── All remaining hooks MUST be declared above the early return so the
  //    hook order is identical every render. (React's rules-of-hooks.)
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  // Permission gate: only admins or the original reachedOutBy person can
  // edit the lead's status. Everyone else sees status as read-only.
  const canEditStatus = useMemo(() => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    return draft?.reachedOutBy?.userId === currentUser.id;
  }, [currentUser, isAdmin, draft?.reachedOutBy?.userId]);

  // Editable inline state for the admin reachedOutBy override.
  const [editingReachedBy, setEditingReachedBy] = useState(false);

  // Delete confirmation modal open state. Lifted to React state (instead of
  // Radix AlertDialogTrigger) so the dialog can be rendered OUTSIDE the Sheet —
  // nesting a Radix AlertDialog inside a Sheet causes the Sheet's pointer-events
  // overlay to swallow the trigger's first click, forcing the user to double-tap.
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Inline save feedback (replaces per-save toasts). `savedOnce` gates the
  // "All changes saved" label so it doesn't show before any edit happens.
  const [savedOnce, setSavedOnce] = useState(false);

  // Status-override flow: picking a new status stages it here and reveals a
  // required reason note; nothing is written until the note is filled + applied.
  const [pendingStatus, setPendingStatus] =
    useState<EnquiryType["status"] | null>(null);
  const [overrideNote, setOverrideNote] = useState("");

  // Only NOW is it safe to early-return — hooks above have all run.
  if (!record || !draft) return null;

  function patch(partial: Partial<EnquiryType>) {
    setDraft({ ...draft!, ...partial });
  }

  /**
   * Build a patch object that, on top of the requested changes, also performs
   * the funnel-progress auto-cascade:
   *   - Sets `executiveReachedOut: true` (if not already) when any funnel
   *     advancement happens (slot booked, checkpoint ticked).
   *   - Captures `reachedOutBy` to the current user (if not already set).
   *   - Sets `executiveReachedOutAt` to now (if not already set).
   *   - Flips status `enquiry → scheduled` (if currently enquiry).
   *
   * The caller passes the actual change (e.g. consultationSlot) plus a flag
   * indicating this is a funnel-advancing action. Returns the merged patch.
   */
  function withCascade(
    requested: Partial<EnquiryType>,
    isFunnelAdvance: boolean,
  ): Partial<EnquiryType> {
    if (!isFunnelAdvance) return requested;
    const d = draft!; // null-narrowed by the early return above
    const out: Partial<EnquiryType> = { ...requested };

    // Auto-tick reach-out if not already.
    if (!d.executiveReachedOut) {
      out.executiveReachedOut = true;
      out.executiveReachedOutAt = new Date().toISOString();
    }

    // Capture "handled by" if not already set — the first person to take action on this lead.
    if (!d.reachedOutBy && currentUser) {
      out.reachedOutBy = {
        userId: currentUser.id,
        name: `${currentUser.userfName} ${currentUser.userlName}`.trim(),
      };
    }

    // Auto-flip status if still on default "enquiry".
    if ((d.status ?? "enquiry") === "enquiry") {
      out.status = "scheduled";
    }

    return out;
  }

  function save(extra?: Partial<EnquiryType>, isFunnelAdvance = false) {
    const merged = extra ? withCascade(extra, isFunnelAdvance) : {};
    const next = { ...draft!, ...merged };
    update(next, {
      onSuccess: () => {
        setDraft(next);
        setSavedOnce(true);
      },
    });
  }

  function currentActorName() {
    if (!currentUser) return "Someone";
    return (
      `${currentUser.userfName ?? ""} ${currentUser.userlName ?? ""}`.trim() ||
      "Someone"
    );
  }

  // Apply a staged status change — requires a non-empty reason note, which is
  // recorded as an activity-log entry.
  function applyStatusOverride() {
    if (!pendingStatus) return;
    const note = overrideNote.trim();
    if (!note) {
      toast.error("Add a reason note for the status change");
      return;
    }
    const entry: ActivityEntry = {
      at: new Date().toISOString(),
      userId: currentUser?.id,
      name: currentActorName(),
      action: `Status → ${STATUS_LABELS[pendingStatus] ?? pendingStatus}: ${note}`,
    };
    save({
      status: pendingStatus,
      statusNote: note,
      activityLog: [...(draft!.activityLog ?? []), entry],
    });
    setPendingStatus(null);
    setOverrideNote("");
  }

  function handleDelete() {
    if (!draft?._id) return;
    del(draft._id, {
      onSuccess: () => {
        setConfirmDeleteOpen(false);
        onClose();
      },
    });
  }

  function toggleReachedOut(checked: boolean) {
    save(
      {
        executiveReachedOut: checked,
        executiveReachedOutAt: checked ? new Date().toISOString() : undefined,
      },
      checked, // ticking ON is a funnel advance (captures reachedOutBy etc.)
    );
  }

  function toggleConsultDone(checked: boolean) {
    if (checked && !draft?.consultationSlot?.date) {
      toast.error("Book the consultation slot first");
      return;
    }
    save(
      {
        consultationCompleted: checked,
        consultationCompletedAt: checked ? new Date().toISOString() : undefined,
      },
      checked,
    );
  }

  function toggleAssignmentConfirmed(checked: boolean) {
    if (
      checked &&
      (!draft?.physioSlot?.date || !draft?.physioSlot?.time || !draft?.doctorId)
    ) {
      toast.error("Book the physio slot and pick a therapist first");
      return;
    }
    save(
      {
        physioAssignmentConfirmed: checked,
        physioAssignmentConfirmedAt: checked
          ? new Date().toISOString()
          : undefined,
      },
      checked,
    );
  }

  function togglePayment(checked: boolean) {
    if (checked && !draft?.physioAssignmentConfirmed) {
      toast.error("Confirm the physio assignment first");
      return;
    }
    const extra: Partial<EnquiryType> = {
      paymentReceived: checked,
      paymentReceivedAt: checked ? new Date().toISOString() : undefined,
      // Paying advances to Ongoing; un-paying drops back to Scheduled
      // (derived stage then falls back to Assigned).
      status: checked ? "ongoing" : "scheduled",
    };
    if (checked) {
      const amt = draft?.paymentAmount;
      const method = draft?.paymentMethod;
      const desc = `Payment received${amt ? ` ₹${amt}` : ""}${
        method ? ` (${method})` : ""
      }`;
      extra.activityLog = [
        ...(draft?.activityLog ?? []),
        {
          at: new Date().toISOString(),
          userId: currentUser?.id,
          name: currentActorName(),
          action: desc,
        },
      ];
    } else {
      // un-paying also clears any completion
      extra.completedAt = undefined;
    }
    save(extra);
  }

  function toggleCompleted(checked: boolean) {
    if (checked && !draft?.paymentReceived) {
      toast.error("Record payment first");
      return;
    }
    const extra: Partial<EnquiryType> = {
      status: checked ? "completed" : "ongoing",
      completedAt: checked ? new Date().toISOString() : undefined,
    };
    if (checked) {
      extra.activityLog = [
        ...(draft?.activityLog ?? []),
        {
          at: new Date().toISOString(),
          userId: currentUser?.id,
          name: currentActorName(),
          action: "Marked completed",
        },
      ];
    }
    save(extra);
  }

  const activity = buildActivity(draft);

  return (
    <>
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {draft.enquiryId && (
              <span className="text-xs font-mono text-muted-foreground">
                {draft.enquiryId}
              </span>
            )}
            {draft.name || "Unnamed"} <EnquiryStatusBadge record={draft} />
          </SheetTitle>
          <SheetDescription>
            Advance the lead through the funnel. All changes save on click.
          </SheetDescription>
          <div
            className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 h-4"
            aria-live="polite"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </>
            ) : savedOnce ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                All changes saved
              </>
            ) : null}
          </div>
        </SheetHeader>

        <div className="p-4 space-y-6">
          {/* ── Progress overview ── */}
          <EnquiryProgressStepper record={draft} />

          {/* ── Section: Lead info ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Lead info</h3>
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput
                label="Name"
                value={draft.name ?? ""}
                onChange={(v) => patch({ name: v })}
                onBlur={() => save()}
              />
              <LabeledInput
                label="Phone"
                type="number"
                value={String(draft.phonenumber ?? "")}
                onChange={(v) => patch({ phonenumber: Number(v) })}
                onBlur={() => save()}
              />
              <LabeledInput
                label="Email"
                value={draft.email ?? ""}
                onChange={(v) => patch({ email: v })}
                onBlur={() => save()}
              />
              <LabeledInput
                label="Age"
                type="number"
                value={String(draft.age ?? "")}
                onChange={(v) => patch({ age: Number(v) })}
                onBlur={() => save()}
              />
              <LabeledInput
                label="Location"
                value={draft.location ?? ""}
                onChange={(v) => patch({ location: v })}
                onBlur={() => save()}
              />
              <div className="col-span-1">
                <label className="text-xs text-muted-foreground">
                  Preferred reach-out
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="time"
                    aria-label="Preferred reach-out from"
                    value={draft.preferredReachOutTime?.from ?? ""}
                    onChange={(e) =>
                      patch({
                        preferredReachOutTime: {
                          from: e.target.value,
                          to: draft.preferredReachOutTime?.to ?? "",
                        },
                      })
                    }
                    onBlur={() => save()}
                  />
                  <Input
                    type="time"
                    aria-label="Preferred reach-out to"
                    value={draft.preferredReachOutTime?.to ?? ""}
                    onChange={(e) =>
                      patch({
                        preferredReachOutTime: {
                          from: draft.preferredReachOutTime?.from ?? "",
                          to: e.target.value,
                        },
                      })
                    }
                    onBlur={() => save()}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Note</label>
              <Textarea
                value={draft.note ?? ""}
                onChange={(e) => patch({ note: e.target.value })}
                onBlur={() => save()}
              />
            </div>
          </section>

          {/* ── Section: Reach out ── */}
          <section id="enq-sec-reach" className="space-y-2 border-t pt-4 scroll-mt-4">
            <h3 className="text-sm font-semibold">1. Executive reach-out</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.executiveReachedOut ?? false}
                onChange={(e) => toggleReachedOut(e.target.checked)}
              />
              Mark as reached out
            </label>
            {draft.executiveReachedOutAt && (
              <p className="text-xs text-muted-foreground">
                Reached out at{" "}
                {new Date(draft.executiveReachedOutAt).toLocaleString()}
              </p>
            )}
          </section>

          {/* ── Section: Online consultation ── */}
          <section id="enq-sec-consult" className="space-y-3 border-t pt-4 scroll-mt-4">
            <h3 className="text-sm font-semibold">
              2. Online consultation
            </h3>
            <SlotPicker
              label="Consultation slot"
              value={draft.consultationSlot}
              onChange={(slot) => save({ consultationSlot: slot }, true)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.consultationCompleted ?? false}
                disabled={!draft.consultationSlot?.date}
                onChange={(e) => toggleConsultDone(e.target.checked)}
              />
              Mark consultation done
            </label>
            {draft.consultationCompletedAt && (
              <p className="text-xs text-muted-foreground">
                Completed at{" "}
                {new Date(draft.consultationCompletedAt).toLocaleString()}
              </p>
            )}
          </section>

          {/* ── Section: Physio assignment ── */}
          <section id="enq-sec-physio" className="space-y-3 border-t pt-4 scroll-mt-4">
            <h3 className="text-sm font-semibold">
              3. Physiotherapist assignment
            </h3>
            <SlotPicker
              label="Physio slot"
              value={draft.physioSlot}
              onChange={(slot) => save({ physioSlot: slot }, true)}
            />
            <div>
              <label className="text-xs text-muted-foreground">
                Therapist
              </label>
              <Select
                value={draft.doctorId ?? ""}
                onValueChange={(id) => {
                  const t = therapists?.find(
                    (x: TherapistformType) => x.doctorId === id,
                  );
                  save(
                    {
                      doctorId: id,
                      doctor: t?.name ?? "",
                    },
                    true,
                  );
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a therapist" />
                </SelectTrigger>
                <SelectContent>
                  {(therapists ?? []).map((t: TherapistformType) => (
                    <SelectItem key={t.doctorId} value={t.doctorId}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {draft.doctorId &&
              (!draft.physioSlot?.date || !draft.physioSlot?.time) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-md px-2 py-1.5">
                  Pick a physio date &amp; time for{" "}
                  {draft.doctor || "this therapist"} to confirm the assignment.
                </p>
              )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.physioAssignmentConfirmed ?? false}
                disabled={
                  !draft.physioSlot?.date ||
                  !draft.physioSlot?.time ||
                  !draft.doctorId
                }
                onChange={(e) => toggleAssignmentConfirmed(e.target.checked)}
              />
              Confirm assignment (therapist is available)
            </label>
            {draft.physioAssignmentConfirmedAt && (
              <p className="text-xs text-muted-foreground">
                Confirmed at{" "}
                {new Date(draft.physioAssignmentConfirmedAt).toLocaleString()}
              </p>
            )}
          </section>

          {/* ── Section: Payment ── */}
          <section
            id="enq-sec-payment"
            className="space-y-3 border-t pt-4 scroll-mt-4"
          >
            <h3 className="text-sm font-semibold">4. Payment</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">
                  Amount (₹)
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={draft.paymentAmount ?? ""}
                  onChange={(e) =>
                    patch({
                      paymentAmount:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                  onBlur={() => save()}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Method</label>
                <Select
                  value={draft.paymentMethod ?? ""}
                  onValueChange={(v) =>
                    save({ paymentMethod: v as EnquiryType["paymentMethod"] })
                  }
                >
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
            <label
              className={cn(
                "flex items-center gap-2 text-sm",
                !draft.physioAssignmentConfirmed && "opacity-50",
              )}
            >
              <input
                type="checkbox"
                checked={draft.paymentReceived ?? false}
                disabled={!draft.physioAssignmentConfirmed}
                onChange={(e) => togglePayment(e.target.checked)}
              />
              Payment received
            </label>
            {draft.paymentReceived && draft.paymentReceivedAt && (
              <p className="text-xs text-muted-foreground">
                Received
                {draft.paymentAmount ? ` ₹${draft.paymentAmount}` : ""}
                {draft.paymentMethod ? ` via ${draft.paymentMethod}` : ""} on{" "}
                {new Date(draft.paymentReceivedAt).toLocaleString()}
              </p>
            )}
            {!draft.physioAssignmentConfirmed && (
              <p className="text-xs text-muted-foreground">
                Confirm the physio assignment before recording payment.
              </p>
            )}
          </section>

          {/* ── Section: Completion ── */}
          <section
            id="enq-sec-completion"
            className="space-y-2 border-t pt-4 scroll-mt-4"
          >
            <h3 className="text-sm font-semibold">5. Completion</h3>
            <label
              className={cn(
                "flex items-center gap-2 text-sm",
                !draft.paymentReceived && "opacity-50",
              )}
            >
              <input
                type="checkbox"
                checked={draft.status === "completed"}
                disabled={!draft.paymentReceived}
                onChange={(e) => toggleCompleted(e.target.checked)}
              />
              Mark completed
            </label>
            {draft.status === "completed" && draft.completedAt ? (
              <p className="text-xs text-muted-foreground">
                Completed on {new Date(draft.completedAt).toLocaleString()}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {draft.paymentReceived
                  ? "Treatment in progress — mark when finished."
                  : "Record payment first to enable."}
              </p>
            )}
          </section>

          {/* ── Section: Activity (audit log) ── */}
          <section className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Activity</h3>
              {draft.reachedOutBy?.name && isAdmin && !editingReachedBy && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setEditingReachedBy(true)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Reassign handler
                </Button>
              )}
            </div>

            {/* Handled-by summary + admin reassign */}
            {draft.reachedOutBy?.name &&
              (!editingReachedBy ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">Handled by </span>
                  <span className="font-medium">{draft.reachedOutBy.name}</span>
                </p>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={draft.reachedOutBy?.userId ?? ""}
                    onValueChange={(userId) => {
                      const u = users?.find((x) => x._id === userId);
                      if (!u) return;
                      const name = `${u.userfName} ${u.userlName}`.trim();
                      const entry: ActivityEntry = {
                        at: new Date().toISOString(),
                        userId: currentUser?.id,
                        name: currentActorName(),
                        action: `Reassigned handler to ${name}`,
                      };
                      save({
                        reachedOutBy: { userId: u._id, name },
                        activityLog: [...(draft.activityLog ?? []), entry],
                      });
                      setEditingReachedBy(false);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Reassign…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(users ?? []).map((u) => (
                        <SelectItem key={u._id} value={u._id}>
                          {u.userfName} {u.userlName} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingReachedBy(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ))}

            {/* Timeline */}
            {activity.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity yet.</p>
            ) : (
              <ol className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {activity.map((e, i) => (
                  <li
                    key={`${e.at}-${i}`}
                    className="text-xs border-l-2 border-muted pl-3 pb-0.5"
                  >
                    <div className="text-foreground">{e.action}</div>
                    <div className="text-muted-foreground">
                      {e.name}
                      {" · "}
                      {new Date(e.at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* ── Section: Status override (permission-gated) ── */}
          <section className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Status override</h3>
              {!canEditStatus && (
                <span className="text-xs text-muted-foreground">
                  Read-only
                </span>
              )}
            </div>
            <Select
              value={pendingStatus ?? draft.status ?? "enquiry"}
              disabled={!canEditStatus}
              onValueChange={(v) => {
                const next = v as EnquiryType["status"];
                const current = draft.status ?? "enquiry";
                if (next === current) {
                  setPendingStatus(null);
                  setOverrideNote("");
                  return;
                }
                if (next === "cancelled") {
                  // Cancelling requires a reason — stage it and ask.
                  setPendingStatus(next);
                  return;
                }
                // Any other status change saves immediately (and is logged).
                const entry: ActivityEntry = {
                  at: new Date().toISOString(),
                  userId: currentUser?.id,
                  name: currentActorName(),
                  action: `Changed status to ${STATUS_LABELS[next as string] ?? next}`,
                };
                save({
                  status: next,
                  activityLog: [...(draft.activityLog ?? []), entry],
                });
                setPendingStatus(null);
                setOverrideNote("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enquiry">Enquiry</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Required reason note — only when cancelling a lead. */}
            {pendingStatus === "cancelled" && (
              <div className="rounded-md border bg-muted/40 p-3 space-y-2">
                <label className="text-sm font-medium">
                  Reason for cancellation
                  <span className="text-destructive"> *</span>
                </label>
                <Textarea
                  autoFocus
                  placeholder="Why is this lead being cancelled? (required)"
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPendingStatus(null);
                      setOverrideNote("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!overrideNote.trim() || isUpdating}
                    onClick={applyStatusOverride}
                  >
                    Apply change
                  </Button>
                </div>
              </div>
            )}

            {!canEditStatus && (
              <p className="text-xs text-muted-foreground">
                Only admins or {draft.reachedOutBy?.name ?? "the person who handled this lead"} can change status.
              </p>
            )}
          </section>

          {/* ── Section: Footer actions ── */}
          <section className="flex justify-between items-center border-t pt-4">
            <Button
              variant="destructive"
              disabled={isDeleting || isUpdating}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting…
                </span>
              ) : (
                "Delete enquiry"
              )}
            </Button>

            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </section>
        </div>
      </SheetContent>

      {/* AlertDialog lives OUTSIDE the SheetContent (but still inside the
          Sheet root — that's fine; the bug was about it being inside the
          SheetContent's pointer-events trap). Controlled by React state
          instead of an AlertDialogTrigger, so the first click on the
          destructive Button opens the confirm reliably. */}
    </Sheet>

    <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete enquiry?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the record. Cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// ── Local helpers ──

/**
 * Build a chronological activity timeline of EXECUTIVE actions only —
 * name · what they did · timestamp. No "system" events.
 *
 * Merges the backend-stored `activityLog` (real per-action attribution, once
 * the backend supports the field) with milestones DERIVED from the timestamp
 * fields we already persist. Derived milestones are only included when we know
 * which person to attribute them to (the lead's handler) — anything we can't
 * tie to a person is left out rather than shown as "system".
 */
function buildActivity(d: EnquiryType): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  const handler = d.reachedOutBy?.name;
  const handlerId = d.reachedOutBy?.userId;

  if (handler) {
    if (d.executiveReachedOutAt) {
      entries.push({
        at: d.executiveReachedOutAt,
        userId: handlerId,
        name: handler,
        action: "Reached out to lead",
      });
    }
    if (d.consultationCompletedAt) {
      entries.push({
        at: d.consultationCompletedAt,
        userId: handlerId,
        name: handler,
        action: "Marked consultation done",
      });
    }
    if (d.physioAssignmentConfirmedAt) {
      entries.push({
        at: d.physioAssignmentConfirmedAt,
        userId: handlerId,
        name: handler,
        action: `Confirmed assignment${d.doctor ? ` (${d.doctor})` : ""}`,
      });
    }
  }

  // Stored log entries (status changes, reassignments, future backend log).
  if (d.activityLog?.length) entries.push(...d.activityLog);

  // Defensive: never show non-executive ("System") rows.
  return entries
    .filter((e) => e.name && e.name !== "System")
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

function LabeledInput({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}

const TIME_SLOTS = [
  "9:30", "10:30", "11:30", "12:30", "13:30", "14:30",
  "15:30", "16:30", "17:30", "18:30", "19:30", "20:30",
];

function SlotPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { date: string; time: string } | undefined;
  onChange: (slot: { date: string; time: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const date = value?.date ? new Date(value.date) : undefined;

  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-xs text-muted-foreground">{label} date</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn("w-full justify-start text-left font-normal")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              // Block past dates — slots can only be booked today or later.
              disabled={{ before: startOfToday() }}
              onSelect={(d) => {
                if (d)
                  onChange({
                    date: format(d, "yyyy-MM-dd"),
                    time: value?.time ?? "",
                  });
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Time</label>
        <Select
          value={value?.time ?? ""}
          onValueChange={(t) =>
            onChange({ date: value?.date ?? "", time: t })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            {TIME_SLOTS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
