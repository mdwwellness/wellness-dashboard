"use client"
import { DoctorsformType } from "@/type/schema";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import TherapistDetailsActionPage from "./theraipst-detail-page";
import { Button } from "../ui/button";
import { MoreHorizontal } from "lucide-react";

export const DoctorsListColumn: ColumnDef<DoctorsformType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />
    },
    cell: ({ row }) => row.getValue("name"),
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Email" />
    },
    cell: ({ row }) => row.getValue("email"),
  },
  {
    accessorKey: "phonenumber",
    header:"Phone Number",
    cell: ({ row }) => row.getValue("phonenumber"),
  },
  {
    accessorKey: "specialization",
    header:"Specialization",
    cell: ({ row }) => row.getValue("specialization"),
  },
  {
    accessorKey: "bio",
    header:"Bio",
    cell: ({ row }) => row.getValue("bio"),
  },
  {
    id: "action",
    cell: ({ row }) => {
      const details = row.original;
      return (
        <>
          <TherapistDetailsActionPage data={details}>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </TherapistDetailsActionPage>
        </>
      )
    }
  }
];
