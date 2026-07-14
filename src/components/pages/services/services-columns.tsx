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
    id: "originalPrice",
    header: "Original (₹)",
    cell: ({ row }) => {
      const s = row.original;
      return (
        <span className="tabular-nums">
          {formatINR(s.originalPrice ?? s.price ?? 0)}
        </span>
      );
    },
  },
  {
    id: "discountedPrice",
    header: "Discounted (₹)",
    cell: ({ row }) => {
      const s = row.original;
      return (
        <span className="tabular-nums">
          {formatINR(s.discountedPrice ?? s.recommendedPrice ?? s.price ?? 0)}
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
