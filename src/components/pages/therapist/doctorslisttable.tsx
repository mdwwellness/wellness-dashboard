"use client"
import { TherapistformType } from "@/type/schema";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { User } from "lucide-react";

function TherapistAvatar({ url, name }: { url?: string; name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div className="h-8 w-8 rounded-full border bg-muted overflow-hidden flex items-center justify-center shrink-0">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : initials ? (
        <span className="text-[10px] font-semibold text-muted-foreground">
          {initials}
        </span>
      ) : (
        <User className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

export const DoctorsListColumn: ColumnDef<TherapistformType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const profileImage = (row.original as TherapistformType).profileImage;
      return (
        <div className="flex items-center gap-2">
          <TherapistAvatar url={profileImage} name={name ?? ""} />
          <span>{name}</span>
        </div>
      );
    },
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
];
