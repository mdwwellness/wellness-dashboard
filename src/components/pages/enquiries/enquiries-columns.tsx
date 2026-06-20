"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Check, Info } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import type { EnquiryType } from "@/type/schema";
import { EnquiryStatusBadge } from "./enquiry-status-badge";
import { formatTimeRange } from "./time-range";

/**
 * Read the Mongoose-side updatedAt timestamp (created/updatedAt aren't in the
 * Zod schema but are present at runtime). Falls back to createdAt, then null.
 */
function readLastActiveISO(r: EnquiryType): string | undefined {
  const m = r as unknown as { updatedAt?: string; createdAt?: string };
  return m.updatedAt ?? m.createdAt;
}

function readCreatedISO(r: EnquiryType): string | undefined {
  return (r as unknown as { createdAt?: string }).createdAt;
}

/**
 * Header label with an info hint that opens INSTANTLY on hover (no native-title
 * delay) and also toggles on click/tap — so it works on touch too.
 */
function HeaderHint({ label, hint }: { label: string; hint: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      {label}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`What does "${label}" mean?`}
            className="inline-flex text-muted-foreground hover:text-foreground transition-colors cursor-help"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-56 text-xs leading-relaxed p-2.5"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {hint}
        </PopoverContent>
      </Popover>
    </span>
  );
}

function LastActiveCell({
  record,
  field,
}: {
  record: EnquiryType;
  field: "received" | "updated";
}) {
  const iso =
    field === "received" ? readCreatedISO(record) : readLastActiveISO(record);
  if (!iso) return <span className="text-muted-foreground">—</span>;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="whitespace-nowrap" title={date.toLocaleString()}>
      {format(date, "yyyy-MM-dd HH:mm")}
    </span>
  );
}

function CheckOrDash({
  checked,
  disabled = false,
}: {
  checked: boolean | undefined;
  disabled?: boolean;
}) {
  if (checked) {
    return <Check className="inline h-4 w-4 text-green-600" />;
  }
  return (
    <span className={disabled ? "text-muted-foreground/40" : "text-muted-foreground"}>
      —
    </span>
  );
}

function SlotCell({
  slot,
}: {
  slot: { date: string; time: string } | undefined;
}) {
  if (!slot?.date || !slot?.time) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="leading-tight whitespace-nowrap">
      {slot.date} {slot.time}
    </div>
  );
}

interface MakeColumnsParams {
  onOpenDetail: (record: EnquiryType) => void;
  /** Header label for the timestamp column — differs per section
   *  ("Waiting since" for untouched, "Last updated" for attended). */
  lastActiveLabel?: string;
  /** Which timestamp to show: "received" = createdAt (when the enquiry came
   *  in), "updated" = updatedAt (last staff action). */
  lastActiveField?: "received" | "updated";
}

export function makeEnquiryColumns({
  onOpenDetail,
  lastActiveLabel = "Last active",
  lastActiveField = "updated",
}: MakeColumnsParams): ColumnDef<EnquiryType>[] {
  return [
    {
      id: "enquiryId",
      accessorFn: (r) => r.enquiryId ?? "",
      header: "ID",
      cell: ({ row }) => {
        const id = row.original.enquiryId;
        return id ? (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {id}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const count = row.original.repeatCount ?? 1;
        return (
          <span className="inline-flex items-center gap-1.5">
            <span className="font-medium">{row.original.name || "—"}</span>
            {count > 1 && (
              <span
                title={`This person submitted ${count} bookings while this lead was open — see the activity log`}
                className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-700 whitespace-nowrap dark:bg-amber-950/40 dark:text-amber-400"
              >
                ↺ {count}
              </span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "phonenumber",
      header: "Phone",
      cell: ({ row }) => row.original.phonenumber ?? "—",
    },
    // ── Headline: where the lead is in the journey ──
    {
      id: "status",
      header: () => (
        <HeaderHint
          label="Stage"
          hint="Where this lead is in the journey: Reached out → Consult booked → Consult done → Physio booked → Assigned"
        />
      ),
      cell: ({ row }) => <EnquiryStatusBadge record={row.original} />,
    },
    {
      accessorKey: "preferredReachOutTime",
      header: () => (
        <HeaderHint
          label="Preferred call time"
          hint="The time window this lead asked to be contacted in"
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {formatTimeRange(row.original.preferredReachOutTime)}
        </span>
      ),
    },
    // ── Stage ① Reach-out ──
    {
      id: "reach",
      header: () => (
        <HeaderHint
          label="① Reached"
          hint="Step 1 — an executive has phoned/contacted the lead"
        />
      ),
      cell: ({ row }) => (
        <CheckOrDash checked={row.original.executiveReachedOut} />
      ),
    },
    // ── Stage ② Consultation ──
    {
      id: "consultSlot",
      header: () => (
        <HeaderHint
          label="② Consult booked"
          hint="Step 2 — online consultation slot has been scheduled"
        />
      ),
      cell: ({ row }) => <SlotCell slot={row.original.consultationSlot} />,
    },
    {
      id: "consultDone",
      header: () => (
        <HeaderHint
          label="② Consult done"
          hint="Step 2 — the online consultation has taken place"
        />
      ),
      cell: ({ row }) => (
        <CheckOrDash
          checked={row.original.consultationCompleted}
          disabled={!row.original.consultationSlot?.date}
        />
      ),
    },
    // ── Stage ③ Physiotherapy ──
    {
      id: "physioSlot",
      header: () => (
        <HeaderHint
          label="③ Physio slot"
          hint="Step 3 — in-person physiotherapy session date/time"
        />
      ),
      cell: ({ row }) => <SlotCell slot={row.original.physioSlot} />,
    },
    {
      id: "physioTherapist",
      accessorFn: (r) => r.doctor ?? "",
      header: () => (
        <HeaderHint
          label="③ Therapist"
          hint="Step 3 — the therapist assigned to the physio session"
        />
      ),
      cell: ({ row }) =>
        row.original.doctor ? (
          <span className="text-sm whitespace-nowrap">{row.original.doctor}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        ),
    },
    {
      id: "assigned",
      header: () => (
        <HeaderHint
          label="③ Confirmed"
          hint="Step 3 — therapist confirmed available and the assignment is locked in"
        />
      ),
      cell: ({ row }) => (
        <CheckOrDash
          checked={row.original.physioAssignmentConfirmed}
          disabled={
            !row.original.physioSlot?.date || !row.original.doctorId
          }
        />
      ),
    },
    // ── Tracking ──
    {
      id: "reachedOutBy",
      accessorFn: (r) => r.reachedOutBy?.name ?? "",
      header: () => (
        <HeaderHint
          label="Handled by"
          hint="The executive who first took ownership of this lead"
        />
      ),
      cell: ({ row }) => {
        const name = row.original.reachedOutBy?.name;
        return name ? (
          <span className="whitespace-nowrap text-sm">{name}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      },
    },
    {
      id: "lastActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={lastActiveLabel} />
      ),
      accessorFn: (r) =>
        (lastActiveField === "received"
          ? readCreatedISO(r)
          : readLastActiveISO(r)) ?? "",
      cell: ({ row }) => (
        <LastActiveCell record={row.original} field={lastActiveField} />
      ),
    },
    {
      id: "action",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(row.original);
          }}
        >
          <span className="sr-only">Open detail</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}
