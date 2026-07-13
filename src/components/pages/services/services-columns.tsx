"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import type { ServiceType } from "@/type/schema";

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

export const ServiceColumns: ColumnDef<ServiceType>[] = [
  {
    accessorKey: "serviceId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Service No." />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.getValue("serviceId")}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    id: "price",
    header: "Price (orig → disc)",
    cell: ({ row }) => {
      const s = row.original;
      return (
        <span className="tabular-nums text-sm">
          <span className="text-muted-foreground line-through mr-1">
            {formatINR(s.originalPrice ?? 0)}
          </span>
          {formatINR(s.discountedPrice ?? 0)}
        </span>
      );
    },
  },
  {
    accessorKey: "hsnCode",
    header: "HSN/SAC",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue("hsnCode")}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const d = (row.getValue("description") as string) ?? "";
      return (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-[260px] block">
          {d || "--"}
        </span>
      );
    },
  },
];
