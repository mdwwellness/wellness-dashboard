"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
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

function LastActiveCell({ record }: { record: EnquiryType }) {
  const iso = readLastActiveISO(record);
  if (!iso) return <span className="text-muted-foreground">—</span>;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span
      className="text-xs text-muted-foreground whitespace-nowrap"
      title={date.toLocaleString()}
    >
      {formatDistanceToNow(date, { addSuffix: true })}
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
  trailing,
}: {
  slot: { date: string; time: string } | undefined;
  trailing?: string | null;
}) {
  if (!slot?.date || !slot?.time) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="leading-tight">
      <div>
        {slot.date} {slot.time}
      </div>
      {trailing && (
        <div className="text-xs text-muted-foreground">{trailing}</div>
      )}
    </div>
  );
}

interface MakeColumnsParams {
  onOpenDetail: (record: EnquiryType) => void;
}

export function makeEnquiryColumns({
  onOpenDetail,
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
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-left hover:underline"
          onClick={() => onOpenDetail(row.original)}
        >
          {row.original.name || "—"}
        </button>
      ),
    },
    {
      accessorKey: "phonenumber",
      header: "Phone",
      cell: ({ row }) => row.original.phonenumber ?? "—",
    },
    {
      accessorKey: "preferredReachOutTime",
      header: "Preferred",
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {formatTimeRange(row.original.preferredReachOutTime)}
        </span>
      ),
    },
    {
      id: "reach",
      header: () => <span title="Executive reached out">Reach</span>,
      cell: ({ row }) => (
        <CheckOrDash checked={row.original.executiveReachedOut} />
      ),
    },
    {
      id: "consultSlot",
      header: "Consult booked",
      cell: ({ row }) => <SlotCell slot={row.original.consultationSlot} />,
    },
    {
      id: "consultDone",
      header: "Done",
      cell: ({ row }) => (
        <CheckOrDash
          checked={row.original.consultationCompleted}
          disabled={!row.original.consultationSlot?.date}
        />
      ),
    },
    {
      id: "physioSlot",
      header: "Physio booked",
      cell: ({ row }) => (
        <SlotCell
          slot={row.original.physioSlot}
          trailing={row.original.doctor ?? null}
        />
      ),
    },
    {
      id: "assigned",
      header: "Assigned",
      cell: ({ row }) => (
        <CheckOrDash
          checked={row.original.physioAssignmentConfirmed}
          disabled={
            !row.original.physioSlot?.date || !row.original.doctorId
          }
        />
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <EnquiryStatusBadge record={row.original} />,
    },
    {
      id: "reachedOutBy",
      accessorFn: (r) => r.reachedOutBy?.name ?? "",
      header: "Handled by",
      cell: ({ row }) => {
        const name = row.original.reachedOutBy?.name;
        return name ? (
          <span
            className="whitespace-nowrap text-sm"
            title="The executive who looked into this lead and handled it"
          >
            {name}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      },
    },
    {
      id: "lastActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last active" />
      ),
      accessorFn: (r) => readLastActiveISO(r) ?? "",
      cell: ({ row }) => <LastActiveCell record={row.original} />,
    },
    {
      id: "action",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onOpenDetail(row.original)}
        >
          <span className="sr-only">Open detail</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}
