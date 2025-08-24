"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";

import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User } from "@prisma/client";
import { MoreHorizontal } from "lucide-react";
import UserRoleUpdateForm from "../forms/user-role-update-form";
// import UserRoleUpdateForm from "@/forms/user-role-update-form";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const userColumns: ColumnDef<User>[] = [
  // {
  //   accessorKey: "image",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Image" />
  //   ),
  //   cell: ({ row }) => {
  //     return (
  //       <Image
  //         src="./Placeholder.svg"
  //         alt="Placeholder"
  //         width={10}
  //         height={10}
  //         className="bg-green-500 rounded-full"
  //       />
  //     )
  //   },
  // },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
  },
  {
    accessorKey: "emailVerified",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email Verified" />
    ),
    cell: ({ row }) => {
      const user = row.original;

      if (user.emailVerified !== null) {
        return <Badge variant="default">Verified</Badge>;
      }

      return <Badge variant="destructive">Not Verified</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Change role with using the dropdown menu. Click update when you done.
              </DialogDescription>
            </DialogHeader>
            <UserRoleUpdateForm user={user} />
          </DialogContent>
        </Dialog>
      );
    },
  },
];
