"use client"
import { slotBookingZodType } from "@/type/schema";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import AppointmentsDetailsPage from "./appointments-detail-page";
import { Button } from "../ui/button";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "../ui/badge";

export const AppointmentBookingColumn: ColumnDef<slotBookingZodType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />
    },
    cell: ({ row }) => row.getValue("name"),
  },
  {
    accessorKey: "location",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Location" />
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
    cell: ({ row }) =>{
    const category =   row.getValue("category");
    return category ? category : "--"
    },
  },
  {
    accessorKey: "time",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Time" />
    },
    cell: ({ row }) => row.original.slot.time,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) =>{
      const typeOfBooking:string = row.original.type;
      console.log(typeOfBooking);      
      return typeOfBooking ? <Badge variant={typeOfBooking === "appointment" ? "secondary":"default"}>{typeOfBooking}</Badge> :"--"
    }
  },
  {
  accessorKey: "date",
  header: ({ column }) => {
    return <DataTableColumnHeader column={column} title="Date" />;
  },
  cell: ({ row }) => {
    const dateString: Date = row.original.slot.date;
    let formattedDate = "Invalid Date";

    if (dateString && !isNaN(new Date(dateString).getTime())) {
      formattedDate = new Date(dateString).toISOString().split("T")[0]; 
    } else {
      console.error(`Invalid date value: ${dateString}`);
    }

    return formattedDate;
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
    cell: ({ row }) =>{
      const status = row.getValue("status")
      switch (status) {
        case "scheduled":
            return <span className="bg-yellow-600 px-2 py-1 rounded-sm text-white font-semibold" >Scheduled</span>;
        case "ongoing":
          return <span className="bg-blue-600 px-2 py-1 rounded-sm text-white font-semibold" >Ongoing</span>;
        case "cancelled":
          return <span className="bg-red-600 px-2 py-1 rounded-sm text-white font-semibold" >Cancelled</span>;
        case "completed":
          return <span className="bg-green-600 px-2 py-1 rounded-sm text-white font-semibold" >Completed</span>;
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
      )
    }
  }
];
