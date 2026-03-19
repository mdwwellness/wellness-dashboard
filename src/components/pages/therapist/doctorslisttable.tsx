"use client"
import { TherapistformType } from "@/type/schema";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import TherapistDetailsActionPage from "./theraipst-detail-page";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

export const DoctorsListColumn: ColumnDef<TherapistformType>[] = [
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
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => {
      const gender = row.getValue("gender")
      return gender !== undefined ? gender : "--"
    },
  },
  {
    accessorKey: "phonenumber",
    header:"Phone Number",
    cell: ({ row }) => row.getValue("phonenumber"),
  },
  {
    accessorKey: "specialization",
    header:"Specialization",
    cell: ({ row }) =>{
      const list =  row.getValue("specialization") as []
      return(
        <>
         {list?.map((val,index)=>{
            return(
              <div key={index}>
                  <span>{val}</span>
              </div>
            )
         })}
        </>
      )
      },
  },
  {
    accessorKey: "bio",
    header:"Bio",
    cell: ({ row }) => row.getValue("bio"),
  },
  {
    accessorKey: "isActive",
    header:"Is Active",
    cell: ({ row }) => {
      const state = row.getValue("isActive");
      return (
        state ? <span className="bg-green-600 px-2 py-1 rounded-sm text-white font-semibold" >Active</span> : <span className="bg-red-600 px-2 py-1 rounded-sm text-white font-semibold" >Not Active</span>
      )
    },
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
