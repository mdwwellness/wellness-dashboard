"use client";

import { slotBookingZodType, type ServiceType } from "@/type/schema";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { getPackageProgressForAppointment, getConfirmedAddonNames } from "@/lib/package-progress";
import { PackageProgressBadge } from "./package-progress-badge";
import { AppointmentStatusBadge } from "@/components/status-badge";
import { format } from "date-fns";

/**
 * Creation time for a booking, in ms. Prefers the Mongoose `createdAt`
 * timestamp; falls back to the timestamp embedded in the Mongo ObjectId
 * (its first 4 bytes are the creation time in seconds) so sorting still
 * works for any legacy row that has no `createdAt`.
 */
function getCreatedMs(row: slotBookingZodType): number {
  const createdAt = (row as unknown as { createdAt?: string }).createdAt;
  if (createdAt) {
    const t = new Date(createdAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const id = row._id ?? "";
  if (id.length >= 8) {
    const seconds = parseInt(id.slice(0, 8), 16);
    if (!Number.isNaN(seconds)) return seconds * 1000;
  }
  return 0;
}

export function makeAppointmentColumns(
  allAppointments: slotBookingZodType[],
  services: ServiceType[],
): ColumnDef<slotBookingZodType>[] {
  return [
    {
      id: "createdAt",
      accessorFn: (row) => getCreatedMs(row),
      sortingFn: "basic",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Booked on" />
      ),
      cell: ({ row }) => {
        const ms = getCreatedMs(row.original);
        if (!ms) return <span className="text-muted-foreground/40">—</span>;
        return (
          <span className="whitespace-nowrap tabular-nums text-xs text-muted-foreground">
            {format(new Date(ms), "yyyy-MM-dd HH:mm")}
          </span>
        );
      },
    },
    {
      id: "bookingId",
      accessorFn: (row) => row.enquiryId ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Booking ID" />
      ),
      cell: ({ row }) => {
        const id = row.original.enquiryId;
        return id ? (
          <span className="font-mono text-xs text-muted-foreground">{id}</span>
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
        const recCount = row.original.recommendedServices?.length ?? 0;
        const pending = (row.original.recommendedServices ?? []).filter(
          (r) => r.status === "pending",
        ).length;
        return (
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            {row.getValue("name")}
            {recCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                +{recCount} add-on{recCount > 1 ? "s" : ""}
                {pending > 0 ? ` (${pending} pending)` : ""}
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      id: "addOns",
      header: "Add-ons",
      cell: ({ row }) => {
        const stacked = row.original.recommendedServices ?? [];
        if (stacked.length === 0) {
          return <span className="text-muted-foreground/40">—</span>;
        }
        const pending = stacked.filter((r) => r.status === "pending").length;
        const confirmed = getConfirmedAddonNames(row.original);
        return (
          <div className="flex flex-col gap-1 max-w-[200px]">
            <Badge variant="secondary" className="text-[10px] w-fit">
              {stacked.length} on this visit
              {pending > 0 ? ` · ${pending} pending` : ""}
            </Badge>
            {confirmed.length > 0 && (
              <span className="text-[10px] text-muted-foreground truncate" title={confirmed.join(", ")}>
                {confirmed.join(", ")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "packageProgress",
      header: "Package",
      cell: ({ row }) => {
        const progress = getPackageProgressForAppointment(
          row.original,
          allAppointments,
          services,
        );
        const sessionNum = row.original.sessionNumber;
        if (!progress && !sessionNum) {
          return <span className="text-muted-foreground/40">—</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            {sessionNum ? (
              <Badge variant="outline" className="text-[10px] w-fit">
                Session {sessionNum}
              </Badge>
            ) : null}
            {progress ? <PackageProgressBadge progress={progress} /> : null}
          </div>
        );
      },
    },
    {
      accessorKey: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => row.getValue("location"),
    },
    {
      accessorKey: "age",
      header: "Age",
      cell: ({ row }) => row.getValue("age"),
    },
    {
      accessorKey: "phonenumber",
      header: "Phone Number",
      cell: ({ row }) => row.getValue("phonenumber"),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category");
        return category ? category : "--";
      },
    },
    {
      accessorKey: "time",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Time" />
      ),
      cell: ({ row }) => row.original.slot?.time ?? "--",
    },
    {
      accessorKey: "typeOfappointment",
      header: "Type",
      cell: ({ row }) => {
        const typeOfBooking: string | undefined = row.original.typeOfappointment;
        return typeOfBooking ? (
          <Badge
            variant={typeOfBooking === "appointment" ? "secondary" : "default"}
          >
            {typeOfBooking}
          </Badge>
        ) : (
          "--"
        );
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const dateString: string | undefined = row.original.slot?.date;
        if (!dateString) return "--";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "--";
        return date.toISOString().split("T")[0];
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email,
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => row.getValue("note"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <AppointmentStatusBadge status={row.getValue("status") as string} />
      ),
    },
  ];
}

/** @deprecated Use makeAppointmentColumns() for package progress column */
export const AppointmentBookingColumn: ColumnDef<slotBookingZodType>[] =
  makeAppointmentColumns([], []);
