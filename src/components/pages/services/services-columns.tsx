"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { Badge } from "@/components/ui/badge";
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
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const c = row.getValue("category") as string;
      return c ? <Badge variant="secondary">{c}</Badge> : "--";
    },
    filterFn: (row, id, value: string[]) =>
      value.includes(row.getValue(id)),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums">{formatINR(row.getValue("price"))}</span>
    ),
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
