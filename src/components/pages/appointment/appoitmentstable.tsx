"use client";
import { slotBookingZodType } from "@/type/schema";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import AppointmentsDetailsPage from "./appointments-detail-page";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const AppointmentBookingColumn: ColumnDef<slotBookingZodType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />;
    },
    cell: ({ row }) => row.getValue("name"),
  },
  {
    accessorKey: "location",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Location" />;
    },
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
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Time" />;
    },
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
    cell: ({ row }) => {
      const status = row.getValue("status");
      switch (status) {
        case "scheduled":
          return (
            <Badge
              variant="outline"
              className="border-yellow-600 text-yellow-600"
            >
              Scheduled
            </Badge>
          );
        case "ongoing":
          return (
            <Badge variant="outline" className="border-blue-600 text-blue-600">
              Ongoing
            </Badge>
          );
        case "cancelled":
          return <Badge variant="destructive">Cancelled</Badge>;
        case "completed":
          return (
            <Badge
              variant="outline"
              className="border-green-600 text-green-600"
            >
              Completed
            </Badge>
          );

        default:
          return "N/A";
      }
    },
  },
  {
    id: "action",
    cell: ({ row }) => {
      const details = row.original;
      return (
        <>
          <AppointmentsDetailsPage data={details}>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </AppointmentsDetailsPage>
        </>
      );
    },
  },
];
