"use client";

import { useEffect, useMemo, useState } from "react";
import { format, startOfToday } from "date-fns";
import {
  CalendarIcon,
  Check,
  Loader2,
  Pencil,
  PhoneMissed,
  MessageCircle,
} from "lucide-react";
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
import { cn, tidyActivityText } from "@/lib/utils";
import { RecordIds } from "@/components/pages/appointment/record-ids";
import { formatTimeRange } from "./time-range";

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
import { useGetServices } from "@/data/service/service";
import {
  getSessionPackages,
  needsTherapyPackage,
} from "@/lib/package-progress";
import { THERAPY_CATEGORYES } from "@/lib/constant";

const STATUS_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  scheduled: "Scheduled",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Reason options when reassigning an already-assigned therapist (T4).
const REASSIGN_REASONS = [
  "Therapist unavailable / on leave",
  "Customer requested a different therapist",
  "Gender preference",
  "Load / schedule balancing",
  "Other",
];

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
  const { data: services = [] } = useGetServices();
  const sessionPackages = useMemo(
    () => getSessionPackages(services),
    [services],
  );

  // Local edit buffer keeps the form responsive without writing every keystroke.
  // Re-syncs to the latest record prop whenever the parent re-renders with
  // fresh data (e.g. after a server update). Unsaved local edits are lost on
  // re-sync — acceptable for MVP because saves happen on every blur and toggle.
  const [draft, setDraft] = useState<EnquiryType | null>(record);
  useEffect(() => {
    setDraft(record);
    setOverrideReason("");
  }, [record]);

  const showPackagePicker = useMemo(
    () => (draft ? needsTherapyPackage(draft) : false),
    [draft],
  );
  const selectedPackage = useMemo(
    () =>
      sessionPackages.find((p) => p.serviceId === draft?.packageServiceId),
    [sessionPackages, draft?.packageServiceId],
  );

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

  // Broader edit gate (T3/T5): admins, the owner, or anyone while the lead is
  // still unclaimed. A non-owner exec must supply a reason (captured below).
  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    const owner = draft?.reachedOutBy?.userId;
    return !owner || owner === currentUser.id;
  }, [currentUser, isAdmin, draft?.reachedOutBy?.userId]);
  const ownerName = draft?.reachedOutBy?.name ?? "another executive";

  // Editable inline state for the admin reachedOutBy override.
  const [editingReachedBy, setEditingReachedBy] = useState(false);
  // Lead info is what the customer already told us — read-only by default.
  // Editing is deliberate: a phone typo silently splits one customer in two.
  const [editingLead, setEditingLead] = useState(false);

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

  // ── Executive-lock (T3/T4/T5) local state ──
  // Once a non-owner supplies an override reason, it rides along with saves for
  // the rest of this drawer session (so they aren't re-prompted per field).
  const [overrideReason, setOverrideReason] = useState("");
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [reasonDraft, setReasonDraft] = useState("");
  const [pendingSave, setPendingSave] = useState<{
    extra?: Partial<EnquiryType>;
    advance: boolean;
  } | null>(null);
  // Therapist reassignment reason (dropdown) for non-admins.
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignReasonSel, setReassignReasonSel] = useState("");
  const [pendingTherapist, setPendingTherapist] = useState<{
    doctorId: string;
    doctor: string;
  } | null>(null);

  // Only NOW is it safe to early-return — hooks above have all run.
  if (!record || !draft) return null;

  // Only "Online Consultation" leads have the paid therapist-consultation step.
  // Home Therapy / Vitals leads skip it — the executive reach-out already
  // captures their needs — so their funnel is Reach-out → Assignment → Payment
  // and the later steps renumber down by one.
  const isConsultLead =
    draft.service !== "Home Therapy" && draft.service !== "Vitals Check";
  const stepNo = {
    reach: 1,
    consult: 2,
    physio: isConsultLead ? 3 : 2,
    payment: isConsultLead ? 4 : 3,
    completion: isConsultLead ? 5 : 4,
  };

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

  function save(
    extra?: Partial<EnquiryType>,
    isFunnelAdvance = false,
    reason?: string,
  ) {
    const merged = extra ? withCascade(extra, isFunnelAdvance) : {};
    const next = { ...draft!, ...merged };
    const effectiveReason = (reason ?? overrideReason).trim();

    // Soft lock (T3/T5): a non-owner exec must give a reason before editing.
    if (!canEdit && !effectiveReason) {
      toast.warning(`This lead is owned by ${ownerName} — add a reason to edit.`);
      setPendingSave({ extra, advance: isFunnelAdvance });
      setReasonDraft("");
      setReasonDialogOpen(true);
      return;
    }

    const payload: EnquiryType = effectiveReason
      ? { ...next, overrideReason: effectiveReason }
      : next;
    update(payload, {
      onSuccess: () => {
        setDraft(next);
        setSavedOnce(true);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  // Confirm the override-reason dialog → remember it + run the deferred save.
  function confirmOverrideReason() {
    const r = reasonDraft.trim();
    if (!r) {
      toast.error("Add a reason to edit this lead");
      return;
    }
    setOverrideReason(r);
    setReasonDialogOpen(false);
    const p = pendingSave;
    setPendingSave(null);
    if (p) save(p.extra, p.advance, r);
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

  // Log a failed call attempt ("no answer"). Deliberately NOT a funnel advance:
  // status stays "enquiry" and executiveReachedOut stays false, so the lead lands
  // on /dashboard/follow-ups rather than moving into "Attended".
  function logNoAnswer() {
    const n = (draft!.reachAttempts ?? 0) + 1;
    const entry: ActivityEntry = {
      at: new Date().toISOString(),
      userId: currentUser?.id,
      name: currentActorName(),
      action: `Attempted to call — no answer (#${n})`,
    };
    save({
      reachAttempts: n,
      lastAttemptAt: new Date().toISOString(),
      activityLog: [...(draft!.activityLog ?? []), entry],
      // Claim ownership on the first attempt (without advancing the funnel) so
      // "Handled by" shows who's chasing the lead.
      reachedOutBy:
        draft!.reachedOutBy ??
        (currentUser
          ? {
              userId: currentUser.id,
              name: currentActorName(),
            }
          : undefined),
    });
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

  function selectPackage(serviceId: string) {
    const pkg = sessionPackages.find((p) => p.serviceId === serviceId);
    const next: Partial<EnquiryType> = {
      packageServiceId: serviceId === "none" ? undefined : serviceId,
    };
    if (pkg?.price != null) {
      next.paymentAmount = pkg.price;
      next.quotedPrice = pkg.price;
    }
    save(next);
  }

  function togglePayment(checked: boolean) {
    if (checked && !draft?.physioAssignmentConfirmed) {
      toast.error("Confirm the physio assignment first");
      return;
    }
    if (checked && showPackagePicker && !draft?.packageServiceId) {
      toast.error("Select a therapy package before recording payment");
      return;
    }
    if (
      checked &&
      (!draft?.physioSlot?.date || !draft?.physioSlot?.time)
    ) {
      toast.error("Book the physio slot first — it becomes session 1");
      return;
    }

    const extra: Partial<EnquiryType> = {
      paymentReceived: checked,
      paymentReceivedAt: checked ? new Date().toISOString() : undefined,
      status: checked ? "ongoing" : "scheduled",
    };

    if (checked && draft?.physioSlot?.date && draft?.physioSlot?.time) {
      extra.slot = {
        date: draft.physioSlot.date,
        time: draft.physioSlot.time,
      };
      extra.sessionNumber = 1;
      extra.sessionsCompleted = 0;
      extra.typeOfappointment = "appointment";
      if (draft._id) {
        extra.packageOriginId = draft._id;
      }
    }

    if (checked) {
      const amt = draft?.paymentAmount;
      const method = draft?.paymentMethod;
      const pkgLabel = selectedPackage?.name
        ? ` · ${selectedPackage.name}`
        : "";
      const desc = `Payment received${amt ? ` ₹${amt}` : ""}${
        method ? ` (${method})` : ""
      }${pkgLabel} · Session 1 scheduled`;
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
      extra.completedAt = undefined;
    }
    save(extra);
  }

  function sendPaymentConfirmationWa() {
    if (!draft?.paymentReceived || !draft?.paymentReceivedAt) return;

    const phone = String(draft.phonenumber ?? "").replace(/[^\d]/g, "");
    if (!phone) return;

    const amt = draft.paymentAmount ? `₹${draft.paymentAmount}` : "";
    const method = draft.paymentMethod ? ` (${draft.paymentMethod})` : "";

    const pkgLabel = selectedPackage?.name
      ? `\nPackage: ${selectedPackage.name}`
      : "";
    const sessionLabel =
      draft.slot?.date && draft.slot?.time
        ? `\nSession 1: ${draft.slot.date} ${draft.slot.time}`
        : "";

    const msg = `Hi ${draft.name ?? ""},\n\nPayment received${amt ? ` ${amt}` : ""}${method}.\nReceived on: ${new Date(
      draft.paymentReceivedAt,
    ).toLocaleString()}${pkgLabel}${sessionLabel}\n\nThanks!`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
          <RecordIds appointment={draft} />

          {/* ── Progress overview ── */}
          <EnquiryProgressStepper record={draft} />

          {/* ── Section: Lead info ── */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Lead info</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setEditingLead((v) => !v)}
              >
                {editingLead ? (
                  "Done"
                ) : (
                  <>
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </>
                )}
              </Button>
            </div>

            {!editingLead && (
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                {(
                  [
                    ["Name", draft.name],
                    ["Phone", draft.phonenumber ? String(draft.phonenumber) : ""],
                    ["Email", draft.email],
                    ["Age", draft.age ? String(draft.age) : ""],
                    ["Location", draft.location],
                    ["Preferred call", formatTimeRange(draft.preferredReachOutTime)],
                  ] as [string, string | undefined][]
                ).map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="truncate text-sm" title={value || undefined}>
                      {value?.trim() || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div
              className={cn(
                "grid grid-cols-1 sm:grid-cols-2 gap-3",
                !editingLead && "hidden",
              )}
            >
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

            {(draft.service || (draft.vitals && draft.vitals.length > 0)) && (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md border bg-muted/30 px-2.5 py-1.5">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Offering
                </span>
                <span className="text-sm font-medium">
                  {draft.service ?? "—"}
                </span>
                {draft.vitals?.map((v) => (
                  <span
                    key={v}
                    className="rounded-full border bg-background px-1.5 py-0.5 text-[10px]"
                  >
                    {v}
                  </span>
                ))}
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Note
              </label>
              <Textarea
                className="min-h-[56px] text-sm"
                value={draft.note ?? ""}
                onChange={(e) => patch({ note: e.target.value })}
                onBlur={() => save()}
              />
            </div>
          </section>

          {/* ── Section: Reach out ── */}
          <section id="enq-sec-reach" className="space-y-2 border-t pt-4 scroll-mt-4">
            <h3 className="text-sm font-semibold">
              {stepNo.reach}. Executive reach-out
            </h3>
            <p className="text-xs text-muted-foreground">
              {isConsultLead
                ? "A quick call to reach the customer and schedule a time — no charge."
                : "Reach the customer, capture their needs, and schedule a time — no charge."}
            </p>
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

            {/* Couldn't-connect path — only relevant until we successfully reach them. */}
            {!draft.executiveReachedOut && (
              <div className="space-y-1.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={logNoAnswer}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:text-orange-400"
                >
                  <PhoneMissed className="mr-2 h-4 w-4" />
                  Couldn&apos;t connect (no answer)
                </Button>
                {(draft.reachAttempts ?? 0) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Attempts: {draft.reachAttempts}
                    {draft.lastAttemptAt &&
                      ` · last ${new Date(draft.lastAttemptAt).toLocaleString()}`}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* ── Section: Online consultation (Online Consultation leads only) ── */}
          {isConsultLead && (
          <section id="enq-sec-consult" className="space-y-3 border-t pt-4 scroll-mt-4">
            <h3 className="text-sm font-semibold">
              {stepNo.consult}. Online consultation (with therapist)
            </h3>
            <p className="text-xs text-muted-foreground">
              Paid session where the therapist discusses the issue — ₹500.
            </p>
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
            {!draft.consultationSlot?.date && (
              <p className="text-xs text-muted-foreground">
                Book the consultation slot above to enable this.
              </p>
            )}
            {draft.consultationCompletedAt && (
              <p className="text-xs text-muted-foreground">
                Completed at{" "}
                {new Date(draft.consultationCompletedAt).toLocaleString()}
              </p>
            )}
          </section>
          )}

          {/* ── Section: Physio assignment ── */}
          <section id="enq-sec-physio" className="space-y-3 border-t pt-4 scroll-mt-4">
            <h3 className="text-sm font-semibold">
              {stepNo.physio}.{" "}
              {draft.service === "Vitals Check"
                ? "Vitals visit assignment"
                : draft.service === "Home Therapy"
                  ? "Therapist (home visit)"
                  : "Physiotherapist assignment"}
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
                  const change = { doctorId: id, doctor: t?.name ?? "" };
                  const isReassign = !!draft.doctorId && id !== draft.doctorId;
                  // T4: reassigning an existing therapist needs a reason
                  // (dropdown) from non-admins.
                  if (isReassign && !isAdmin) {
                    setPendingTherapist(change);
                    setReassignReasonSel("");
                    setReassignOpen(true);
                    return;
                  }
                  save(change, true);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a therapist" />
                </SelectTrigger>
                <SelectContent>
                  {(therapists ?? [])
                    .filter((t: TherapistformType) => t.doctorId)
                    .map((t: TherapistformType) => (
                      <SelectItem key={t.doctorId} value={t.doctorId as string}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Treatment package — part of the plan, chosen here (not at payment). */}
            {showPackagePicker && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border bg-muted/30 p-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Therapy package
                  </label>
                  <Select
                    value={draft.packageServiceId ?? "none"}
                    onValueChange={selectPackage}
                    disabled={draft.paymentReceived}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select a package…</SelectItem>
                      {sessionPackages.map((pkg) => (
                        <SelectItem key={pkg.serviceId} value={pkg.serviceId}>
                          {pkg.name} — {pkg.packageCount} sessions · ₹
                          {pkg.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Therapy type (optional)
                  </label>
                  <Select
                    value={draft.category ?? "none"}
                    onValueChange={(v) =>
                      save({ category: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="e.g. Orthopedic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {THERAPY_CATEGORYES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPackage && (
                  <p className="sm:col-span-2 text-xs text-emerald-700 dark:text-emerald-400">
                    {selectedPackage.packageCount} sessions · payment amount
                    auto-filled from catalogue
                  </p>
                )}
              </div>
            )}

            {draft.doctorId &&
              (!draft.physioSlot?.date || !draft.physioSlot?.time) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-md px-2 py-1.5">
                  Pick a physio date &amp; time for{" "}
                  {draft.doctor || "this therapist"} to confirm the assignment.
                </p>
              )}
            {!draft.doctorId && (
              <p className="text-xs text-muted-foreground">
                Pick a therapist above to confirm the assignment.
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
            <h3 className="text-sm font-semibold">{stepNo.payment}. Payment</h3>
            {showPackagePicker && selectedPackage && (
              <p className="text-xs text-muted-foreground">
                Package: <span className="font-medium">{selectedPackage.name}</span>{" "}
                ({selectedPackage.packageCount} sessions) — chosen in step 3.
                Amount below is auto-filled from the catalogue.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="flex items-center justify-between gap-3">
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={!draft.paymentReceived || !draft.paymentReceivedAt}
                onClick={sendPaymentConfirmationWa}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Payment Confirmation
              </Button>
            </div>
            {draft.paymentReceived && draft.paymentReceivedAt && (
              <p className="text-xs text-muted-foreground">
                Received
                {draft.paymentAmount ? ` ₹${draft.paymentAmount}` : ""}
                {draft.paymentMethod ? ` via ${draft.paymentMethod}` : ""} on{" "}
                {new Date(draft.paymentReceivedAt).toLocaleString()}
                {selectedPackage ? ` · ${selectedPackage.name}` : ""}
                {draft.slot?.date && draft.slot?.time
                  ? ` · Session 1: ${draft.slot.date} ${draft.slot.time}`
                  : ""}
              </p>
            )}
            {!draft.physioAssignmentConfirmed && (
              <p className="text-xs text-muted-foreground">
                Confirm the physio assignment before recording payment.
              </p>
            )}
          </section>

          {/* ── Section: Session 1 / funnel close ── */}
          <section
            id="enq-sec-completion"
            className="space-y-2 border-t pt-4 scroll-mt-4"
          >
            <h3 className="text-sm font-semibold">
              {stepNo.completion}.{" "}
              {showPackagePicker ? "Session 1 scheduled" : "Completion"}
            </h3>
            {showPackagePicker ? (
              <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
                {draft.paymentReceived ? (
                  <>
                    <p className="text-emerald-800 dark:text-emerald-300 font-medium">
                      Lead converted — session 1 is on the Appointments page.
                    </p>
                    {draft.slot?.date && draft.slot?.time && (
                      <p className="text-xs text-muted-foreground">
                        Visit: {draft.slot.date} at {draft.slot.time}
                        {draft.sessionNumber
                          ? ` (session ${draft.sessionNumber})`
                          : ""}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Therapist marks each visit complete on Appointments.
                      Package progress (e.g. 2 of 6) updates automatically.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Record payment in step 4 to schedule session 1 from the
                    physio slot above.
                  </p>
                )}
              </div>
            ) : (
              <>
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
                    Completed on{" "}
                    {new Date(draft.completedAt).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {draft.paymentReceived
                      ? "Treatment in progress — mark when finished."
                      : "Record payment first to enable."}
                  </p>
                )}
              </>
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
                    <div className="text-foreground">{tidyActivityText(e.action)}</div>
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

    {/* T3/T5: reason required to edit another exec's lead */}
    <AlertDialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Editing {ownerName}&apos;s lead</AlertDialogTitle>
          <AlertDialogDescription>
            This lead is owned by {ownerName}. Add a reason to edit it — it&apos;s
            recorded in the activity trail.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          autoFocus
          placeholder="Reason for editing this lead (required)"
          value={reasonDraft}
          onChange={(e) => setReasonDraft(e.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingSave(null)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              confirmOverrideReason();
            }}
          >
            Save with reason
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* T4: reason required to reassign an already-assigned therapist */}
    <AlertDialog open={reassignOpen} onOpenChange={setReassignOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reassign therapist</AlertDialogTitle>
          <AlertDialogDescription>
            Changing the assigned therapist needs a reason — it&apos;s recorded
            in the activity trail.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Select value={reassignReasonSel} onValueChange={setReassignReasonSel}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pick a reason" />
          </SelectTrigger>
          <SelectContent>
            {REASSIGN_REASONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingTherapist(null)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (!reassignReasonSel) {
                toast.error("Pick a reason for the reassignment");
                return;
              }
              const p = pendingTherapist;
              setReassignOpen(false);
              setPendingTherapist(null);
              if (p) save(p, true, reassignReasonSel);
            }}
          >
            Reassign
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
