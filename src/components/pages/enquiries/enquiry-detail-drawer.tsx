"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Pencil } from "lucide-react";
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
import type { EnquiryType, TherapistformType } from "@/type/schema";
import { EnquiryStatusBadge } from "./enquiry-status-badge";

interface EnquiryDetailDrawerProps {
  record: EnquiryType | null;
  onClose: () => void;
}

export function EnquiryDetailDrawer({
  record,
  onClose,
}: EnquiryDetailDrawerProps) {
  const open = record !== null;
  const { mutate: update, isPending: isUpdating } = useUpdateAppointment();
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
        if (extra) toast.success("Updated");
      },
    });
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
        </SheetHeader>

        <div className="p-4 space-y-6">
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
          <section className="space-y-2 border-t pt-4">
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
          <section className="space-y-3 border-t pt-4">
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
          <section className="space-y-3 border-t pt-4">
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

          {/* ── Section: Handled by (audit) ── */}
          {draft.reachedOutBy?.name && (
            <section className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Handled by</h3>
                {isAdmin && !editingReachedBy && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setEditingReachedBy(true)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Override
                  </Button>
                )}
              </div>
              {!editingReachedBy ? (
                <p className="text-sm">
                  <span className="font-medium">
                    {draft.reachedOutBy.name}
                  </span>
                  {draft.executiveReachedOutAt && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({new Date(draft.executiveReachedOutAt).toLocaleString()})
                    </span>
                  )}
                </p>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={draft.reachedOutBy?.userId ?? ""}
                    onValueChange={(userId) => {
                      const u = users?.find((x) => x._id === userId);
                      if (!u) return;
                      save({
                        reachedOutBy: {
                          userId: u._id,
                          name: `${u.userfName} ${u.userlName}`.trim(),
                        },
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
              )}
              <p className="text-xs text-muted-foreground">
                {isAdmin
                  ? "Admin: you can reassign who handled this lead."
                  : "This is the record of who looked into and handled this lead."}
              </p>
            </section>
          )}

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
              value={draft.status ?? "enquiry"}
              disabled={!canEditStatus}
              onValueChange={(v) =>
                save({ status: v as EnquiryType["status"] })
              }
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
