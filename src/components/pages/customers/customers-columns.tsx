"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import type { Customer, CustomerSegment } from "@/data/customer/customer";

const SEGMENT_LABEL: Record<CustomerSegment, string> = {
  new: "New",
  returning: "Returning",
  vip: "VIP",
};

const SEGMENT_CLASS: Record<CustomerSegment, string> = {
  new: "border-blue-600 text-blue-700 bg-blue-50",
  returning: "border-emerald-600 text-emerald-700 bg-emerald-50",
  vip: "border-amber-600 text-amber-800 bg-amber-100",
};

function LastBookedCell({ iso }: { iso?: string }) {
  if (!iso) return <span className="text-muted-foreground/40">—</span>;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return <span className="text-muted-foreground/40">—</span>;
  }
  return (
    <span
      className="text-xs text-muted-foreground whitespace-nowrap"
      title={d.toLocaleString()}
    >
      {formatDistanceToNow(d, { addSuffix: true })}
    </span>
  );
}

interface MakeColumnsParams {
  onOpenDetail: (customer: Customer) => void;
}

export function makeCustomerColumns({
  onOpenDetail,
}: MakeColumnsParams): ColumnDef<Customer>[] {
  return [
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
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) =>
        row.original.email ? (
          <span className="text-sm">{row.original.email}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        ),
    },
    {
      accessorKey: "location",
      header: "City",
      cell: ({ row }) =>
        row.original.location ? (
          <span className="text-sm">{row.original.location}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        ),
    },
    {
      id: "totalBookings",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bookings" />
      ),
      accessorFn: (r) => r.totalBookings,
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {row.original.totalBookings}
        </span>
      ),
    },
    {
      id: "segment",
      header: "Segment",
      accessorFn: (r) => r.segment,
      cell: ({ row }) => {
        const seg = row.original.segment;
        return (
          <Badge variant="outline" className={SEGMENT_CLASS[seg]}>
            {SEGMENT_LABEL[seg]}
          </Badge>
        );
      },
    },
    {
      id: "lastBookingAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last booking" />
      ),
      accessorFn: (r) => r.lastBookingAt ?? "",
      cell: ({ row }) => <LastBookedCell iso={row.original.lastBookingAt} />,
    },
    {
      id: "action",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onOpenDetail(row.original)}
        >
          <span className="sr-only">Open customer</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}
